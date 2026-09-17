---
sidebar_position: 3
sidebar_label: ToyC 运行时库
title: ToyC 运行时库
description: 运行时库函数接口、返回值约定、静态库链接方式和 RISC-V64GC 调用要求
---

# ToyC 运行时库

ToyC 运行时库仅提供两个 I/O 函数。ToyC 源程序不需要包含头文件；编译器识别这些内建函数，在生成目标代码时按普通外部函数调用处理，链接时与 `libtoyc.a` 静态链接。

:::note
链接时将编译器输出的汇编与运行时静态库进行链接（大赛统一使用静态链接）。`getint` 的返回值从 `a0` 读取，`putint` 的第一个参数放入 `a0`。除参数和返回值外，还必须遵守 RISC-V64GC 的栈对齐、返回地址和寄存器保存约定。
:::

## 函数列表

| 函数 | 说明 | 返回值 |
|---|---|---|
| `int getint()` | 从标准输入读取一个整数 | 读取到的整数值 |
| `void putint(int value)` | 向标准输出写入一个整数值 | 无 |

示例：

```c
int main() {
    int x = getint();
    putint(x + 1);
    return 0;
}
```

## 编译与运行

目标代码必须是 RISC-V64GC，并使用 ToyC 运行时库进行静态链接。

```bash
# 1. 编译 ToyC 源代码 → 汇编
./compiler < input.c > input.s

# 2. 链接汇编 + 运行时库 → 可执行文件
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static input.s third_party/toyc/libtoyc.a -o input

# 3. 运行（QEMU 用户态）
#    输入数据放在 input.in，评测脚本自动重定向标准输入
qemu-riscv64 ./input < input.in
```

脚本中的关键链接参数：

| 参数 | 说明 |
|---|---|
| `-march=rv64gc` | 生成 RV64GC 指令|
| `-mabi=lp64d` | 使用 LP64D ABI（64 位整数 + 双精度浮点） |
| `-nostdlib -static` | 不链接标准库，静态链接运行时库 |
| `third_party/toyc/libtoyc.a` | ToyC 运行时库 |

运行时的标准输入（`input.in`）由评测脚本自动从 `*.in` 文件重定向，`getint()` 读取的值即来自该文件；不要把 `.in` 文件混淆为编译器输入。
