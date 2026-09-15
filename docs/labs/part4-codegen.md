---
sidebar_position: 4
sidebar_label: 第四部分 · 目标代码生成
title: 第四部分 · 目标代码生成
description: 先将未优化的 LLVM IR 翻译为 RISC-V64GC 汇编，建立可运行的后端基线
---

# 第四部分 · 目标代码生成

本部分在不依赖优化器的前提下，把第三部分生成的 LLVM IR 翻译为可运行的 RISC-V64GC 汇编。先完成正确的基线后端，再在第五、六部分分别优化 IR 和目标代码。

```mermaid
flowchart LR
  I[未优化 LLVM IR] --> S[指令选择]
  S --> A[RISC-V ABI]
  A --> F[栈帧布局]
  F --> R[基础寄存器分配]
  R --> O[RISC-V64GC 汇编]
  O --> L[libtoyc.a 静态链接]
```

## 一、实现要求

1. 支持算术、比较、条件跳转、无条件跳转、参数、调用和返回；
2. 实现函数序言、尾声、局部变量栈槽、参数传递和返回值；
3. 遵守 RISC-V64GC 的调用约定，正确处理 `a0-a7`、`ra`、`sp`、`s0-s11` 和临时寄存器；
4. 支持 `getint` 和 `putint` 外部调用，但不在本部分做目标代码优化；
5. 输出稳定的汇编文本，错误输入返回非零退出码并报告位置。

## 二、LLVM IR 到指令的转换

指令选择先匹配 LLVM IR 操作的语义，再根据操作数位置和目标类型选择 RISC-V 指令。示例：

```llvm
%sum = add i32 %a, %b
%cmp = icmp slt i32 %sum, %limit
br i1 %cmp, label %body, label %exit
```

可以先生成如下未分配寄存器的基线模板：

```asm
lw    t0, 0(fp)       # %a
lw    t1, 4(fp)       # %b
add   t2, t0, t1      # %sum
lw    t3, 8(fp)       # %limit
blt   t2, t3, .Lbody  # %cmp 与条件分支合并
j     .Lexit
```

实现时要维护 `Value -> location` 映射。`load` 从局部变量地址读入寄存器，`store` 把寄存器写回栈槽；没有寄存器优化时，所有 LLVM SSA 临时值都可以先分配固定栈槽。

## 三、调用约定与栈帧

RISC-V64GC 中，整数参数依次使用 `a0-a7`，整数返回值使用 `a0`；调用者保存寄存器包括 `a0-a7`、`t0-t6` 和 `ra`，被调用者保存寄存器包括 `s0-s11`。函数序言需要分配栈帧并保存被调用者保存的寄存器，尾声恢复它们并执行 `ret`。

```asm
.text
.globl add
add:
  addi sp, sp, -32
  sd   ra, 24(sp)
  sd   s0, 16(sp)
  add  a0, a0, a1
  ld   s0, 16(sp)
  ld   ra, 24(sp)
  addi sp, sp, 32
  ret
```

栈帧大小必须满足 ABI 对齐要求。局部变量、临时值、spill 槽和保存寄存器的偏移应在函数开始时统一计算，避免生成代码过程中改变栈布局。

## 四、基线后端流程

```text
for instruction in llvm_ir:
    choose_riscv_instruction(instruction)
    load_operands_if_needed(instruction)
    emit_instruction(instruction)
    store_result_if_needed(instruction)
```

LLVM IR 的每个局部 SSA 临时值可以先分配一个栈槽，确保在没有寄存器优化时也能正确运行。第四部分的目标是正确性，不要求最少指令数；寄存器分配和窥孔优化放到第六部分。

## 三、命令行与提交物

```bash
cmake -S . -B build
cmake --build build
./build/mycompiler --dump-asm < input.tc > out.s
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static out.s libtoyc.a -o out.elf
./out < input.txt
```

必须提交可编译的完整文件：

```text
part4-codegen/
├── src/
├── tests/
├── build.sh
├── README.md
└── report.md
```

`report.md` 应说明指令选择、调用约定、栈帧布局、临时值栈槽和基线测试结果。寄存器分配改进和窥孔优化放到第六部分。
