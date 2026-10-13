---
sidebar_position: 1
sidebar_label: 活跃区间与冲突图
title: 活跃区间与冲突图
description: 寄存器分配的前置步骤：从汇编建立活跃区间，构造冲突图
---

# 活跃区间与冲突图

寄存器分配的目标是把虚拟寄存器映射到物理寄存器。两个值如果同时活跃，
就不能分配同一个寄存器；表示这种约束的结构叫冲突图（interference graph）。
构造冲突图依赖活跃性：某程序点的值是否可能在后续路径上被读取。实际 live range 可以由多个不连续片段组成；单一 `[start,end)` 是保守的区间近似。

## 一、为什么从汇编而不是 LLVM IR？

第四部分生成的目标汇编中，每条指令都已绑定到具体的虚拟寄存器。
SSA IR 也能分析活跃值数量与寄存器压力，但实际分配还需要目标指令的寄存器类别、固定参数寄存器、调用 clobber 等信息。因此这里在指令选择后的机器 IR 上分配虚拟寄存器，再输出物理寄存器汇编。

## 二、活跃区间

### 2.1 概念

```text
活跃区间 [start, end)
  start: 某个值版本被定义的指令编号
  end:   该值版本最后一次被使用位置的后一位
```

```asm
0:lw   t0, 0(fp)        # 定义 v
1:add  t1, t0, a0       # 使用 v
2:sw   t1, 4(fp)        # 写 t1
3:add  t0, t1, a0       # t0 重新定义；旧值 v 的活跃区间 [0, 2) 结束
4:mul  t2, t0, t1       # t2 用 t0 和 t1
```

上面的 `t0` 实际上有两个区间：第一个 `[0, 2)`（v 用途）、第二个 `[3, 5)`；`t2` 在示例中没有后续使用，可以不进入冲突图。

### 2.2 构造

对每条汇编指令编号，扫描指令序列：

**算法 1 · 构造活跃区间（Build Live Ranges）**

**输入（Input）：** 已编号的汇编指令序列。
**输出（Output）：** 每个值版本的活跃区间 `[start, end)`。

```
 1: buildLiveRanges(code):
 2:     open = Map<Reg, LiveRange>();                     // 当前寄存器值版本
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

### 2.3 跨越基本块

上面的算法计算单个基本块内的局部活跃区间。函数内的活跃区间还需要结合跨基本块的数据流信息：

```text
活区间 = union(块内 [def, last_use]) ∪ block-entry-live ∪ block-exit-live
```

实现时先做反向数据流分析（与 [基本块与 CFG](ir-cfg) 中的活跃变量类似，但对象是虚拟寄存器），再用上面的算法在块内构造。

## 三、冲突图（Interference Graph）

两个值版本的活跃区间重叠时，这两个版本不能共用同一个物理寄存器。
把这种约束建模为图：

```text
节点：每个活跃区间对应的值版本
边：A 和 B 同时在某个程序点活跃 → (A, B) ∈ E
```

构造：

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
 7:             G.addEdge(r1.id, r2.id);                  // 区间重叠 -> 连边
 8:         end if
 9:     end for
10:     return G;                                        // move 相关边在合并阶段再处理
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

## 四、特殊约束：调用约定

寄存器分配需要遵循以下调用约定：

| 类型 | 行为 |
| --- | --- |
| 调用者保存 `t0~t6` | 调用前后值不保留，被调函数可任意修改 |
| 返回地址 `ra`（`x1`，调用者保存） | `call` / `jal` 会覆盖它；非叶函数须在再次调用前保存自己的返回地址，并在返回前恢复，不作为普通临时值的分配目标 |
| 被调用者保存 `s0~s11` | 当前函数若使用这些寄存器，必须保存并恢复；采用帧指针时 s0/fp 被保留 |
| 参数寄存器 `a0~a7` | 函数入口接收参数，前几条指令活跃；之后可作为临时 |
| 返回值寄存器 `a0, a1` | ToyC 的 int 返回使用 a0；a1 只涉及更宽或复合返回值 |
| `zero` | 永远为 0，不能作为分配目标 |
| `sp`, `gp`, `tp`, `fp` | 保留给栈指针等，不能分配 |

```cpp
bool is_allocatable(int phys_reg) {
    return phys_reg != SP && phys_reg != GP && phys_reg != TP
        && phys_reg != ZERO && phys_reg != FP && phys_reg != RA;
}
```

如果一个值跨越函数调用还活跃，它要么用被调用者保存寄存器（首选），要么在调用前后保存/恢复。

寄存器保存规则参见 [RISC-V psABI 的整数寄存器约定](https://riscv-non-isa.github.io/riscv-elf-psabi-doc/#_integer_register_convention)。

## 五、move-aware 冲突图

简单的重叠区间算法会为 move 的源与目标保守地连边，从而损失合并机会。构图时，对 `dst = mv src` 可从该指令 live-out 集合中排除 `src`，再为 `dst` 与其它活跃值连边，并记录 move 对；其它位置产生的真实冲突必须保留。
之后按保守合并判据尝试让 move 对共用物理寄存器。

```cpp
for (auto& I : code) {
    if (I.is_move()) {
        move_pairs.push_back({I.dst(), I.src()});    // 标记 move 相关
    }
}
```

后续分配时若发现两个 move-related 的虚拟寄存器分到了同一物理寄存器，就删除这条 `mv`。

## 六、应用

得到冲突图后，分配算法即可工作：

- [线性扫描](asm-linear-scan)：按活跃区间起点扫描，无需冲突图；
- [图着色](asm-graph-coloring)：直接在冲突图上做 K 着色。

下一步阅读：[线性扫描寄存器分配](asm-linear-scan)。
