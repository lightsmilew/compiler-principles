---
sidebar_position: 2
sidebar_label: 实验流程与代码规范
title: 实验流程与代码规范
description: 从拉取代码到提交验收的完整流程，以及必须遵守的编码约定
---

# 实验流程与代码规范

## 一、总体流程

```mermaid
flowchart TD
  A[阅读实验文档] --> B[设计数据结构与算法]
  B --> C[实现并通过自测用例]
  C --> D[编写实验报告]
  D --> E[提交到 Git 仓库]
  E --> F{助教检查}
  F -- 通过 --> G[进入下一个实验]
  F -- 不通过 --> B
```

## 二、提交规范

### 分支模型

- `main`：只接受合并，不直接开发；
- `labN`：每个实验一个分支，例如 `lab1-lexer`；
- 提交信息使用如下格式：

```text
<lab>: <简述>

例：
lab1: 实现标识符与数字常量的扫描
lab1: 修复注释跨行时的状态回退缺陷
```

### 提交内容

每个实验提交时必须包含：

1. **源代码**：可独立构建运行；
2. **构建脚本**：`Makefile` / `build.sh` / `pom.xml`，确保助教一条命令可编译；
3. **测试用例**：至少 5 组，覆盖正常输入与边界输入；
4. **实验报告**：`report.md`，规范见 [实验报告与提交规范](./report.md)。

:::danger 禁止事项
- 禁止提交编译产物（`a.out`、`*.class`、`*.o`）与 IDE 配置目录；
- 禁止抄袭。代码相似度检测工具会跨届比对，一经确认双方均为零分。
:::

## 三、代码规范

### 命名与注释

- 类型名用 `PascalCase`，函数与变量用 `snake_case`（Java 用 `camelCase`）；
- 每个源文件头部注明：实验名称、学号、姓名、日期；
- 关键算法（如子集构造、First/Follow 计算、活变量分析）必须写明算法出处与复杂度。

### 错误处理

编译器对错误输入必须**优雅退出**，不允许崩溃或输出未定义行为。约定：

```c
// 词法错误：报告行列号后继续扫描，便于一次性发现多处错误
error: line 12, column 5: unexpected character '@'
```

- 退出码：`0` 表示编译成功，`1` 表示源码存在错误，`2` 表示内部实现错误；
- 错误信息统一输出到 **stderr**，正常结果输出到 **stdout**，方便脚本化测试。

### 可测试性

统一驱动使用原实验约定的 `--dump-*` 开关，并从标准输入读取 ToyC 源程序、向标准输出写入阶段结果：

```bash
./mycompiler --dump-tokens < input.tc                 # 词法检查
./mycompiler --dump-ast < input.tc                    # 语法/AST 检查
./mycompiler --dump-symtab < input.tc                 # 选做语义分析
./mycompiler --dump-ir < input.tc                     # LLVM IR
./mycompiler --dump-ir --opt < input.tc               # 优化后的 LLVM IR
./mycompiler --dump-asm < input.tc > output.s         # RV64GC 汇编
./mycompiler --dump-asm -opt < input.tc > optimized.s # 优化后 RV64GC 汇编
```

`--dump-*` 模式用于检查中间结果；最终评测重点是 `--dump-asm` 产生的 RV64GC 汇编及其运行结果。

## 四、验收方式

提交前请阅读[希冀提交与评测](./submission.md)，完成干净目录 clone、构建、RV64GC 汇编链接和 QEMU 运行检查。

- **自动测试**：助教用统一的测试集运行你的编译器，比对输出；
- **现场答辩**：随机抽取一段代码，要求你口述其在本阶段被如何处理；
- **代码走查**：抽查关键数据结构（符号表、活跃变量、寄存器分配）。

## 五、进度建议

| 周次 | 内容 |
| --- | --- |
| 第 2 周 | 实验一完成验收 |
| 第 4 周 | 实验二、三完成验收 |
| 第 6 周 | 实验四完成验收 |
| 第 8 周 | 实验五完成验收 |
| 第 10 周 | 实验六、七完成验收 |
| 第 12–16 周 | 综合课程设计 |
