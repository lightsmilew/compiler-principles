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

**方式一：qemu-user 快速验证**

适用于运行单个静态 ELF 文件：

```bash
# 1. 编译 ToyC 源代码 → 汇编
./compiler < input.c > input.s

# 2. 链接汇编 + 运行时库 → 可执行文件
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static input.s third_party/toyc/libtoyc.a -o input

# 3. 运行（qemu-user）
./input < input.in
```

**方式二：qemu-system 完整虚拟机**

需要完整的 Linux 开发环境时，启动 QEMU 虚拟机：

```bash
# 启动虚拟机
qemu-system-riscv64 \
  -machine virt \
  -cpu rv64gc \
  -nographic -m 4G -smp 4 \
  -kernel /usr/lib/u-boot/qemu-riscv64_smode/uboot.elf \
  -device virtio-net-device,netdev=eth0 \
  -netdev user,id=eth0,hostfwd=tcp::2222-:22 \
  -device virtio-rng-pci \
  -drive file=ubuntu-24.04-riscv64.img,format=raw,if=virtio
```

SSH 连接后，在虚拟机内编译运行：

```bash
# 账号 ubuntu，密码 ubuntu（首次登录需修改密码）
ssh -p 2222 ubuntu@localhost

# 首次登录后安装编译工具
sudo apt-get update
sudo apt-get install gcc gdb

# 编译运行
riscv64-linux-gnu-gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static input.s libtoyc.a -o input
./input < input.in
```

**脚本中的关键链接参数**：

| 参数 | 说明 |
|---|---|
| `-march=rv64gc` | 生成 RV64GC 指令|
| `-mabi=lp64d` | 使用 LP64D ABI（64 位整数 + 双精度浮点） |
| `-nostdlib -static` | 不链接标准库，静态链接运行时库 |
| `third_party/toyc/libtoyc.a` | ToyC 运行时库 |

运行时的标准输入（`input.in`）由评测脚本自动从 `*.in` 文件重定向，`getint()` 读取的值即来自该文件；不要把 `.in` 文件混淆为编译器输入。
