---
sidebar_position: 3
sidebar_label: ToyC 运行时库
title: ToyC 运行时库
description: 运行时库函数接口、返回值约定、静态库链接方式和 RISC-V64GC 调用要求
---

# ToyC 运行时库

ToyC 运行时库仅提供两个 I/O 函数。ToyC 源程序不需要包含头文件；编译器识别这些内建函数，在生成目标代码时按普通外部函数调用处理，链接时与 `libtoyc.a` 静态链接。

静态库文件可从[资源下载](downloads#课程实验资源)页面获取。

课程提供的库使用独立 ToyC 源码构建，不包含 SysY 的计时函数或程序退出时的计时输出。`putint` 只输出整数，不自动附加空格或换行。

该库面向 RISC-V Linux / qemu-user，包含供 `-nostdlib -static` 链接使用的启动入口：调用 `main`，并以其返回值退出。I/O 直接使用 Linux 系统调用，无需链接标准库。

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
# 执行位置：WSL / Ubuntu 开发主机终端（编译器项目根目录）
# qemu-riscv64 命令也在此终端输入，由 QEMU 执行 RISC-V 程序
# 1. 编译 ToyC 源代码 → 汇编
./compiler -asm < input.c > input.s

# 2. 链接汇编 + 运行时库 → 可执行文件
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static input.s third_party/toyc/libtoyc.a -o input

# 3. 在开发主机终端调用 qemu-user，执行 RISC-V 程序
qemu-riscv64 ./input < input.in
```

**方式二：qemu-system 完整虚拟机**

需要完整的 RISC-V Linux 环境时，可以使用已经准备好的 Ubuntu RISC-V 镜像启动 QEMU 虚拟机。下面按“开发主机启动 → 开发主机传文件并登录 → 虚拟机内运行”的顺序执行；开发主机与虚拟机的文件目录各自独立。磁盘格式检查与调试步骤见 [QEMU 调试指南](../guide/qemu-debugging)。

```bash
# 执行位置：WSL / Ubuntu 开发主机终端 A
# 在镜像所在目录启动；镜像文件名和 U-Boot 路径按实际安装位置调整
# 保持此终端运行 QEMU，后续传文件与 SSH 命令在另一个开发主机终端输入
# 此处磁盘已转换为 raw 格式，且已配置登录账号与 SSH
qemu-system-riscv64 \
  -machine virt \
  -cpu rv64 \
  -nographic -m 4G -smp 4 \
  -kernel /usr/lib/u-boot/qemu-riscv64_smode/uboot.elf \
  -device virtio-net-device,netdev=eth0 \
  -netdev user,id=eth0,hostfwd=tcp:127.0.0.1:2222-:22 \
  -device virtio-rng-pci \
  -drive file=ubuntu-24.04-riscv64.img,format=raw,if=virtio
```

等待虚拟机启动且 SSH 服务可用后，打开另一个开发主机终端，进入编译器项目根目录，传入前面生成的汇编、测试输入和运行时库，再登录。下面使用 `ubuntu` 账号，实际账号与密码以镜像配置为准。

```bash
# 执行位置：WSL / Ubuntu 开发主机终端 B（编译器项目根目录）
# 将文件复制到虚拟机中 ubuntu 用户的主目录
scp -P 2222 input.s input.in third_party/toyc/libtoyc.a ubuntu@localhost:~/
# 此命令在开发主机输入；登录成功后，当前终端进入 QEMU 虚拟机
ssh -p 2222 ubuntu@localhost
```

登录成功后，在 SSH 会话中执行：

```bash
# 执行位置：QEMU 虚拟机内的 RISC-V Ubuntu 终端（SSH 登录后）
# 首次登录后安装虚拟机内的编译工具
sudo apt-get update
sudo apt-get install gcc gdb

# 进入接收文件的目录，使用虚拟机内的原生 RISC-V GCC 链接
cd ~
gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static input.s libtoyc.a -o input
# 在 RISC-V 虚拟机内直接运行目标程序
./input < input.in
# 结束 SSH 会话，返回开发主机终端 B；终端 A 中的 QEMU 继续运行
exit
```

**脚本中的关键链接参数**：

| 参数 | 说明 |
|---|---|
| `-march=rv64gc` | 生成 RV64GC 指令|
| `-mabi=lp64d` | 使用 LP64D ABI（long/指针为 64 位，int 为 32 位，硬浮点调用约定） |
| `-nostdlib -static` | 不链接标准库，静态链接运行时库 |
| `third_party/toyc/libtoyc.a` | ToyC 运行时库 |

运行时的标准输入（`input.in`）由评测脚本自动从 `*.in` 文件重定向，`getint()` 读取的值即来自该文件；不要把 `.in` 文件混淆为编译器输入。
