---
sidebar_position: 1
sidebar_label: 开发环境与工具链
title: 开发环境与工具链
description: 编译器实验所需的环境准备、推荐工具与最小可运行验证
---

# 开发环境与工具链

## 一、语言与编译器

实验代码可以使用 **C / C++、Java 或 OCaml** 中任意一种语言实现，
但整个实验过程中不可更换语言。实验统一在 Linux 环境下完成，建议使用命令行工具编译和测试。

| 语言 | 构建系统 | 可用工具 |
| --- | --- | --- |
| C / C++ | CMake 4.0.3、Make | Flex、Bison/Yacc、ANTLR 4.13.1 |
| Java | Maven 3.9.11、Gradle 8.5 | ANTLR 4.13.1 |
| OCaml | Dune 3.19 | ocamllex、ocamlyacc、Menhir |

## 二、必须安装的工具

### 0. Windows 用户安装 WSL2

作业在 Linux 环境下构建和测试。Windows 10/11 用户推荐使用 WSL2 Ubuntu，不建议直接在 PowerShell 中混用 Windows 和 Linux 工具链。

在管理员 PowerShell 中执行：

```powershell
wsl --install -d Ubuntu-24.04
```

重启后首次打开 Ubuntu，设置 Linux 用户名和密码，然后在 WSL 中确认版本：

```bash
sudo apt update && sudo apt upgrade -y
wsl --status
uname -a
```

项目建议放在 WSL 文件系统中，例如 `~/work/ToyC`，而不是 `/mnt/c` 下，以减少跨文件系统访问和权限问题。VS Code 可安装 **WSL** 扩展后使用 `code .` 打开当前 Linux 目录。

### 1. Git

用于管理代码与提交实验。请配置好用户名与邮箱：

```bash
git config --global user.name "你的姓名"
git config --global user.email "你的邮箱"
```

### 2. 词法与语法工具（选做，不强制）

实验一与实验二允许使用表中对应的词法/语法分析器生成器。下面的命令适用于
Ubuntu/WSL2；如果系统仓库版本低于课程要求，应优先使用课程镜像或官方发行包。

#### C/C++：Flex、Bison/Yacc 和 ANTLR

```bash
# Flex、Bison（Bison 提供 yacc 兼容接口）
sudo apt install -y flex bison

# ANTLR 4.13.1 运行环境
sudo apt install -y default-jre curl
mkdir -p "$HOME/.local/share/antlr"
curl -L https://www.antlr.org/download/antlr-4.13.1-complete.jar \
  -o "$HOME/.local/share/antlr/antlr-4.13.1-complete.jar"
cat >> "$HOME/.bashrc" <<'EOF'
export ANTLR_JAR="$HOME/.local/share/antlr/antlr-4.13.1-complete.jar"
alias antlr4='java -jar "$ANTLR_JAR"'
alias grun='java org.antlr.v4.gui.TestRig'
EOF
source "$HOME/.bashrc"

# 验证
flex --version
bison --version
java -jar "$ANTLR_JAR"
```

#### Java：ANTLR 4.13.1、Maven 和 Gradle

```bash
sudo apt install -y openjdk-17-jdk curl unzip

# Maven 3.9.11
curl -LO https://archive.apache.org/dist/maven/maven-3/3.9.11/binaries/apache-maven-3.9.11-bin.tar.gz
sudo tar -xzf apache-maven-3.9.11-bin.tar.gz -C /opt
sudo ln -sfn /opt/apache-maven-3.9.11 /opt/maven
echo 'export MAVEN_HOME=/opt/maven' >> "$HOME/.bashrc"
echo 'export PATH="$MAVEN_HOME/bin:$PATH"' >> "$HOME/.bashrc"

# Gradle 8.5
curl -LO https://services.gradle.org/distributions/gradle-8.5-bin.zip
sudo unzip -q gradle-8.5-bin.zip -d /opt
sudo ln -sfn /opt/gradle-8.5 /opt/gradle
echo 'export PATH="/opt/gradle/bin:$PATH"' >> "$HOME/.bashrc"
source "$HOME/.bashrc"

java --version
mvn --version
gradle --version
```

Java 项目也可以把 `antlr-4.13.1-complete.jar` 放进项目的依赖配置中；不要把
大体积生成物提交到仓库。

#### OCaml：Dune、ocamllex、ocamlyacc 和 Menhir

```bash
sudo apt install -y ocaml opam m4 pkg-config
opam init --disable-sandboxing -y
eval "$(opam env)"
opam switch create 5.2.0 ocaml-base-compiler.5.2.0 -y
eval "$(opam env)"
opam install dune menhir -y

# ocamllex 和 ocamlyacc 随 OCaml 编译器安装
ocamlc -version
ocamllex -version
ocamlyacc --version
dune --version
menhir --version
```

#### C/C++：CMake 4.0.3 和 Make

```bash
# Make 和基础编译器
sudo apt install -y build-essential

# 安装指定的 CMake 4.0.3；pip 版本适合 WSL 用户，不影响系统 apt 版本
python3 -m pip install --user cmake==4.0.3
export PATH="$HOME/.local/bin:$PATH"

cmake --version
make --version
gcc --version
g++ --version
```

如果 `pip` 不可用，先执行 `sudo apt install -y python3-pip`；也可以从
[CMake 官方下载页](https://cmake.org/download/) 下载 CMake 4.0.3 的 Linux 二进制包。

:::warning 使用生成器的前提
若使用 Flex/Bison，实验报告中必须给出完整的 `.l` / `.y` 文件，
并额外说明如何手工构造等价的分析器；否则该实验最高按 80% 计分。
:::

ANTLR、Menhir 等生成器同样需要在报告中说明输入文法、生成命令和生成代码如何
接入项目。生成器是选做工具，不改变 ToyC 文法和统一输出格式。

### 3. 汇编与运行环境（第四至第六部分需要）

本次作业统一生成 **RISC-V64** 目标代码，具体目标为 **RV64GC**，不得生成 RISC-V32、MIPS 或 x86-64 指令：

```bash
# Ubuntu/WSL 安装 RISC-V 64 位交叉工具链和 QEMU
sudo apt install -y gcc-riscv64-unknown-elf binutils-riscv64-unknown-elf \
  gcc-riscv64-linux-gnu qemu-user qemu-system-misc

# 查看工具链和 QEMU
riscv64-unknown-elf-gcc --version
qemu-riscv64 --version
```

如果发行版没有提供 `qemu-riscv64`，可以安装 `qemu-user-static`，或从 QEMU 官方版本安装。编译器输出应使用 RV64 寄存器和 ABI，推荐命令参数为：

```bash
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static out.s -o out.elf
qemu-riscv64 ./out.elf
```

若课程组提供的是 Linux 目标库，则使用课程指定的 `riscv64-unknown-linux-gnu-*` 工具链和 ABI；不要把 RV32 库与 RV64 汇编混合链接。运行时库使用课程组提供的 `libtoyc.a`，编译器需要为 `getint()` 和 `putint(int)` 生成外部调用，并在最终链接时加入该库。

### 4. QEMU 启动与标准输入

编译器本身从标准输入读取 ToyC 源代码，生成汇编到标准输出：

```bash
./your_compiler < test.c > test.s
```

链接后，使用 QEMU 运行 RV64 程序，并把测试数据传给被编译程序的标准输入：

```bash
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static test.s libtoyc.a -o test.elf
printf '42\n' | qemu-riscv64 ./test.elf
```

QEMU 用户态模式适合运行单个 RV64 Linux/静态 ELF；如果课程环境要求完整虚拟机，再使用 `qemu-system-riscv64` 配合课程提供的内核、设备树和磁盘镜像，不能只凭一个裸 ELF 启动完整系统。

### 5. 可选优化参数

编译器应接受可选参数 `-opt`：

```bash
./your_compiler -opt < test.c > optimized.s
```

未提供 `-opt` 时优先保证功能正确；提供 `-opt` 时可以启用常量折叠、局部死代码消除和表达式简化，也可以暂时忽略该参数。两种模式都必须输出合法的 RV64GC 汇编。

## 三、目录约定

每个实验在仓库中占一个独立目录，建议结构如下：

```text
labs/
├── lab1-lexer/
│   ├── src/            # 源代码
│   ├── tests/          # 测试用例（.mc 输入 + .expected 期望输出）
│   ├── Makefile        # 或 build.sh / pom.xml
│   └── README.md       # 简要说明如何构建与运行
└── lab2-parser/
```

## 四、最小可运行验证

在正式动手前，请先确保下面的命令能跑通，这证明你的工具链是完整的：

```bash
# 1. 确认编译器可用
g++ --version

# 2. 编译并运行一个最小程序
cat > hello.mc <<'EOF'
int main() {
  return 0;
}
EOF

# 3. 用统一驱动处理它（实验一之后应能输出 Token 流）
./mycompiler --dump-tokens < hello.mc
```

如果能正常输出 Token 流而程序不崩溃，环境即准备完成。

## 五、常见环境问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `flex: command not found` | 未安装或未加入 PATH | 重装并在 `~/.bashrc` 中导出 PATH |
| 生成中文乱码 | 终端编码与文件编码不一致 | 统一使用 UTF-8，避免 BOM |
| `Permission denied` 运行脚本 | 脚本没有可执行位 | `chmod +x build.sh` |
| Windows 下换行符导致解析失败 | CRLF 混入输入 | 配置 `.gitattributes` 强制 LF |
