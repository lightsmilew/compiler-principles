---
sidebar_position: 4
sidebar_label: 第四部分 · 目标代码生成
title: 第四部分 · 目标代码生成
description: 将 LLVM IR 翻译为 RISC-V64GC 汇编，建立可运行的后端基线
---

# 第四部分 · 目标代码生成

本部分把第三部分生成的 LLVM IR 翻译为**可运行的 RISC-V64GC 汇编**。先完成正确的基线后端，再在第五、六部分分别优化 IR 和目标代码。尽管我们把寄存器分配放在了优化部分，但实现寄存器分配的编译器尚且才算一个完整的编译器，因此完成该部分实验，**你们必须要实现一种寄存器分配算法**。

:::tip[先建立直觉]
目标代码生成是编译的最后一步：把与机器无关的 IR 变成能在 RISC-V 上运行的汇编，主要解决三件事——用哪些指令、每个值放进哪个寄存器、放不下的值放到栈里的什么位置。
:::

```mermaid
flowchart LR
  I[LLVM IR] --> S[指令选择]
  S --> A[寄存器分配]
  A --> F[栈帧布局]
  F --> C[调用约定]
  C --> O[RISC-V64GC 汇编]
  O --> L[libtoyc.a 静态链接]
  O --> Q[QEMU 运行测试]
```

## 一、整体流程

后端按"模块 → 函数 → 基本块 → 指令"四级递归处理：

**算法 1 · 后端整体流程（Module → Function → Block）**

**输入（Input）：** LLVM `module`（或自定义 IR）。
**输出（Output）：** RISC-V64GC 汇编文本。

```
 1: codegenModule(module):
 2:     output(".text");
 3:     for each func in module.functions do
 4:         if is_declaration(func) then continue; end if   // 只有声明，跳过
 5:         codegenFunction(func);
 6:     end for
 7:
 8: codegenFunction(func):
 9:     frame = computeFrameLayout(func);        // 第 3 步：先算栈帧（算法 5）
10:     emitPrologue(func, frame);               // 第 1 步：序言（算法 6）
11:     for each block in func.blocks do
12:         codegenBlock(block);                 // 第 2 步：逐块翻译
13:     end for
14:     emitEpilogue(func, frame);               // 第 4 步：尾声
15:
16: codegenBlock(block):
17:     emitLabel(block.name);
18:     for each instr in block.instructions do
19:         codegenInstruction(instr);           // 见算法 3
20:     end for
21:     emitTerminator(block.terminator);        // br / ret
```

:::warning[重要原则]
**寄存器分配和栈帧布局的顺序不能颠倒**——必须先确定哪些值需要 spill 到栈上，再决定栈帧大小和偏移量。
:::

## 二、指令选择

指令选择是后端的核心：把 LLVM IR 的每条指令映射为一条或多条 RISC-V 指令。映射关系并非总是一对一，需要分情况处理。

### 2.1 一对一映射（简单情况）

大多数算术和比较指令可以一一对应：

| LLVM IR | RISC-V | 说明 |
| --- | --- | --- |
| `add i32 %a, %b` | `add a0, a0, a1` | 32 位加法 |
| `sub i32 %a, %b` | `sub a0, a0, a1` | 32 位减法 |
| `mul i32 %a, %b` | `mul a0, a0, a1` | 乘法 |
| `sdiv i32 %a, %b` | `divw a0, a0, a1` | 有符号除法 |
| `srem i32 %a, %b` | `remw a0, a0, a1` | 取模 |
| `icmp slt i32 %a, %b` | `slt a0, a0, a1` | 小于比较 |
| `icmp sgt ...` | `sgt a0, a0, a1` | 大于比较 |
| `and i32 %a, %b` | `and a0, a0, a1` | 按位与 |
| `or i32 %a, %b` | `or a0, a0, a1` | 按位或 |
| `xor i32 %a, %b` | `xor a0, a0, a1` | 按位异或 |
| `shl i32 %a, %b` | `sllw a0, a0, a1` | 左移 |
| `lshr i32 %a, %b` | `srlw a0, a0, a1` | 逻辑右移 |

一对一映射的实现最简单：一条 IR 指令 → 一条 RISC-V 指令。

### 2.2 需要多条指令的映射（复杂情况）

以下 IR 指令无法直接对应一条 RISC-V 指令，需要分解。

#### icmp → 条件跳转或 set 指令

**问题**：`icmp` 把比较结果存进一个 SSA 值（0/1），而 RISC-V 的 `blt` 等跳转指令直接根据比较结果跳转，两者语义不同。要分两种用途处理。

**方案 A（直接翻译成跳转）**：如果 `icmp` 的结果只用于 `br i1`，直接翻译为条件跳转：

```llvm
%cmp = icmp slt i32 %a, %b
br i1 %cmp, label %then, label %else
```

```asm
    lw    t0, offset_a
    lw    t1, offset_b
    blt   t0, t1, .Lthen      ; 比较 + 跳转二合一，无需存放比较结果
    j     .Lelse
```

:::info
RISC-V 的 `blt` / `bge` 等是"先比较、后跳转"，效果等同于"先执行 icmp，再 br i1"。如果 `icmp` 的结果只用于条件跳转，比较结果无需存入寄存器。
:::

**方案 B（翻译为 set 指令）**：如果 `icmp` 的结果需要存入变量：

```llvm
%cmp = icmp slt i32 %a, %b
%result = zext i1 %cmp to i32
store i32 %result, ptr %x
```

```asm
    lw    t0, offset_a
    lw    t1, offset_b
    slt   t2, t0, t1          ; t2 = (a < b) ? 1 : 0
    sw    t2, offset_x
```

#### zext i1 → 直接使用比较结果

把 `i1` 扩展为 `i32`（0 → 0，1 → 1）。RISC-V 寄存器是 64 位，`i1` 在寄存器里本身就是 0/1，因此**大多数情况直接复制即可**；只有在需要"取反"语义时才用 `seqz` / `snez` 之类的指令：

```llvm
%b = zext i1 %a to i32
```

```asm
    ; 零扩展在寄存器层面就是同一表示，通常无需额外指令
    mv    t1, t0              ; 直接复制

    ; 若语义是 "值为 0 时为真"，可用：
    seqz  t1, t0              ; t1 = (t0 == 0) ? 1 : 0
```

#### load / store

```
load i32, ptr %ptr_val        ->   lw   dest, 0(src_reg)
store i32 %val, ptr %ptr_val  ->   sw   src_reg, 0(dest_reg)
```

注意：LLVM IR 中 load/store 的地址是 SSA 值，RISC-V 中需要先把地址加载到寄存器，再做内存操作。

#### alloca → 栈槽分配

`alloca` 在 IR 生成阶段创建了局部变量的栈槽，后端只需要为其分配固定偏移量：

```llvm
%x = alloca i32
```

```asm
    ; 栈帧布局时计算偏移，例如 x 在 fp-4
    ; 使用时：lw t0, -4(fp)
```

### 2.3 phi 消除

**问题**：`phi` 是 SSA 特有的指令，RISC-V 中没有对应硬件指令。

**分析**：每个 `phi` 出现在基本块入口，表示"从不同前驱边进入时取不同值"。而在顺序执行的 RISC-V 中，进入一个基本块时控制流来自某个确定的前驱块。因此，可以把 phi 的"选值"动作**提前到每个前驱块的末尾**执行：

```mermaid
flowchart TD
  E[entry] --> CI["cond = icmp ..."]
  CI -->|真| T["then: val_a"]
  CI -->|假| F["else: val_b"]
  T --> J["join: phi 按前驱选值"]
  F --> J
  J --> R["ret %result"]
```

```llvm
; 原始 IR
entry:
    br i1 %cond, label %then, label %else
then:
    %val_a = add i32 %x, 1
    br label %join
else:
    %val_b = sub i32 %x, 1
    br label %join
join:
    %result = phi i32 [ %val_a, %then ], [ %val_b, %else ]
    ret i32 %result
```

**消除思路**：`then` 分支把 `%val_a` 复制到 `%result` 的存放位置，`else` 分支把 `%val_b` 复制过去，`join` 入口就不再需要任何指令。

**算法 2 · phi 消除（Phi Elimination）**

**输入（Input）：** 含 `phi` 指令的函数。
**输出（Output）：** 不含 `phi` 的等价函数。

```
 1: eliminatePhi(func):
 2:     for each block in func.blocks do
 3:         for each phi in block.phis do
 4:             dest = allocateLocation(phi.result);         // phi 结果的存放位置
 5:             for each (value, pred) in phi.args do
 6:                 // 在前驱块 pred 的终结指令之前插入复制
 7:                 insertCopyBeforeTerminator(pred, value, dest);
 8:             end for
 9:             remove(phi);                                  // phi 本身不再生成
10:         end for
11:     end for
```

**注意"并行拷贝"问题**：一个基本块入口可能有多条 `phi`，它们之间可能互相引用（例如 `phi1 = phi[phi2, ...]`、`phi2 = phi[phi1, ...]`），必须**同时**更新，否则会覆盖还没读完的值。解决办法是引入临时寄存器或临时槽，先全部读出、再全部写入：

**算法 3 · 并行拷贝式的 phi 前驱复制（Parallel Copy at Predecessors）**

**输入（Input）：** 基本块 `block` 及其所有前驱。
**输出（Output）：** 在前驱块末尾注入的复制序列。

```
 1: processPhiBlock(block):
 2:     phi_args = Map<dest, List<(value, pred)>>;           // 每个 phi 的各条入边
 3:     for each phi in block.phis do
 4:         for each (val, pred) in phi.args do
 5:             phi_args[phi.result].append((val, pred));
 6:         end for
 7:     end for
 8:     for each pred in block.predecessors do
 9:         for each (val, dest) whose edge comes from pred do
10:             tmp = tempReg(pred);                          // 先写入临时，避免相互覆盖
11:             emitCopy(val, tmp);
12:             emitStore(tmp, slotOf(dest));
13:         end for
14:     end for
```

**保守做法**：如果不想处理并行拷贝，也可以给每个 SSA 值都分配独立栈槽，让 `phi` 退化成"从前驱块写入槽、在入口读出槽"。实现更简单，但会产生较多 `lw` / `sw`，可以作为基线，之后再优化。

### 2.4 指令选择主循环

**算法 4 · 指令选择主循环（Instruction Selection Dispatcher）**

**输入（Input）：** 一条 IR 指令 `instr`。
**输出（Output）：** 对应的 RISC-V 指令序列。

```
 1: codegenInstruction(instr):
 2:     switch instr.opcode:
 3:         case 'add':   emitBinary("add",  instr);  break;   // 算术
 4:         case 'sub':   emitBinary("sub",  instr);  break;
 5:         case 'mul':   emitBinary("mul",  instr);  break;
 6:         case 'sdiv':  emitBinary("divw", instr);  break;
 7:         case 'srem':  emitBinary("remw", instr);  break;
 8:         case 'and':   emitBinary("and",  instr);  break;   // 位运算
 9:         case 'or':    emitBinary("or",   instr);  break;
10:         case 'xor':   emitBinary("xor",  instr);  break;
11:         case 'shl':   emitBinary("sllw", instr);  break;
12:         case 'lshr':  emitBinary("srlw", instr);  break;
13:         case 'icmp':  emitICmp(instr);            break;   // 比较（方案 A/B）
14:         case 'zext':  emitCopy(instr);            break;   // 类型转换
15:         case 'load':  emitLoad(instr);            break;   // 内存
16:         case 'store': emitStore(instr);           break;
17:         case 'br':                                          // 控制流
18:             if arity(instr) == 1 then emit("j " + instr.dest);
19:             else emitCondBr(instr); end if
20:             break;
21:         case 'ret':   emitRet(instr);             break;
22:         case 'call':  emitCall(instr);            break;   // 调用，见算法 5
23:         case 'alloca': /* 在栈帧布局中处理，此处不生成代码 */ break;
24:         case 'phi':    /* 已在前置 pass 消除 */ break;
25:         default:      error("unsupported instruction: " + instr.opcode);
26:     end switch
```

其中二元指令的统一处理为：

```
emitBinary(mnemonic, instr):
    lhs = resolve(instr.operand[0]);          // SSA 值 -> 实际位置（寄存器或栈槽）
    rhs = resolve(instr.operand[1]);
    loadToRegister(lhs, t0);
    loadToRegister(rhs, t1);
    emit(mnemonic + " t2, t0, t1");
    storeToLocation(t2, instr.result);        // 写回目标位置
```

## 三、函数调用与参数传递

### 3.1 RISC-V 调用约定（RV64GC LP64D）

```mermaid
flowchart LR
  A["第 1 个参数"] --> A0["a0"]
  B["第 2 个参数"] --> A1["a1"]
  C["第 3~8 个参数"] --> A2["a2 ~ a7"]
  D["第 9 个及以后"] --> ST["溢出到栈"]
  R["返回值"] --> RA0["a0"]
```

| 参数位置 | 整数参数 | 浮点参数 |
| --- | --- | --- |
| 第 1 个 | `a0` | `fa0` |
| 第 2 个 | `a1` | `fa1` |
| 第 3–8 个 | `a2–a7` | `fa2–fa7` |
| 第 9 个起 | 溢出到栈 | 溢出到栈 |

返回值：`a0`（整数）/ `fa0`（浮点）。此外还要遵守：**栈 16 字节对齐**、保存/恢复返回地址 `ra`、被调用者保存寄存器（`s0–s11`）。

### 3.2 参数传递的实现

**算法 5 · 函数调用生成（emitCall）**

**输入（Input）：** `call` 指令（被调函数与实参列表）。
**输出（Output）：** 准备参数、调用、取返回值的指令序列。

```
 1: emitCall(instr):
 2:     func = instr.callee;  args = instr.arguments;
 3:     // 1. 溢出参数（第 9 个及以后）写入栈溢出区
 4:     for i = 8 to len(args) - 1 do
 5:         loc = resolve(args[i]);
 6:         storeToStack(loc, frame.arg_slots[i]);
 7:     end for
 8:     // 2. 前 8 个参数放入 a0 ~ a7
 9:     for i = 0 to min(7, len(args) - 1) do
10:         loadToRegister(resolve(args[i]), arg_reg[i]);   // arg_reg[i] = a0..a7
11:     end for
12:     // 3. 如果调用会破坏 caller-saved 寄存器中的活跃值，先保存
13:     emitPushLiveCallerSaved();
14:     emit("call " + func.name);                         // 4. 调用
15:     emitPopLiveCallerSaved();                          // 5. 恢复
16:     // 6. 取返回值
17:     if instr.result != none then
18:         storeToLocation(a0, instr.result);              // 返回值在 a0
19:     end if
```

**溢出参数的具体做法**：

- **调用者**负责在栈上分配溢出区（在当前栈帧内）；
- 溢出参数按**从右到左**的顺序压栈，使第 9 个参数落在最低地址（`sp + 0`），被调函数用 `sp` + 固定偏移访问。

```asm
    ; 假设有 9 个整数参数 arg0 ~ arg8
    ; arg0->a0, arg1->a1, ..., arg7->a7, arg8 溢出到栈
    addi  sp, sp, -16        ; 分配溢出区（16 字节，容纳 arg8）
    lw    t0, offset_arg8
    sw    t0, 0(sp)          ; arg8 溢出到 sp+0
    lw    a0, offset_arg0
    lw    a1, offset_arg1
    ; ... 其余参数 -> a2 ~ a7
    call  my_func
    addi  sp, sp, 16         ; 回收溢出区
```

### 3.3 extern 库函数调用

`getint`、`putint` 等运行时库函数通过 `declare` 引入，调用方式与普通函数完全相同：

```llvm
declare i32 @getint()
declare void @putint(i32)
```

```asm
    ; x = getint()
    call   getint            ; 返回值在 a0
    sw     a0, offset_x      ; 存入变量槽

    ; putint(x)
    lw     a0, offset_x      ; 参数放入 a0
    call   putint
```

## 四、栈帧布局

### 4.1 栈帧结构

```
高地址 ──────────────────────── 低地址
│ 溢出参数区(第9+个参)           │ ← 由调用者分配（调用其他函数时）
├─────────────────────────────┤ ← sp 入口
│ 保存的 ra                    │ 8 bytes
├─────────────────────────────┤
│ 保存的 s0 (fp)               │ 8 bytes
├─────────────────────────────┤
│ 保存的 s1~s11(若使用)         │ 每个 8 bytes
├─────────────────────────────┤
│ 局部变量槽(alloca)            │
├─────────────────────────────┤
│ 临时寄存器 spill 槽           │ 溢出时
├─────────────────────────────┤
│ 对齐填充(保证16字节对齐)       │
└─────────────────────────────┘ ← 最终 sp
```

### 4.2 栈帧布局算法

**算法 6 · 栈帧布局（computeFrameLayout）**

**输入（Input）：** 函数 `func`（含 alloca 列表、用到的被调用者保存寄存器、需要 spill 的 SSA 值）。
**输出（Output）：** 栈帧大小与各槽偏移 `FrameLayout`。

```
 1: computeFrameLayout(func):
 2:     frame = FrameLayout();  off = 0;
 3:     // 1. 为每个 alloca 分配栈槽
 4:     for each alloca a in func.allocas do
 5:         frame.slot_offsets[a] = off;
 6:         off += alignedSize(a.type);              // 按 8 字节对齐累加
 7:     end for
 8:     // 2. 保存返回地址与帧指针
 9:     frame.ra_offset = off;  off += 8;
10:     frame.fp_offset = off;  off += 8;
11:     // 3. 保存被调用者保存寄存器（用到才保存）
12:     for each reg in usedCalleeSaved(func) do
13:         frame.saved_reg_offsets[reg] = off;  off += 8;
14:     end for
15:     // 4. 为需要 spill 的 SSA 值分配槽（寄存器分配阶段填入）
16:     for each v in func.spilled_values do
17:         frame.slot_offsets[v] = off;  off += 8;
18:     end for
19:     // 5. 栈帧大小按 16 字节对齐
20:     frame.frame_size = align16(off);
21:     return frame;
```

### 4.3 序言和尾声

**算法 7 · 函数序言与尾声（Prologue / Epilogue）**

**输入（Input）：** 函数 `func` 与栈帧 `frame`。
**输出（Output）：** 汇编序言与尾声。

```
 1: emitPrologue(func, frame):
 2:     emit(".text");
 3:     emit(".globl " + func.name);
 4:     emit(func.name + ":");
 5:     emit("  addi sp, sp, -" + frame.frame_size);   // 开栈帧
 6:     emit("  sd   ra, " + frame.ra_offset + "(sp)"); // 保存返回地址
 7:     emit("  sd   s0, " + frame.fp_offset + "(sp)"); // 保存旧帧指针
 8:     emit("  add  s0, sp, zero");                    // fp = sp
 9:
10: emitEpilogue(func, frame):
11:     emit(func.name + "_epilogue:");
12:     emit("  ld   ra, " + frame.ra_offset + "(sp)"); // 恢复返回地址
13:     emit("  ld   s0, " + frame.fp_offset + "(sp)"); // 恢复帧指针
14:     emit("  addi sp, sp, " + frame.frame_size);     // 关栈帧
15:     emit("  ret");
```

## 五、全局变量与常量

### 5.1 全局变量的生成

```llvm
@global_var = global i32 0
```

```asm
    .data
    .globl global_var
global_var:
    .word 0
```

:::note[ToyC 的全局变量]
基础 ToyC 文法只含 `int` 标量全局变量，因此只需 `.word`。若你实现了数组等扩展类型，再按下面的方式为数组预留空间。
:::

```asm
    .globl array
array:
    .zero 40                     ; 例如 10 个 int：10 * 4 = 40 字节
```

### 5.2 大型立即数（常量池）

RISC-V 的立即数指令 `lui` + `addi` 配合最多能表示 32 位有符号立即数。因此 `-2048 ~ 2047` 范围内的常数可以用 `li` 伪指令直接编码，无需常量池；超出范围才需要放进**常量池**（`.rodata` 段）：

```llvm
@big_const = constant i32 0x12345678
%val = load i32, ptr @big_const
```

```asm
    .section .rodata
big_const:
    .word 0x12345678

    .text
    la    t0, big_const
    lw    t1, 0(t0)              ; t1 = 0x12345678
```

### 5.3 字符串常量（超出基础 ToyC 文法）

:::note
基础 ToyC 文法**不含字符串字面量**，运行时库也只提供 `getint` / `putint`。本小节仅在你自行扩展语言特性、需要输出字符串时参考。
:::

```llvm
@.str = private constant [6 x i8] c"Hello\00"
```

```asm
    .section .rodata
.str:
    .asciz "Hello"
```

## 六、错误处理与退出码

基线后端在遇到错误时必须**优雅退出，不允许崩溃**：

| 错误类型 | 处理方式 |
| --- | --- |
| 未识别的 opcode | 向 stderr 输出 `error: unsupported instruction`，退出码 1 |
| 调用未声明函数 | 向 stderr 输出 `error: undefined function: <name>`，退出码 1 |
| 引用未声明变量 | 向 stderr 输出 `error: undefined variable: <name>`，退出码 1 |
| 除零 | 由 RISC-V 硬件 trap 或运行时库处理 |

## 七、命令行与提交物

```bash
cmake -S . -B build
cmake --build build
./compiler --dump-asm < input.c > input.s
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static input.s third_party/toyc/libtoyc.a -o input
./input < input.in > result.out
```

必须提交可编译的完整文件：

```text
toyc-cpp/           # 仓库目录名由你决定，此处以 toyc-cpp 为例
├── CMakeLists.txt
├── src/
│    ├── asm_backend.cpp     # 主要后端逻辑
│    ├── frame_layout.cpp    # 栈帧布局
│    ├── instruction_sel.cpp # 指令选择
│    └── riscv_abi.cpp       # 调用约定
├── third_party/toyc/libtoyc.a
├── README.md                # 简要说明编译器架构
```

`README.md` 应包含指令选择表、phi 消除策略、参数传递方式、栈帧布局和基线测试结果。基线测试应包含至少 5 个测试用例的汇编输出。

寄存器分配改进和窥孔优化放到第六部分。