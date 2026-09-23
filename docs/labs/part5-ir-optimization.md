---
sidebar_position: 5
sidebar_label: 第五部分 · 中间代码优化
title: 第五部分 · 中间代码优化
description: 在 LLVM IR 层进行基本块、数据流分析和机器无关优化
---

# 第五部分 · 中间代码优化

本部分优化第三部分生成的 LLVM IR，**输入和输出都保持 LLVM IR 格式**。优化后的 IR 再交给第四部分目标代码生成，从而可以和未优化基线进行对比。

:::tip[先建立直觉]
中间代码优化是在 IR 上做等价变换：能提前算的提前算掉，没人用的删掉，重复的合并。目标是让代码更短更快，而程序结果保持不变。
:::

```mermaid
flowchart LR
  I[LLVM IR] --> B[基本块与 CFG]
  B --> D[Use-Def 与数据流分析]
  D --> C[常量 / 复制 / CSE]
  C --> X[死代码与控制流简化]
  X --> O[优化后的 LLVM IR]
  O --> G[第四部分代码生成]
```

## 一、基本块与数据流

基本块（Basic Block）是**单入口、单出口的最大连续指令序列**；控制流图（CFG）以基本块为节点、以跳转关系为有向边。几乎所有机器无关优化都以 CFG 为基础。

```mermaid
flowchart LR
  entry --> then
  entry --> else
  then --> join
  else --> join
```

**算法 1 · 划分基本块并构造 CFG（Build CFG）**

**输入（Input）：** 一个函数的线性 IR 指令序列。
**输出（Output）：** 基本块列表及其前驱 / 后继关系。

```
 1: buildCFG(func):
 2:     leaders = { func.first_instruction };              // 1. 找所有"首领"指令
 3:     for each instruction I in func do
 4:         if I is a jump then leaders.add(I.target); end if     // 跳转目标
 5:         if I is a terminator and I.next exists then
 6:             leaders.add(I.next);                              // 终结指令的后一条
 7:         end if
 8:     end for
 9:     blocks = splitInstructionsAt(func, leaders);       // 2. 按首领切成基本块
10:     for each block B in blocks do
11:         for each target T in successorsOf(B.terminator) do
12:             B.successors.add(T);  T.predecessors.add(B);  // 3. 建立双向边
13:         end for
14:     end for
15:     return blocks;
```

基本块的数据结构：

```
BasicBlock {
    label
    instructions
    predecessors
    successors
    use, def            // 向上暴露的使用、块内定义
    live_in, live_out   // 入口/出口活跃集合
}
```

`use` 收集在任何定义之前就被引用的 SSA 值；`def` 收集块内新定义的值。`phi` 指令既不计入 `use` 也不计入 `def`。

### 活跃变量分析

活跃变量分析是一个**反向数据流**问题：一个值在某点"活跃"，当且仅当它在这点之后还会被使用。其数据流方程为：

```text
live_out[B] = ∪ live_in[S]              for all S in successors[B]
live_in[B]  = use[B] ∪ (live_out[B] − def[B])
```

**算法 2 · 活跃变量分析（Liveness Analysis，迭代到不动点）**

**输入（Input）：** 函数 CFG 与每个基本块的 `use` / `def` 集合。
**输出（Output）：** 每个基本块的 `live_in` / `live_out`。

```
 1: liveness(cfg):
 2:     for each block B in cfg do
 3:         B.live_in = ∅;  B.live_out = ∅;
 4:     end for
 5:     repeat
 6:         changed = false;
 7:         for each block B in reversePostOrder(cfg) do     // 反向传播更快收敛
 8:             new_out = ∅;
 9:             for each S in B.successors do
10:                 new_out = new_out ∪ S.live_in;           // meet：并集
11:             end for
12:             new_in = B.use ∪ (new_out − B.def);          // transfer 函数
13:             if new_in != B.live_in or new_out != B.live_out then
14:                 B.live_in = new_in;  B.live_out = new_out;  changed = true;
15:             end if
16:         end for
17:     until not changed
18:     return cfg;
```

Use-Def 链记录每个 SSA 值的定义与使用位置：

```llvm
%t0 = add i32 %a, 1
%t1 = mul i32 %t0, 2
ret i32 %t1
```

`%t0` 的唯一 Def 是第一条指令，Use 是第二条指令；`%t1` 的唯一 Def 是第二条指令，Use 是 `ret`。优化器可以沿这条链替换值，但**不能删除仍有副作用的 `call` 或 `store`**。

## 二、机器无关优化

| 优化 | 作用 | 依据 |
| --- | --- | --- |
| 常量折叠 | 编译期直接算出常量表达式 | 操作数都是常量 |
| 常量传播 | 把已知常量替换到后续使用 | Use-Def 链 |
| 复制传播 | `x = y` 后用 `y` 替代 `x` | SSA 等价性 |
| 公共子表达式消除 | 重复的相同计算复用一次结果 | 可用表达式分析 |
| 死代码消除 | 删除结果没人用、且无副作用的计算 | 活跃变量分析 |
| 控制流简化 | 删不可达块、折叠恒真分支、合并跳转 | CFG |
| 循环优化 | 循环不变代码外提、强度削弱 | 自然循环 |

**函数调用、赋值到可观察位置和 I/O 都要视为可能有副作用**，不能仅凭"结果未被使用"就删除。

### 2.1 常量折叠与传播

**算法 3 · 常量折叠与传播（Constant Folding & Propagation）**

**输入（Input）：** 函数 IR。
**输出（Output）：** 折叠/传播后的 IR。

```
 1: foldAndPropagate(func):
 2:     worklist = allInstructions(func);
 3:     while worklist not empty do
 4:         I = worklist.pop();
 5:         if allOperandsAreConstant(I) and isPure(I) then
 6:             value = evaluate(I.opcode, I.operands);    // 编译期求值
 7:             replaceAllUsesWith(I.result, Constant(value));
 8:             markDead(I.result);                         // 原指令变为死代码
 9:         else if I.opcode == 'phi' then
10:             if allIncomingValuesEqual(I) then replaceAllUsesWith(I.result, I.incoming[0]); end if
11:         end if
12:         pushUsersIntoWorklist(I.result);                // 使用者可能因替换而变得可折叠
13:     end while
```

例如：

```llvm
%x = add i32 2, 3
%y = mul i32 %x, 4
ret i32 %y
```

常量传播和折叠后可以直接变为：

```llvm
ret i32 20
```

**替换顺序很重要**：应先建立 Use-Def，再替换操作数，最后删除没有 Use 且无副作用的指令，避免先删除 Def 导致悬空 Use。此外 `phi` 节点必须**所有入边常量一致**才能传播。

### 2.2 死代码消除

**算法 4 · 死代码消除（Dead Code Elimination, DCE）**

**输入（Input）：** 函数 IR。
**输出（Output）：** 删除无用指令后的 IR。

```
 1: dce(func):
 2:     worklist = [];
 3:     for each I in func do
 4:         if hasNoUses(I.result) and isPure(I) then worklist.push(I); end if
 5:     end for
 6:     while worklist not empty do
 7:         I = worklist.pop();
 8:         if I is already removed then continue; end if
 9:         for each operand V of I do
10:             removeUse(V, I);
11:             if hasNoUses(V) and isPure(definingInstruction(V)) then
12:                 worklist.push(definingInstruction(V));    // 连锁删除
13:             end if
14:         end for
15:         remove(I);
16:     end while
```

一条指令是"死"的，当且仅当：**它的结果不出现在任何活跃变量集合中**，且**它本身没有可观察副作用**（不是 `store`、`call`、`br`、I/O 等）。

### 2.3 公共子表达式消除（CSE）

如果同一表达式在**支配路径**上被求值多次，且操作数没有改变，第二次及以后可以直接复用第一次的结果：

```llvm
%a = add i32 %x, 1
%b = mul i32 %a, 2
%c = add i32 %x, 1      ; 与 %a 完全相同 -> CSE 候选
%d = mul i32 %c, 3      ; 改写为 mul %a, 3
```

CSE 依赖**可用表达式分析**（一个前向数据流问题）：

```text
AE_gen[B]  = { expr(I) : I 是块 B 中的纯表达式指令 }
AE_kill[B] = { expr(I') : I' 是块 B 中对某操作数有重定义的指令 }
AE_in[B]   = AE_gen[B] ∪ (AE_out[B] − AE_kill[B])
AE_out[B]  = ∩ AE_in[P]                for all P in successors[B]
```

若 `expr(I) ∈ AE_in[B]`，说明该表达式在到达 `B` 的支配路径上已经求过值，可删除 `I` 并把后续 use 替换为之前的 SSA 值。更激进的版本是 GVN（Global Value Numbering），它能识别"字面不同但等价"的表达式（如 `x+y` 与 `y+x`）。

### 2.4 控制流简化

把"没意义"或"过于复杂"的控制流压扁：

```llvm
; 恒真分支
br i1 true, label %T, label %F     ; 等价于 br label %T；%F 变为不可达
; 跳转到跳转
br label %L1
L1: br label %L2                   ; 等价于把前一条 br 改为 br label %L2
```

简化后，不可达块内的指令会被 DCE 全部删除；`phi` 若只剩一条入边则退化为普通 move。控制流简化通常与 DCE **配合成对迭代**，直到不再变化。

### 2.5 循环不变代码外提（LICM）

如果一条指令的所有操作数在循环外都已知，它的结果每次迭代都相同，可以安全地把它移到循环外（通常移到循环的预头块 preheader）执行一次。注意：循环内的 `store` / `call` 可能有副作用，**禁止外提**。

## 三、优化管线与迭代

各优化之间存在依赖，通常需要循环迭代到不动点：

```mermaid
flowchart LR
  A[常量折叠] --> B[复制传播]
  B --> C[常量传播]
  C --> D[公共子表达式消除]
  D --> E[死代码消除]
  E --> F[控制流简化]
  F --> Q{本轮有改动?}
  Q -- 是 --> A
  Q -- 否 --> End[达到不动点]
```

几个观察：

- **折叠 → 传播**：折叠后才能产生新的常量定义，传播才能继续替换；
- **传播 → DCE**：传播后旧定义失去 use，交给 DCE 删除；
- 这套循环通常只需 **2~3 轮**就达到不动点。

## 四、验证命令

```bash
cmake -S . -B build
cmake --build build
./compiler --dump-ir < input.c > input.ll
./compiler --dump-ir --opt < input.c > input.opt.ll
./compiler --dump-asm < input.c > input.s
./compiler --dump-asm -opt < input.c > input.opt.s
```

分别链接并运行两个版本，比较输出和退出码；同时报告 **IR 指令数、基本块数**和优化前后差异。

## 五、提交物

第五部分必须提交可编译的完整优化器文件：

```text
toyc-cpp/           # 仓库目录名由你决定，此处以 toyc-cpp 为例
├── CMakeLists.txt
├── src/
├── third_party/toyc/libtoyc.a
├── README.md       # 简要说明编译器架构
```

`README.md` 需要说明本阶段实现的优化内容与实现思路。

## 六、本部分优化项速查

| 子页面 | 涵盖主题 | 关键考点 |
| --- | --- | --- |
| [基本块与 CFG](../optim/ir-cfg) | 基本块划分、控制流图、活跃变量 | 所有优化的前置 |
| [死代码消除](../optim/ir-dce) | 活跃分析 DCE、Use-Def DCE、不可达代码 | 与 CFG 简化配合迭代 |
| [常量折叠 / 传播 / 复制传播](../optim/ir-cprop) | 编译期折叠、SSA 传播、代数恒等式 | 优化管线第一档 |
| [公共子表达式消除（CSE）](../optim/ir-cse) | 可用表达式分析、局部/全局 CSE、GVN 简介 | 支配路径上复用 |
| [控制流简化](../optim/ir-cfg-simplify) | 不可达块、恒真分支、块合并、phi 退化 | 与 DCE 配对执行 |
| [循环不变代码外提（LICM）](../optim/ir-licm) | 自然循环、预头、不变指令判定、外提 | 减少循环体指令 |