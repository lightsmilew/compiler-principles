---
sidebar_position: 10
sidebar_label: 基本块重排
title: 基本块重排（Basic Block Layout）
description: 用启发式算法预测哪个出口更可能被进入，把热路径排成顺序执行，减少跳转与流水线冲刷
---

# 基本块重排（Basic Block Layout）

基本块重排（也叫代码布局）不改变任何计算，只调整基本块在目标文件中的排列顺序。同样的控制流，不同的排列会带来不同的分支预测表现；只有后端发射到汇编时，才可能把布局上相邻的无条件跳转编码为 fall-through。LLVM IR 本身仍必须保留每个基本块的 terminator。

## 一、必要性

布局可能改变取指局部性、显式跳转数量与分支预测行为，收益取决于处理器和输入：

- 相邻热块可能改善指令缓存局部性，并让后端省略通向下一块的无条件跳转；
- 分支预测失败的代价与微架构有关，RISC-V ISA 没有规定固定周期数；
- QEMU 的执行时间包含模拟器开销，不能直接当作真实硬件上的流水线指标。

而"哪个分支更可能被进入"是可以估计的，常用的静态经验规则包括：

- 循环回边可作为候选热边，但零次或一次迭代的循环未必如此；
- 没有 profile 或程序语义依据时，不能认定 `then` 比 `else` 更热；
- 地址方向可用于启发式，但向前、向后跳都不能单独证明执行频率。

据此可以把热路径排成顺序执行，把跳转留给冷路径。

```c
if (x > 0) {
    /* 热路径：绝大多数输入走这里 */
    y = x * 2;
} else {
    /* 冷路径：罕见的边界情况 */
    y = -1;
}
```

按源代码顺序直接生成（`then` 在前）：

```asm
    blez a0, ELSE        # 不成立就跳走
THEN:
    slli a1, a0, 1       # 热路径
    j    END             # 热路径末尾还有一条无条件跳转
ELSE:
    li   a1, -1
END:
    ret
```

重排之后（把冷路径移到前面，热路径落在顺序执行的位置）：

```asm
    bgtz a0, THEN        # 改为"成立才跳"，跳向热路径
ELSE:
    li   a1, -1
    j    END
THEN:
    slli a1, a0, 1       # 热路径顺序执行，直接落入 END
END:
    ret
```

本例假设 `x > 0` 更常成立。第二种布局让热路径少执行一条 `j`，但需要执行一次已采用的条件跳转；能否更快须实测，不能仅凭分支方向判断。

```mermaid
flowchart TB
  A["按源码顺序：<br/>热路径末尾有跳转"] --> B["估计边权重<br/>找热路径"]
  B --> C["重排块顺序<br/>热路径相邻"]
  C --> D["热边成为 fall-through<br/>后端发射时省略无条件跳转"]
```

## 二、可用的重排手段

| 手段 | 效果 |
| --- | --- |
| 热边相邻 | 后端发射时省略该边上的无条件跳转（fall-through） |
| 反转条件分支 | 让常走的边走顺序路径，冷边去跳 |
| 冷块后移 | 根据 profile 或明确的路径信息把冷块后移；`break` / `continue` 本身不代表冷路径 |
| 循环布局 | 把循环条件判断放在末尾，每轮少一条跳转 |
| 合并单链块 | 只有一条前驱和一条后继的链式块尽量排在一起 |

正确实现必须保持每条 CFG 边、入口和出口的语义；性能收益需实测。

## 三、示例

```c
int classify(int x) {
    if (x > 0) {
        return 2;
    } else {
        return 3;
    }
}
```

按照 CFG 顺序自然排列（`entry` → `then` → `else` → `end`）：

```mermaid
flowchart TB
  E["entry: bgtz?"] --> T["then: return 2"]
  E --> F["else: return 3"]
```

```asm
classify:
    blez a0, ELSE        # 分支方向与热路径相反
    li   a0, 2
    ret                  # 热路径在这里返回
ELSE:
    li   a0, 3
    ret
```

重排后把 `else`（冷路径）移到跳转之后：

```asm
classify:
    bgtz a0, THEN        # 条件为真时直接跳向热路径
    li   a0, 3           # 冷路径：顺序执行
    ret
THEN:
    li   a0, 2           # 热路径：跳入后顺序执行
    ret
```

两种布局每条路径的指令条数相同，均在本块返回；这里不能推出第二种布局更快。若假设 `x > 0` 更热，第一种布局使该路径直接顺序执行，是可比较的候选布局。

循环的情形（ToyC 的 `while`）：

```c
while (i < n) {
    sum = sum + i;
    i = i + 1;
}
```

一种常见布局把循环体排在前面、条件判断放在末尾：

```asm
    j    COND
BODY:
    addw t0, t0, t1     # t0=sum，t1=i，t2=n，int 使用 32 位操作
    addiw t1, t1, 1
COND:
    blt  t1, t2, BODY      # 条件成立就跳回循环体（向后分支，热）
    # 循环退出后直接从下一行继续，不需要额外跳转
AFTER:
```

这样每次迭代只有一条条件分支，没有无条件跳转。若把 `COND` 放在前面、`BODY` 放在后面，每轮循环还要多执行一条 `j`。

## 四、算法

重排分两步：先估计每条边的权重（哪个出口更可能被进入），再按权重把块串成链并确定最终顺序。

**算法 1 · 静态分支预测（Static Branch Prediction，估计边权重）**

**输入（Input）：** 函数控制流图 `cfg`。
**输出（Output）：** 每条边 `E` 的权重 `E.weight`。

```
 1: estimateEdgeWeights(cfg):
 2:     for each edge E = (P -> S) in cfg do
 3:         w = 1;
 4:         if S dominates P then w = w * 10; end if          // 回边（循环体）：权重最高
 5:         if indexOf(S) < indexOf(P) then w = w * 2; end if // 向后分支：多为循环继续
 6:         if hasProfileCount(E) then w = profileCount(E); end if
 7:         // 无测量数据时，不因 then/else 名称改变权重
 8:         // 出口是否为冷边也需要程序或 profile 依据
 9:         E.weight = w;
10:     end for
11:     return cfg;
```

上面的 10 与 2 是教学示例的自定义系数，不是执行频率的测量结果或通用标准。若评测环境提供 profile 信息（例如采样数据），代入真实频率会更准确。

**算法 2 · 链式块布局（Chain-based Layout）**

**输入（Input）：** 带边权重的控制流图 `cfg`。
**输出（Output）：** 基本块的新排列顺序 `order`，以及需要反转的条件分支集合。

```
 1: layoutBlocks(cfg):
 2:     estimateEdgeWeights(cfg);                              // 1. 估计边权重
 3:     for each block B in cfg do
 4:         B.chain = newChain(B);                             // 每个块先自成一个链
 5:     end for
 6:     heap = maxHeap(allEdges(cfg));                         // 按权重取边
 7:     while heap not empty do
 8:         E = heap.pop();                                    // 2. 贪心合并权重最大的边
 9:         if E.tail.chain == E.head.chain then continue; end if        // 合并会成环，跳过
10:         if E.tail is not the last block of its chain then continue; end if
11:         if E.head is not the first block of its chain then continue; end if
12:         if E.head.chain contains cfg.entry then continue; end if // 入口不能被接到其它块之后
13:         mergeChains(E.tail.chain, E.head.chain);           // 3. 串成一个更长的链
14:     end while
15:     order = blocksOf(chainContaining(cfg.entry));       // 函数入口必须最先发射
16:     for each remaining chain C in descendingOrderOfWeight(cfg) do
17:         order.pushBlocksOf(C);                             // 4. 热链在前，冷链在后
18:     end for
19:     for each block P in order do
20:         next = nextBlock(P, order);
21:         if P has an unconditional branch to next then markFallthrough(P, next);
22:         else if P has a conditional branch then
23:             chooseBranchPolarityAndExplicitJumps(P, next); // 真/假两条边均须到达原目标
24:         end if
25:     end for
26:     return order;
```

该算法的思路与最大生成树类似：按权重从大到小把边固定为相邻关系，最终拼出若干条链，再按热度排列这些链。只有链内相邻的边才能成为 fall-through，因此权重估计的准确性直接决定收益。

:::tip[布局放在哪一层]
- 在 IR 层重排：只改变块的输出顺序，保留 terminator，`phi` 的语义不受影响，适合作为第一版实现；
- 在汇编层重排：可以顺带处理分支距离问题（RISC-V 条件分支的范围有限），但需要保证标签与栈偏移的对应关系正确。

建议在 IR 层完成，把布局结果作为后端发射基本块的顺序。
:::

## 五、优化效果

- 减少跳转：热边成为 fall-through 后，后端发射可省略热路径上的无条件跳转；循环体每轮可能少一条 `j`。
- 改善分支预测：方向调整可能改变预测行为，是否改善取决于硬件与实际路径频率。
- 改善指令缓存局部性：热块彼此相邻，冷块（错误处理、`break` 出口）集中到末尾，不会打断热路径。
- 代价与风险：漏发跳转、错误反转条件或移动入口都可能导致错误；但若权重估计偏差过大（把冷路径当作热路径），效果可能不如原始顺序。这也是重排通常与窥孔优化、内联一起放在"收益不确定时保持保守"的位置上的原因。

## 六、正确性陷阱

| 陷阱 | 说明 |
| --- | --- |
| 漏掉补跳转 | 只有相邻的块可以 fall-through；不相邻的边必须显式保留跳转，否则控制流不完整 |
| 反转条件分支 | RISC-V 只有"成立就跳"，反转 `beq` / `bne`、`blt` / `bge` 时必须成对处理 |
| 分支距离 | 跳转目标过远时工具链会插入跳转桩，冷块不宜挪得太远 |
| 循环出口 | 循环出口通常是冷边，不要因为位置顺就把它排成热路径 |
| `break` / `continue` | 它们指向的块往往很冷，但语义上必须保留跳转，不能只靠布局省掉 |
| 不可达块 | 先用[控制流简化](ir-cfg-simplify)删除不可达块再布局，避免把死块插入热路径 |
| 与 `phi` 的关系 | IR 层重排只改块顺序并保留 terminator，`phi` 的入边按前驱匹配，不受块顺序影响；汇编输出时不要依赖块的先后 |

## 七、动手验证

```bash
# 执行位置：WSL / Ubuntu 开发主机终端（编译器项目根目录）
# 优化前后的汇编
./compiler -asm      < test.c > base.s
./compiler -asm -opt < test.c > opt.s

# 1. 统计静态无条件跳转条数；不能单凭这个数判断实际收益
grep -cE '^\s*j\s' base.s opt.s

# 2. 对比块的出现顺序，确认热块被排到了前面
diff <(grep -nE '^\s*(blt|bge|beq|bne|blez|bgtz)' base.s) \
     <(grep -nE '^\s*(blt|bge|beq|bne|blez|bgtz)' opt.s)

# 3. 功能对拍：布局不改变语义，输出必须逐字节一致
```

判定标准有两层：功能上输出与优化前完全一致；性能上热路径的跳转条数下降、指令地址更集中。只有第一层成立时，说明布局至少是安全的；要获得性能收益，第二层也需要成立。

下一步阅读：[活跃区间与冲突图](asm-liveness) 进入目标代码优化章节。（[死代码消除](ir-dce) 与[控制流简化](ir-cfg-simplify) 是布局的前置清理——块越少、越干净，布局效果越明显。）
