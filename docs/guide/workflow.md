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
- `partN`：每个实验部分一个分支，例如 `part1-lexer`；
- 提交信息使用如下格式：

```text
<part>: <简述>

例：
part1: 实现标识符与数字常量的扫描
part1: 修复注释跨行时的状态回退缺陷
```

提交内容与禁止事项见[希冀提交与评测](./submission)。

## 三、代码规范

### 命名与注释

按语言选择对应的命名规则，同一项目内必须保持一致：

- **类型名**：使用 **PascalCase**（首字母大写的驼峰），如 `Token`、`BasicBlock`、`LiveInterval`；
- **函数与变量（C / C++ / OCaml）**：使用 **snake_case**（全小写下划线连接），如 `next_token`、`current_line`；
- **函数与变量（Java）**：使用 **camelCase**（首字母小写的驼峰），如 `nextToken`、`currentLine`；
- **常量**：使用 **UPPER_SNAKE_CASE**（全大写下划线），如 `MAX_TOKEN_LEN`、`EOF`。

示例：

```cpp
// C/C++ / OCaml 风格
struct Token {                  // 类型名 PascalCase
  TokenType type;               // 变量名 snake_case
  std::string lexeme;
  int line_no;
};

Token next_token();             // 函数名 snake_case
static constexpr int MAX_LEN = 64;  // 常量 UPPER_SNAKE_CASE

// Java 风格
class Token {                   // 类型名 PascalCase
  TokenType type;               // 变量名 camelCase
  String lexeme;
  int lineNo;
}

Token nextToken();              // 函数名 camelCase
static final int MAX_LEN = 64;  // 常量 UPPER_SNAKE_CASE
```

关键算法（如子集构造、First/Follow 计算、活变量分析）必须写明算法逻辑（如果复现某种算法需要介绍出处）。

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
./compiler --dump-tokens < input.c          # 第一部分：Token 流（建议输出 input.token）
./compiler --check-ast   < input.c          # 第二部分：AST 检查（建议输出 input.check-ast）
./compiler --dump-ir < input.c              # 第三部分：LLVM IR（建议输出 input.ll）
./compiler --dump-ir --opt < input.c        # 第三部分：优化后 LLVM IR（建议输出 input.opt.ll）
./compiler --dump-asm < input.c > input.s   # 第四部分：基线汇编
./compiler --dump-asm -opt < input.c > input.opt.s  # 第五、六部分：优化汇编

# 链接 ToyC 运行时库并运行
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static input.s third_party/toyc/libtoyc.a -o input
./input < runtime.in > input.out      # runtime.in 为 ToyC 程序运行时的 stdin 数据
                                       # input.out 是 ToyC 程序 stdout，是评测对比对象
```

`--dump-*` 模式用于检查中间结果；最终评测重点是 `--dump-asm` 产生的 RV64GC 汇编及其运行结果。

## 四、验收方式

提交前请阅读[希冀提交与评测](./submission)，完成干净目录 clone、构建、RV64GC 汇编链接和 QEMU 运行检查。

- **自动测试**：助教用统一的测试集运行你的编译器，比对输出；
- **现场答辩**：随机抽取一段代码，要求你口述其在本阶段被如何处理；
- **代码走查**：抽查关键数据结构（符号表、活跃变量、寄存器分配）。

## 五、进度建议

| 周次 | 内容 |
| --- | --- |
| 第 2 周 | 第一部分完成验收 |
| 第 4 周 | 第二、三部分完成验收 |
| 第 6 周 | 第四部分完成验收 |
| 第 8 周 | 第五部分完成验收 |
| 第 10 周 | 第六部分完成验收 |
| 第 12–16 周 | 综合课程设计 |
