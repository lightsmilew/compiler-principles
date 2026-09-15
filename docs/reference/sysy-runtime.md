---
sidebar_position: 3
sidebar_label: ToyC 运行时库
title: ToyC 运行时库
description: getint 与 putint 的接口约定、静态库链接方式和 RISC-V64GC 调用要求
---

# ToyC 运行时库

实验七使用 ToyC 运行时静态库 `libtoyc.a`。ToyC 源程序不需要
包含头文件；编译器识别下列内建函数，并在生成目标代码时按普通外部函数调用处理。

## 函数接口

| 函数 | 作用 | 返回值 |
| --- | --- | --- |
| `int getint()` | 从标准输入读取一个整数 | 读取到的整数 |
| `void putint(int value)` | 向标准输出写入一个整数 | 无 |

示例：

```c
int main() {
  int value;
  value = getint();
  putint(value);
  return 0;
}
```

## 编译与静态链接

目标代码必须是 RISC-V64GC，并使用 ToyC 运行时库进行静态链接：

```bash
./compiler input.sy -o out.s
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static out.s libtoyc.a -o out.elf
```

`getint` 的返回值从 `a0` 读取，`putint` 的第一个参数放入 `a0`。除参数和
返回值外，调用者还必须遵守 RISC-V64GC 的栈对齐、返回地址和寄存器保存约定。