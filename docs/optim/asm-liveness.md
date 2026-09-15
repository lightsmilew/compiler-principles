---
sidebar_position: 1
sidebar_label: 活跃区间与冲突图
title: 活跃区间与冲突图
description: 寄存器分配的前置步骤：从汇编建立活跃区间，构造冲突图
---

# 活跃区间与冲突图

寄存器分配的目标是把虚拟寄存器映射到物理寄存器。两个值如果同时活跃，
就不能分配同一个寄存器；表示这种约束的结构叫冲突图（interference graph）。
构造冲突图依赖活跃区间（live range）——一个值从定义点到最后一次使用的连续区间。

## 一、为什么从汇编而不是 LLVM IR？

第四部分生成的目标汇编中，每条指令都已绑定到具体的虚拟寄存器。
IR 层的 SSA 值是无限的，到了汇编层才有"寄存器压力"的概念。
所以寄存器分配的对象是汇编层的虚拟寄存器，不是 IR 层的 SSA 值。

## 二、活跃区间

### 2.1 概念

```text
活跃区间 [start, end)
  start: 值第一次被定义的指令编号
  end:   值最后一次被使用的指令编号
```

```asm
0: lw   t0, 0(fp)        ; 定义 v
1: add  t1, t0, a0       ; 使用 v
2: sw   t1, 4(fp)        ; 写 t1
3: add  t0, t1, a0       ; t0 重新定义；旧值 v 的活跃区间 [0, 1] 结束
4: mul  t2, t0, t1       ; t2 用 t0 和 t1
```

上面的 `t0` 实际上有两个区间：第一个 `[0, 1]`（v 用途）、第二个 `[3, 4]`。

### 2.2 构造

对每条汇编指令编号，扫描指令序列：

```cpp
struct LiveRange {
    int start, end;
    int reg;
};
vector<LiveRange> build_live_ranges(const vector<Instruction>& code) {
    // 1. 找到每个 reg 的最后使用位置
    map<int, int> last_use;
    for (int i = 0; i < code.size(); i++) {
        for (int r : code[i].uses()) last_use[r] = i;
    }
    // 2. 找到每个 reg 的第一次定义
    map<int, int> first_def;
    for (int i = 0; i < code.size(); i++) {
        for (int r : code[i].defs()) {
            if (!first_def.count(r)) first_def[r] = i;
        }
    }
    // 3. 配对
    vector<LiveRange> ranges;
    for (auto& [r, def] : first_def) {
        if (last_use.count(r)) {
            ranges.push_back({def, last_use[r] + 1, r});
        }
    }
    return ranges;
}
```

### 2.3 跨越基本块

上面的算法是单基本块内的局部活跃区间。真正的活跃区间要跨基本块扩展：

```text
活区间 = union(块内 [def, last_use]) ∪ block-entry-live ∪ block-exit-live
```

实现时先做反向数据流分析（与 [基本块与 CFG](ir-cfg) 中的活跃变量类似，但对象是虚拟寄存器），再用上面的算法在块内构造。

## 三、冲突图（Interference Graph）

两个活跃区间重叠时，它们对应的虚拟寄存器不能在同一个物理寄存器中共存。
把这种约束建模为图：

```text
节点：每个活跃区间对应的虚拟寄存器
边：A 和 B 同时在某个程序点活跃 → (A, B) ∈ E
```

构造：

```cpp
Graph build_interference(const vector<LiveRange>& ranges) {
    Graph G;
    for (auto& r : ranges) G.add_node(r.reg);
    for (auto& r1 : ranges) {
        for (auto& r2 : ranges) {
            if (r1.reg == r2.reg) continue;
            if (r1.start < r2.end && r2.start < r1.end) {
                G.add_edge(r1.reg, r2.reg);    // 区间重叠
            }
        }
    }
    // 移除 (a, b) 和 move 相关边后再考虑（见 move-aware）
    return G;
}
```

下面这张图把上面汇编示例的活跃区间、它们彼此重叠的位置，以及由此导出的冲突图一次性画出来：

```mermaid
flowchart LR
  subgraph 程序点 0 到 4
    P0[0: lw t0, 0 fp] --> P1[1: add t1, t0, a0]
    P1 --> P2[2: sw t1, 4 fp]
    P2 --> P3[3: add t0, t1, a0]
    P3 --> P4[4: mul t2, t0, t1]
  end
  subgraph 活跃区间
    R0[t0: 0,1]
    R1[t1: 1,4]
    R2[t0: 3,4]
    R3[t2: 4,4]
  end
  subgraph 冲突图
    A[t0] --- B[t1]
    A --- C[t2]
    B --- C
  end
```

## 四、特殊约束：调用约定

不是所有物理寄存器都可以随便用：

| 类型 | 行为 |
| --- | --- |
| 调用者保存 `t0~t6` | 调用前后值不保留，被调函数可任意修改 |
| 被调用者保存 `s0~s11` | 被调函数必须保留，跨调用活跃的值可以放在这里 |
| 参数寄存器 `a0~a7` | 函数入口接收参数，前几条指令活跃；之后可作为临时 |
| 返回值寄存器 `a0, a1` | 函数出口返回结果 |
| `zero` | 永远为 0，不能作为分配目标 |
| `sp`, `gp`, `tp`, `fp` | 保留给栈指针等，不能分配 |

```cpp
bool is_allocatable(int phys_reg) {
    return phys_reg != SP && phys_reg != GP && phys_reg != TP
        && phys_reg != ZERO && phys_reg != FP;
}
```

如果一个值跨越函数调用还活跃，它要么用被调用者保存寄存器（首选），要么在调用前后保存/恢复。

## 五、move-aware 冲突图

普通的 `mv t0, t1` 指令被关联到 `t0` 和 `t1` 的活跃区间，从而在冲突图中加一条边。
但 `mv` 的两个操作数其实是关联的（move-related），可以分配到同一物理寄存器以消除这条 move。
现代分配器（如 `regalloc2`）会标记 move 相关对，并在合并时尝试合并。

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
