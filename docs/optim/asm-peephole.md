---
sidebar_position: 5
sidebar_label: 窥孔优化
title: 窥孔优化（Peephole）
description: 在目标代码上观察固定大小窗口，匹配预设规则做局部替换
---

# 窥孔优化（Peephole）

窥孔优化（Peephole Optimization）在汇编上滑动固定大小的窗口，
对每条指令模式做局部替换。它是寄存器分配之后最常见的"清扫"环节。

## 一、窥孔的特点

- 局部性：只观察相邻 2~4 条指令；
- 无需全局信息：不依赖活跃区间或冲突图；
- 模式匹配：每条规则形如"看到 X，替换为 Y"；
- 可迭代：一次扫描可能产生新的可优化模式，需要循环直到不动点。

## 二、典型规则

### 2.1 无操作指令

```text
add t0, t0, zero    →   删除（t0 不变）

mv  t0, t0          →   删除

li  t0, 0
mv  t1, t0           →   li t1, 0           （合并两次常量）
```

### 2.2 跳转合并

```text
j    L1
L1:  j  L2              →   j  L2          （跳到跳转折叠）

beq  t0, zero, L1
j    L2
L1:  ...                →   bne t0, zero, L2
                          j  L1
                          ...

beqz t0, L1
bnez t0, L1            →   unreachable      （条件互斥但都跳到同一处）
```

### 2.3 冗余 load/store

```text
lw    t0, slot
sw    t0, slot          →   删除 sw         （值未变）

lw    t0, slot
addi  t0, t0, 0         →   mv t0, slot （但常常被前面已优化掉）
```

### 2.4 算术恒等

```text
mul t0, t0, 1          →   mv t0, t0（再被删）
add t0, t0, 0          →   mv t0, t0（再被删）

sll t0, t0, 0          →   mv t0, t0（再被删）
sra t0, t0, 0          →   mv t0, t0（再被删）

li  t0, 0
sub t1, t1, t0          →   mv t1, t1      （先删 add 0）
```

### 2.5 load/store 紧邻

```text
lw t0, slot
addi t0, t0, 1
sw t0, slot              →   lw  t0, slot
                            addi t0, t0, 1
                            sw  t0, slot

; 上面其实是冗余展示：如果 t0 不被其它指令用，整组可优化为：
;   lw t1, slot
;   addi t1, t1, 1
;   sw t1, slot
; （重命名避免和外界同名寄存器冲突）
```

### 2.6 内存顺序与屏障

```asm
fence
fence                     →   删除单条 fence（连续两条等价一条）
```

## 三、规则匹配器

### 3.1 单条规则的数据结构

```cpp
struct Rule {
    string name;
    vector<Pattern> match;       // 长度 1~4
    vector<Pattern> replace;     // 替换模板
    function<bool(Window)> guard; // 安全条件
};
```

### 3.2 模式匹配

```cpp
bool match(Window w, const vector<Pattern>& pats) {
    for (int i = 0; i < pats.size(); i++) {
        if (!match_one(w[i], pats[i])) return false;
    }
    return true;
}
```

`match_one` 处理：

- 字面量立即数（`addi _, _, 0`）
- 寄存器通配（`_` 表示任意寄存器）
- 操作数相等约束（同一条规则里要求某些位置必须相同寄存器）

### 3.3 变量绑定

```text
add t0, t1, t2
↓
add %x, %y, %z
```

变量绑定允许匹配中"捕获"寄存器名，并在替换中引用。

## 四、迭代执行

```cpp
bool peephole(Assembly& code) {
    bool changed;
    do {
        changed = false;
        for (size_t i = 0; i + 2 <= code.size(); ) {
            int matched = 0;
            for (auto& rule : rules) {
                if (match(code, i, rule)) {
                    apply(code, i, rule);
                    changed = true;
                    matched = rule.match.size();
                    break;
                }
            }
            i += max(1, matched);     // 替换后回退一个窗口
        }
    } while (changed);
}
```

回退一个窗口是为了让新生成的指令能与前一条形成新模式（如删除 `mv` 后形成 `add t0, t0, 0`）。

```mermaid
flowchart TD
  Init[changed = true] --> Loop{changed?}
  Loop -- 是 --> Reset[changed = false]
  Reset --> Slide[窗口滑到位置 i]
  Slide --> Match{匹配任意规则?}
  Match -- 是 --> Apply[用规则 replace 窗口<br/>回退一个窗口位置]
  Apply --> Reset
  Match -- 否 --> Next[i += max(1, 匹配长度)]
  Next --> Slide
  Slide -.窗口到末尾.-> Loop
  Loop -- 否 --> End[一轮无变化, 完成]
```

## 五、安全条件

每条规则必须有 guard 函数确保替换不会改变可观察行为：

| 替换 | 风险 | guard |
| --- | --- | --- |
| 删除 `add t0, t0, 0` | t0 已被定义是 OK 的；未定义则非法 | 确认 t0 已 def |
| 删除冗余 `sw` | 必须确认 `sw` 与前一个 `lw` 之间没有 `store` 到同一地址 | 检查别名 |
| `beqz/bnez` 折叠 | 必须确认条件寄存器值未变 | 窗口内无其它指令修改该寄存器 |
| 跨块跳转合并 | 块间可能有 phi 等价类，必须在汇编阶段谨慎 | 只在基本块内应用 |

## 六、规则集合与扩展

ToyC 推荐至少实现以下 8 条规则（按实用性排序）：

1. `add t0, t0, 0` → 删除
2. `add t0, t1, 0` → `mv t0, t1`
3. `mul t0, t0, 1` → 删除
4. `j L; L: j M` → `j M`
5. 冗余 `sw` 后跟 `lw` → 视情况删除
6. `li t0, 0; sub t1, t1, t0` → `mv t1, t1`
7. `mv t0, t0` → 删除
8. `sll t0, t0, 0` / `sra t0, t0, 0` → 删除

每条规则都要正例、反例、回归测试三件套。

## 七、与寄存器分配的顺序

```text
建议顺序：
1. 寄存器分配（spill 之前做 peephole 会破坏信息）
2. Spill 代码生成
3. Peephole（此时活跃区间已固定，模式稳定）
4. 最终汇编输出
```

如果想在寄存器分配前做 peephole，只用非常局部的规则（如 `add t0, t0, 0` → `mv t0, t0`），避免引入新的活跃区间冲突。

下一步阅读：[强度削减](asm-strength-reduction)。
