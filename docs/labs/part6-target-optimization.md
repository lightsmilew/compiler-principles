---
sidebar_position: 6
sidebar_label: 第六部分 · 目标代码优化
title: 第六部分 · 目标代码优化
description: 在 RISC-V64GC 目标代码层实现寄存器分配、spill 和窥孔优化
---

# 第六部分 · 目标代码优化

本部分处理第四部分生成的 RISC-V64GC 汇编。重点是寄存器分配、溢出处理和窥孔优化，目标是在保持语义的前提下减少内存访问和指令数量。

:::info[基本原理]
IR 中的临时值数量可以超过物理寄存器数量。寄存器分配决定各个值在寄存器与栈槽之间的存放位置；窥孔优化在局部指令范围内识别并消除冗余。
:::

**优化顺序可以分为两轮窥孔优化**：先建立第四部分的正确基线 → 在虚拟寄存器上做第一轮窥孔 → 重新计算活跃信息并进行寄存器分配（含 spill/reload）→ 在物理寄存器上做第二轮窥孔 → 输出汇编。每一步保留输入输出，便于定位错误。

第一轮中，虚拟寄存器的值版本可以区分开，Use-Def 关系更明确，不必先追踪同一个物理寄存器被多次复用的情况。先消除无效计算和复制，可以减少待分配的值与寄存器压力。第二轮主要清理寄存器分配、参数搬运和 spill/reload 处理产生或暴露的冗余 `move`；这时才知道两个操作数是否落在同一个物理寄存器上。

```mermaid
flowchart TB
  A["目标指令<br/>使用虚拟寄存器"] --> P1["第一轮窥孔<br/>简化计算与复制"]
  P1 --> R["重算活跃信息<br/>分配寄存器，处理 spill/reload"]
  R --> P2["第二轮窥孔<br/>消除冗余 move"]
  P2 --> O["输出 RISC-V64GC 汇编"]
```

## 一、从 Use-Def 到活跃区间

对每条目标指令编号，把每次定义视为一个独立的值版本，记录该版本的定义位置和最后一次使用位置，就得到一个活跃区间（live range）：

```asm
0: lw   t0, 0(fp)        ; 定义 v
1: add  t1, t0, a0       ; 使用 v
2: sw   t1, 4(fp)
3: add  t0, t1, a0       ; t0 重新定义
4: mul  t2, t0, t1       ; 使用新的 t0
```

上面的 `t0` 其实有两个值版本和两段活跃区间：第一段 `[0, 2)`（值 v），第二段 `[3, 5)`；同名寄存器重新定义后，不能把两段区间合并。

**算法 1 · 构造活跃区间（Build Live Ranges）**

**输入（Input）：** 带指令编号的目标汇编代码。
**输出（Output）：** 每个值版本的活跃区间列表。

```
 1: buildLiveRanges(code):
 2:     open = Map<Reg, LiveRange>();                    // 当前寄存器值版本
 3:     ranges = [];
 4:     for each incoming value r do open[r] = LiveRange(reg = r, start = 0, end = 1, used = false); end for
 5:     for i = 0 to len(code) - 1 do
 6:         for each r in usesOf(code[i]) do
 7:             if r in open then open[r].end = i + 1; open[r].used = true; end if
 8:         end for
 9:         for each r in defsOf(code[i]) do
10:             if r in open and open[r].used then ranges.push(open[r]); end if // 重新定义：结束旧版本
11:             open[r] = LiveRange(reg = r, start = i, end = i + 1, used = false);
12:         end for
13:     end for
14:     for each range in open do if range.used then ranges.push(range); end if end for
15:     return ranges;                                    // 半开区间 [start, end)
```

上面的算法先说明单个线性序列的值版本切分；跨基本块时，还要把块入口/出口的活跃值并入对应区间，并处理从函数入口传入、但在函数内没有定义的参数值。

## 二、冲突图（Interference Graph）

两个值的活跃区间一旦重叠，就不能分配同一个物理寄存器。把这种约束建模为图：

- **节点**：每个活跃区间对应的值版本；
- **边**：`A` 和 `B` 在某个程序点同时活跃 → 连一条边。

**算法 2 · 构造冲突图（Build Interference Graph）**

**输入（Input）：** 活跃区间列表。
**输出（Output）：** 冲突图 `G`。

这里的 `id` 是值版本的唯一编号；同一寄存器的不同定义必须有不同 `id`。

```
 1: buildInterference(ranges):
 2:     G = new Graph();
 3:     for each r in ranges do G.addNode(r.id); end for
 4:     for each pair (r1, r2) in ranges do
 5:         if r1.id == r2.id then continue; end if
 6:         if r1.start < r2.end and r2.start < r1.end then
 7:             G.addEdge(r1.id, r2.id);                // 区间重叠 -> 冲突
 8:         end if
 9:     end for
10:     return G;
```

示例中 `t1` 在第 4 条指令仍被使用，因此它的活跃区间是 `[1, 5)`。只观察 `t0₀`、`t1`、`t0₁` 这三个值版本，它们在各指令位置的活跃情况如下（● 表示活跃）：

| 值版本 / 活跃区间 | 0 | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- | --- |
| `t0₀ [0, 2)` | ● | ● | — | — | — |
| `t1 [1, 5)` | — | ● | ● | ● | ● |
| `t0₁ [3, 5)` | — | — | — | ● | ● |

冲突图的每条红色无向边都标出了重叠区间：相连的值必须使用不同寄存器。

```mermaid
flowchart LR
  A(("t0₀<br/>[0, 2)")) ---|"重叠 [1, 2)<br/>不能共用寄存器"| B(("t1<br/>[1, 5)"))
  B ---|"重叠 [3, 5)<br/>不能共用寄存器"| C(("t0₁<br/>[3, 5)"))
  classDef reusable fill:#e6efeb,stroke:#0e4834,color:#08291d,stroke-width:2px;
  classDef conflicting fill:#fde8e8,stroke:#b42318,color:#7a271a,stroke-width:2px;
  class A,C reusable;
  class B conflicting;
  linkStyle 0,1 stroke:#b42318,stroke-width:3px;
```

`t0₀` 与 `t0₁` 之间没有边，因为两段区间不重叠，可以复用同一个物理寄存器（图中同为绿色）；`t1` 与二者均冲突，必须使用另一个寄存器。`a0` 和 `fp` 的固定寄存器约束在分配时另行处理。

### 2.1 特殊约束：调用约定

不是所有物理寄存器都能随便用：

| 类型 | 行为 |
| --- | --- |
| 调用者保存 `t0~t6` | 调用前后值不保留，被调函数可任意修改 |
| 返回地址 `ra`（`x1`，调用者保存） | `call` / `jal` 会覆盖它；非叶函数须在再次调用前保存自己的返回地址，并在返回前恢复，不作为普通临时值的分配目标 |
| 被调用者保存 `s0~s11` | 被调函数必须保留，跨调用活跃的值优先放这里 |
| 参数寄存器 `a0~a7` | 函数入口接收参数，随后可作临时使用 |
| 返回值寄存器 `a0, a1` | 函数出口返回结果 |
| `zero` | 永远为 0，不能作为分配目标 |
| `sp`, `gp`, `tp`, `fp` | 保留给栈指针等，不能分配 |

如果一个值跨越函数调用还活跃，它要么用被调用者保存寄存器（首选），要么在调用前后保存/恢复。

寄存器保存规则参见 [RISC-V psABI 的整数寄存器约定](https://riscv-non-isa.github.io/riscv-elf-psabi-doc/#_integer_register_convention)。

### 2.2 move-aware 冲突图

`mv t0, t1` 这类传送指令会记录一对 move-related 值；只有当两段活跃区间没有冲突、且合并不会超过寄存器压力时，才可以尝试把它们放到同一物理寄存器并删除这条 `mv`。不能因为出现 `mv` 就直接跳过冲突边。

## 三、线性扫描寄存器分配

线性扫描的思路：把所有活跃区间按起点排序，从左到右扫描，维护"当前活跃区间"集合。

**算法 3 · 线性扫描寄存器分配（Linear Scan Allocation）**

**输入（Input）：** 活跃区间列表、可用物理寄存器数量 `K`。
**输出（Output）：** 每个区间分配到的寄存器或栈槽。

```
 1: linearScan(code, K):
 2:     intervals = sortByStart(buildLiveRanges(code));
 3:     active = [];                                   // 当前仍活跃的区间，按 end 排序
 4:     for each interval in intervals do
 5:     // 1. 让已经过期的区间释放寄存器
 6:         expireOldIntervals(active, interval.start);
 7:     // 2. 有空闲寄存器就直接分配
 8:         if freeRegisterExists() then
 9:             assignRegister(interval, takeFreeRegister());
10:             active.pushSortedByEnd(interval);
11:         else
12:     // 3. 否则选一个"结束最晚"的区间去 spill
13:             spill = intervalWithLatestEnd(active ∪ { interval });
14:             if spill == interval then
15:                 assignStackSlot(interval);                 // 自己就溢出
16:             else
17:                 moveRegisterTo(interval, spill.reg);       // 抢占它的寄存器
18:                 assignStackSlot(spill);
19:                 replace(active, spill, interval);
20:             end if
21:         end if
22:     end for
```

需要处理的细节：调用者保存 / 被调用者保存寄存器、参数寄存器、跨调用活跃值、spill 槽对齐。

## 四、图着色寄存器分配

图着色（Graph Coloring）是寄存器分配的经典模型：把活跃区间视为节点、冲突视为边，用 `K` 种颜色（即 `K` 个物理寄存器）着色，使每条边的两端颜色不同。`K ≥ 3` 的图着色判定问题是 NP 完全问题，所以实际实现使用启发式：

```mermaid
flowchart TD
  L[活跃变量分析] --> G[构造冲突图]
  G --> S[简化：删度小于 K 的节点并入栈]
  S --> C{还有可删节点?}
  C -- 是 --> S
  C -- 否 --> P[选 spill 候选节点]
  P --> I[插入 load/store 后重建冲突图]
  I --> L
  S -.->|全部入栈| B[回填颜色]
  B --> Q{颜色不够?}
  Q -- 是 --> P
  Q -- 否 --> R[完成分配]
```

**算法 4 · 图着色寄存器分配（Graph Coloring，简化 + 回填）**

**输入（Input）：** 冲突图 `G`、可用颜色数 `K`。
**输出（Output）：** 每个节点的颜色（物理寄存器）或 spill 标记。

```
 1: graphColoring(G, K):
 2:     stack = [];
 3:     // ---- 简化阶段：反复删除度数 < K 的节点 ----
 4:     loop
 5:         v = nodeWithDegreeLessThan(G, K);
 6:         if v != none then
 7:             stack.push(v);  G.removeNode(v);
 8:         else
 9:             if G not empty then
10:                 v = chooseSpillCandidate(G);       // 例如 cost = 使用次数 / 度数，取最小
11:                 markForSpill(v);  stack.push(v);  G.removeNode(v);
12:             end if
13:             break;
14:         end if
15:     end loop
16:     // ---- 回填阶段：按压栈逆序分配颜色 ----
17:     while stack not empty do
18:         v = stack.pop();
19:         used = colorsOfNeighbors(v);
20:         c = firstColorNotIn(used, K);
21:         if c != none then assign(v, c);
22:         else markForSpill(v); end if              // 颜色不够 -> spill
23:     end while
```

若节点被标记 spill，就把它在定义处 `store` 到栈槽、在每次使用前 `load` 回来，然后重建冲突图并重新分配，直到所有节点都能着色。

## 五、Spill / Reload

被 spill 的值需要在定义附近插入 `store`，在下一次使用前插入 `load`：

```asm
    sw   t0, 16(sp)      ; spill v（把值写回栈槽）
    ...
    lw   t0, 16(sp)      ; reload v（重新读回寄存器）
```

选择 spill 候选时通常综合考虑：区间长度（短区间优先）、跨调用次数（少跨越的优先）、使用次数（少使用的优先）、是否可 rematerialize（可重算的最适合 spill）。

## 六、目标代码窥孔优化

窥孔优化在相邻的少量目标指令中匹配模式、检查依赖，再做等价替换。可以在寄存器分配前、后各执行一轮，两轮使用不同的规则集合：

| 时机 | 主要对象 | 为什么适合此时处理 |
| --- | --- | --- |
| 第一轮：分配前 | 虚拟寄存器上的算术化简、局部复制传播 | 值版本与 Use-Def 关系较清楚，能先减少无效指令和待分配的值 |
| 第二轮：分配后 | 分配、参数搬运等产生或暴露的冗余 `move`，以及满足条件的局部访存冗余 | 物理寄存器映射已确定，能够识别自复制与不再需要的搬运 |

**第一轮示例：沿虚拟寄存器的依赖链简化。** 下方的 `v0`、`v1`、`v2` 是虚拟寄存器，不是可直接输出的汇编寄存器名：

```text
简化前：                      简化后：
addi v1, v0, 0                add v2, v0, v3
add  v2, v1, v3
```

`v1` 只是 `v0` 的副本。若 `v0` 在使用点仍是同一个值，且 `v1` 没有其它使用，就能直接替换操作数并删除复制。若还有其它使用，只能先传播，不能直接删掉定义。第一轮结束后应更新或重算活跃信息，再建立冲突图。

**第二轮示例：消除分配后暴露的自复制。**

```text
虚拟寄存器代码：              分配后：                     第二轮之后：
mv  v1, v0                    mv  t0, t0                   add t2, t0, t1
add v2, v1, v3                add t2, t0, t1
```

当复制两端的值可安全合并、都映射到 `t0` 时，`mv t0, t0` 才会显现，可以直接删除。普通的 `mv t0, t1` 仍可能承担参数传递或保存活跃值的作用，不能只因为它来自分配过程就删除。

| 规则 | 变换与条件 |
| --- | --- |
| 自复制 | `mv r, r` → 删除 |
| 加零 | `addi dst, src, 0` → `mv dst, src`；只有 `dst == src` 时才能直接删除 |
| 移位零位 | `slli dst, src, 0` → `mv dst, src`，保留原指令的位宽语义 |
| 跳到跳转 | `j L1` / `L1: j L2` → `j L2`，确认边上的复制和控制流约束仍成立 |
| 冗余 store | 相同宽度的 `lw r, slot` / `sw r, slot` → 删除 `sw`，要求地址和值未变，且不是 volatile/设备内存 |

**算法 5 · 两轮窥孔优化（Two-Stage Peephole Optimization）**

**输入（Input）：** 使用虚拟寄存器的目标指令。
**输出（Output）：** 优化后的物理寄存器目标指令。

```
 1: optimizeTarget(code):
 2:     code = peepholeToFixedPoint(code, preAllocationRules);
 3:     live = recomputeLiveness(code);                       // 第一轮可能改变 Use-Def
 4:     code = allocateRegistersWithSpill(code, live);         // spill 时重建活跃信息并迭代
 5:     code = peepholeToFixedPoint(code, postAllocationRules);
 6:     return code;
```

“分配前/后两轮”指两个执行阶段；每个阶段内部仍可重复扫描到不动点。窥孔的窗口虽小，安全条件仍可能需要活跃性、别名或调用约定信息。第二轮必须保留物理寄存器的依赖与保存约束，不能假定活跃信息永远不变；具体规则、匹配器和反例见 [窥孔优化专题](../optim/asm-peephole)。

## 七、命令行与提交物

功能样例评测调用 `-asm`，不带 `-opt`；性能样例评测调用 `-asm -opt`。编译器必须支持 `-opt`，并在该开关下启用已实现的优化。

```bash
cmake -S . -B build
cmake --build build
./compiler -asm < input.c > input.s
./compiler -asm -opt < input.c > input.opt.s
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static input.opt.s third_party/toyc/libtoyc.a -o input
./input < input.in > result.out
```

第六部分必须提交可编译的完整文件：

```text
toyc-cpp/           # 仓库目录名由你决定，此处以 toyc-cpp 为例
├── CMakeLists.txt
├── src/
└── README.md       # 简要说明编译器架构
```

`README.md` 必须包含寄存器分配算法描述（线性扫描或图着色）以及窥孔优化规则。

## 八、本部分优化项速查

| 子页面 | 涵盖主题 | 关键考点 |
| --- | --- | --- |
| [活跃区间与冲突图](../optim/asm-liveness) | 虚拟寄存器活跃区间、冲突图、调用约定、move-aware | 寄存器分配的前置 |
| [线性扫描寄存器分配](../optim/asm-linear-scan) | 扫描算法、跨调用处理、栈槽分配 | 实现简单、性能足够 |
| [图着色寄存器分配](../optim/asm-graph-coloring) | 简化、合并、冻结、spill 选择、回填颜色 | 寄存器分配的进阶方案 |
| [Spill / Reload](../optim/asm-spill) | 溢出代码模式、rematerialization、栈槽分配、spill 优化 | 不可避免的副产品 |
| [窥孔优化](../optim/asm-peephole) | 局部模式匹配、规则迭代、典型规则 | 与寄存器分配配合 |
| [强度削减](../optim/asm-strength-reduction) | 乘常量换移位与加法、派生归纳变量 | 只做可直接验证等价的局部替换；除常量换魔数属于[第五部分](../optim/ir-strength-reduction) |
