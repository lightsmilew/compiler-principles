# ToyC 运行时库源码

本目录生成网站公开下载的 `static/downloads/libtoyc.a`，面向 RISC-V64GC、LP64D ABI 和 Linux / qemu-user。

仅提供 `int getint(void)`、`void putint(int)`，不含 SysY 的计时函数、构造函数或退出输出钩子。`putint` 输出十进制整数，不附加空格或换行；`getint` 跳过空白并读取有符号十进制 32 位整数，输入结束或没有可读取的整数时返回 0。

`start.S` 单独提供 `_start`，供课程中的 `-nostdlib -static` 链接命令使用：对齐栈、初始化 `gp`、调用 `main`，然后以 `main` 的返回值执行 Linux `exit`。I/O 通过 Linux 系统调用实现，无需链接 libc。

在 Linux 或 WSL 中，从仓库根目录执行：

```bash
make -B -C runtime
make -C runtime test
```

需要 `riscv64-unknown-elf-gcc`、配套 binutils、`qemu-riscv64` 和 Python 3。也可使用 Linux 交叉工具链：

```bash
make -B -C runtime CROSS_COMPILE=riscv64-linux-gnu-
make -C runtime test CROSS_COMPILE=riscv64-linux-gnu-
```

构建使用 `rv64gc` / `lp64d`，归档采用确定性模式。验证覆盖静态链接、整数边界、正负号、空白、输入结束、输入缓冲区跨界、多次调用、退出码和标准错误无额外输出，并检查符号、ABI 以及不存在初始化/退出钩子。
