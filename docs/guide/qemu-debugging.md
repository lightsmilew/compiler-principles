---
sidebar_position: 7
custom_edit_url: null
sidebar_label: QEMU 调试
title: QEMU 本地调试指南
description: 区分开发主机、QEMU 用户态模拟与完整虚拟机，调试 RV64GC 程序
---

# QEMU 本地调试指南

本指南面向 RV64GC ToyC 程序。开发主机可以是 WSL Ubuntu 或原生 Ubuntu。qemu-user 直接模拟一个 Linux 程序；qemu-system 启动完整 RISC-V 系统，登录后才进入虚拟机终端。

## 一、准备工具与独立样例

先按[开发环境](environment)安装工具，并把下载的运行时库放在项目的 `third_party/toyc/libtoyc.a`。以下样例不依赖学生编译器，可以独立检查链接、运行与断点。

```bash
# 执行位置：WSL / Ubuntu 开发主机终端（项目根目录）
sudo apt install -y qemu-user qemu-system-misc qemu-utils gdb-multiarch \
  gcc-riscv64-unknown-elf u-boot-qemu
mkdir -p third_party/toyc
# libtoyc.a 从课程资源页下载后放入上述目录
```

```asm
# 保存为项目根目录的 debug.s；这些是汇编源码，不是终端命令
.text
.globl main
main:
    addi sp, sp, -16
    sd ra, 8(sp)
    li a0, 42
    call putint
    li a0, 0
    ld ra, 8(sp)
    addi sp, sp, 16
    ret
```

```bash
# 执行位置：WSL / Ubuntu 开发主机终端（项目根目录）
riscv64-unknown-elf-gcc -g -march=rv64gc -mabi=lp64d \
  -nostdlib -static debug.s third_party/toyc/libtoyc.a -o debug
qemu-riscv64 ./debug
# stdout 是 42，没有自动换行；退出代码应为 0
debug_status=$?
printf '\nexit=%s\n' "$debug_status"
```

`-g` 为汇编行生成调试信息。调试自己的产物时，将 `debug.s` 换成编译器生成的汇编；程序需要 `getint` 输入时，用 `< input.in` 提供数据。

## 二、在开发主机调试 qemu-user

在终端 A 启动程序并等待 GDB 连接。两个终端都属于开发主机，这一步没有启动 Ubuntu 虚拟机。

```bash
# 执行位置：WSL / Ubuntu 开发主机终端 A（项目根目录）
qemu-riscv64 -g 1234 ./debug
# 保持此终端运行；-g 1234 使程序等待调试连接
```

打开开发主机的第二个终端：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端 B（同一项目根目录）
gdb-multiarch ./debug
```

进入 GDB 后逐条输入：

```gdb
# 执行位置：开发主机终端 B 的 GDB 提示符
set pagination off
target remote localhost:1234
break main
continue
# 程序现在停在 main，检查寄存器和下一条指令
info registers
x/8i $pc
stepi
# 继续到程序结束，终端 A 输出 42
continue
quit
```

远程目标已经由 QEMU 创建，因此使用 `continue` 启动或恢复它；不使用 GDB 的 `run` 重新创建进程。`stepi` 单步机器指令，`nexti` 可跨过一次调用。qemu-user 不支持完整的内存 watchpoint 能力，详见 [QEMU 调试说明](https://www.qemu.org/docs/master/system/gdb.html)。

## 三、完整虚拟机：先确认磁盘格式

完整虚拟机需要单独准备 RISC-V Ubuntu 镜像、启动固件和登录账号。可从 [Ubuntu 官方镜像目录](https://cloud-images.ubuntu.com/releases/24.04/release/)选择 riscv64 镜像。云镜像初次启动还需要 cloud-init 的 NoCloud 数据盘或其它预配置方式；仅下载镜像不能保证已有可登录密码和 SSH 服务。账号以镜像配置为准。

先检查磁盘格式。下面假设下载文件保存为 `ubuntu-cloud.img`，转换生成供后续命令使用的 raw 镜像；输出文件使用不同名称。

```bash
# 执行位置：WSL / Ubuntu 开发主机终端（镜像目录）
qemu-img info ubuntu-cloud.img
qemu-img convert -O raw ubuntu-cloud.img ubuntu-24.04-riscv64.img
# 这里的 resize 单位为字节，扩展 raw 磁盘至 16 GiB
qemu-img resize -f raw ubuntu-24.04-riscv64.img 16G
```

### 首次登录配置：NoCloud

首次启动新的云镜像时，为 ubuntu 账号配置 SSH 公钥。密钥存放在 Linux 用户主目录的 `.ssh`，避免放在 WSL 的 Windows 挂载目录中造成权限检查失败。以下命令在镜像目录生成 `user-data`、`meta-data` 和数据盘，文件名在后续命令中保持一致。

```bash
# 执行位置：WSL / Ubuntu 开发主机终端（镜像目录）
sudo apt install -y cloud-image-utils
mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
if [ ! -f "$HOME/.ssh/toyc-qemu" ]; then
  ssh-keygen -t ed25519 -N '' -f "$HOME/.ssh/toyc-qemu"
fi
qemu_pubkey=$(cat "$HOME/.ssh/toyc-qemu.pub")
cat > user-data <<EOF
#cloud-config
users:
  - name: ubuntu
    shell: /bin/bash
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - $qemu_pubkey
ssh_pwauth: false
EOF
cat > meta-data <<'EOF'
instance-id: toyc-qemu-01
local-hostname: toyc-riscv
EOF
cloud-localds user-data.img user-data meta-data
```

NoCloud 的配置格式见 [cloud-init 官方说明](https://cloudinit.readthedocs.io/en/latest/reference/datasources/nocloud.html)。本例使用公钥登录，后续 SSH/scp 显式指定同一私钥；数据盘不包含私钥。等待初次 cloud-init 完成后再登录，已经初始化的磁盘不会在每次启动时重做相同配置。

Ubuntu 24.04 上，`u-boot-qemu` 包提供下述 U-Boot 文件；可用 `dpkg -L u-boot-qemu` 检查安装路径。QEMU 的 `rv64` 是 CPU 型号名，`rv64gc` 是 ISA 组合名称，不能直接用作该 CPU 型号参数。

```bash
# 执行位置：WSL / Ubuntu 开发主机终端 A（镜像目录）
qemu-system-riscv64 \
  -machine virt -cpu rv64 -nographic -m 4G -smp 4 \
  -kernel /usr/lib/u-boot/qemu-riscv64_smode/uboot.elf \
  -device virtio-net-device,netdev=eth0 \
  -netdev user,id=eth0,hostfwd=tcp:127.0.0.1:2222-:22 \
  -device virtio-rng-pci \
  -drive file=ubuntu-24.04-riscv64.img,format=raw,if=virtio \
  -drive file=user-data.img,format=raw,if=virtio
```

以上命令中的 `format=raw` 与转换结果一致。保持终端 A 运行，等待系统启动、cloud-init 完成且 SSH 服务可用。`Ctrl+A` 后按 `X` 退出 QEMU 控制台；关闭系统前宜在虚拟机内运行 `sudo poweroff`。

## 四、传输与虚拟机内调试

虚拟机已配置 `ubuntu` 账号且允许 SSH 登录时，在开发主机终端 B 传输 ELF 并登录：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端 B（项目根目录）
scp -i "$HOME/.ssh/toyc-qemu" -P 2222 debug ubuntu@localhost:~/
ssh -i "$HOME/.ssh/toyc-qemu" -p 2222 ubuntu@localhost
# 登录成功后，当前终端进入 RISC-V Ubuntu 虚拟机
```

登录后执行的命令单独列出：

```bash
# 执行位置：QEMU 虚拟机内的 RISC-V Ubuntu 终端
cd ~
./debug
sudo apt update
sudo apt install -y gdb
gdb ./debug
```

这里 GDB 位于 RISC-V 虚拟机内，可以直接启动本机架构程序：

```gdb
# 执行位置：QEMU 虚拟机内的 GDB 提示符
break main
run
info registers
stepi
continue
quit
```

```bash
# 执行位置：QEMU 虚拟机内的 RISC-V Ubuntu 终端
# 结束 SSH 会话，返回开发主机终端 B
exit
```

完整系统的 `-s -S` 调试接口主要用于系统/内核调试。单个用户程序优先使用第二节的 qemu-user，或在虚拟机内运行 GDB；不要把系统暂停、程序断点和 SSH 登录混为同一步。两种模拟模式见 [QEMU 用户态说明](https://www.qemu.org/docs/master/user/main.html)与[系统模拟说明](https://www.qemu.org/docs/master/system/introduction.html)。
