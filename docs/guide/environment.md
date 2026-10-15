---
sidebar_position: 1
sidebar_label: 开发环境与工具链
title: 开发环境与工具链
description: 从 Ubuntu 或 WSL 开始，按顺序通过命令行安装工具链并验证 ToyC 实验环境
---

# 开发环境与工具链

:::info[示例目录]
本页使用 **Linux 用户主目录下的 `ToyC/`** 作为示例项目目录，即 `/home/用户名/ToyC/`。同学们可以使用其他项目名称，执行命令时替换其中的 `ToyC` 即可。

命令中的 `"$HOME/ToyC"` 表示示例项目根目录；`$HOME` 和 `~` 都指当前 **Linux 用户**的主目录。Windows 用户名与 Linux 用户名可能不同。WSL 安装命令在 Windows PowerShell 中执行，Linux 路径在进入 Ubuntu 后使用。

Maven、Gradle 和 ANTLR 安装在 `~/.local/`，安装包与环境验证程序放在 `~/.cache/`。安装、验证命令使用完整路径，可以从任意 Ubuntu 工作目录执行；执行 Git 和项目构建命令前，进入实际项目根目录，本页示例为 `cd "$HOME/ToyC"`。
:::

本页以 **Ubuntu 24.04 LTS（x86-64 或 ARM64 开发主机）** 为基础。Windows 用户先安装 WSL2，再在 Ubuntu 终端中完成后续步骤；已有 Ubuntu 24.04 的用户直接从第二步开始。命令块会注明执行位置，遇到报错时先解决该步骤，再继续安装。

:::info[如何区分命令执行位置]
全文的命令块都使用 `# 执行位置：...` 注释标明输入命令的终端，复制命令时可以保留注释。

- **Windows PowerShell**：安装或启动 WSL 的命令在 Windows 中输入。
- **WSL / Ubuntu 开发主机终端**：安装工具、构建编译器、交叉链接以及调用 `qemu-riscv64` 的命令都在这里输入。`qemu-riscv64` 以用户态模拟方式执行单个 RISC-V 程序，运行结束后仍回到同一个开发主机终端。
- **QEMU 虚拟机内的 RISC-V Ubuntu 终端**：使用 `qemu-system-riscv64` 启动完整系统并登录后，才在这里安装虚拟机内的工具、链接和直接运行 `./input`。启动 QEMU 与发起 SSH 连接的命令仍在开发主机输入；SSH 会话中执行 `exit` 后返回开发主机。

两种 QEMU 模式的区别见 [QEMU 用户态模拟说明](https://www.qemu.org/docs/master/user/main.html)与 [QEMU 系统模拟说明](https://www.qemu.org/docs/master/system/introduction.html)。完整虚拟机的分步命令见 [ToyC 运行时库](../reference/toyc-runtime#编译与运行)。
:::

软件包、构建工具和生成器均通过命令行安装。课程组提供的运行时库、报告规范和参考文档在第六步通过下载链接获取。

实验代码选择 C / C++、Java 或 Rust 中的一种语言实现。第二步、第四步和第六步是公共步骤；第三步只需完成所选语言的分支，第五步按需安装生成器。

| 步骤 | 内容 | 执行位置 |
| --- | --- | --- |
| 1 | 安装 WSL2 与 Ubuntu 24.04 | Windows 管理员 PowerShell |
| 2 | 安装基础工具、准备目录和命令搜索路径 | Ubuntu 终端 |
| 3 | 安装并验证所选语言的工具链 | Ubuntu 终端 |
| 4 | 安装 RISC-V 交叉工具链与 QEMU，运行独立汇编示例 | Ubuntu 终端 |
| 5 | 安装并验证词法 / 语法生成器（选用） | Ubuntu 终端 |
| 6 | 获取课程附件，验证 ToyC 运行时库 | 浏览器下载附件，Ubuntu 终端验证 |
| 7 | 开始编译器项目 | Ubuntu 终端 |

## 一、安装 WSL2 与 Ubuntu（Windows 用户）

在**管理员 PowerShell** 中执行：

```powershell
# 执行位置：Windows 管理员 PowerShell
wsl --install --web-download -d Ubuntu-24.04
```

`--web-download` 使用在线来源下载发行版。安装完成后按提示重启 Windows，再在 PowerShell 中检查状态并启动 Ubuntu：

```powershell
# 执行位置：Windows 管理员 PowerShell
wsl --status
wsl --list --verbose
wsl -d Ubuntu-24.04
```

首次启动时按提示创建 Linux 用户名和密码。这个账号用于后续 `sudo` 命令；输入密码时终端不会显示字符。

**从这里开始，所有 Bash 命令均在 Ubuntu 终端中执行。** 确认系统版本：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
cat /etc/os-release
uname -m
```

`VERSION_ID` 应为 `24.04`。`uname -m` 显示的是开发主机架构，可能为 `x86_64` 或 `aarch64`；第四步安装的交叉工具链负责生成 RISC-V 程序。

WSL 安装参数可查阅[微软官方说明](https://learn.microsoft.com/en-us/windows/wsl/basic-commands#install)。

## 二、安装公共基础工具并准备目录

先创建并进入项目根目录，确认终端显示的位置：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
mkdir -p "$HOME/ToyC"
cd "$HOME/ToyC"
pwd
```

输出应为 `/home/你的Linux用户名/ToyC`。接着更新软件包索引，安装后续下载、解压和构建命令所需的工具，并准备工具与缓存目录：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
sudo apt update
sudo apt install -y ca-certificates curl git build-essential cmake \
  unzip xz-utils file python3

mkdir -p "$HOME/.local/bin" "$HOME/.local/opt" "$HOME/.local/share/antlr" \
  "$HOME/.cache/toyc-downloads" "$HOME/.cache/toyc-env"
```

`build-essential` 提供 GCC、G++ 和 Make，也是 Rust 默认链接器以及 ANTLR C++ 运行库构建所需的基础。安装 Java 或 Rust 分支时也保留这一步。

将本地安装的工具加入当前终端和以后打开的 Bash 终端：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
export PATH="$HOME/.local/bin:$PATH"
grep -qxF 'export PATH="$HOME/.local/bin:$PATH"' "$HOME/.bashrc" ||
  printf '%s\n' 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"

git --version
curl --version
gcc --version
g++ --version
make --version
cmake --version
```

本页的示例项目目录为 `~/ToyC`。安装包缓存在 `~/.cache/toyc-downloads`，环境验证程序放在 `~/.cache/toyc-env`。

Git 的用户名和邮箱可按自己的信息配置：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
git config --global user.name "你的姓名"
git config --global user.email "你的邮箱"
```

## 三、安装并验证所选语言的工具链

| 实现语言 | 本页使用的工具 |
| --- | --- |
| C / C++ | Ubuntu 24.04 提供的 GCC、G++、CMake、Make |
| Java | JDK 21、Maven 3.9.11、Gradle 8.5 |
| Rust | Rust / Cargo 1.85.0 |

以下程序用于验证开发工具，运行结果应与各小节给出的输出一致。这些验证程序无需提交。

### 3.1 C / C++

第二步已经安装所需工具。用 CMake 编译并运行一个 C++17 程序：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
mkdir -p "$HOME/.cache/toyc-env/cpp"
cat > "$HOME/.cache/toyc-env/cpp/main.cpp" <<'EOF'
#include <iostream>
int main() {
    std::cout << "C++ environment OK\n";
    return 0;
}
EOF

cat > "$HOME/.cache/toyc-env/cpp/CMakeLists.txt" <<'EOF'
cmake_minimum_required(VERSION 3.20)
project(EnvironmentCheck LANGUAGES CXX)
add_executable(environment-check main.cpp)
target_compile_features(environment-check PRIVATE cxx_std_17)
EOF

cmake -S "$HOME/.cache/toyc-env/cpp"   -B "$HOME/.cache/toyc-env/cpp/build"
cmake --build "$HOME/.cache/toyc-env/cpp/build" -j2
"$HOME/.cache/toyc-env/cpp/build/environment-check"
```

最后应输出 `C++ environment OK`。使用 C 实现时，第二步的 `gcc` 和 `make` 同样可用。

### 3.2 Java

先安装 JDK 21，再下载、解压并配置构建工具。Maven 和 Gradle 均安装到用户目录中，项目选择其中一种作为构建系统即可。

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
sudo apt install -y openjdk-21-jdk
java --version
javac --version
```

两者应显示 Java 21。若机器已有其他 JDK 且显示的不是 21，先运行以下命令并选择 Java 21，再重新检查上面的版本：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
sudo update-alternatives --config java
sudo update-alternatives --config javac
```

设置 `JAVA_HOME`，使构建工具使用 Java 21，再安装 Maven 与 Gradle：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
export JAVA_HOME="$(dirname "$(dirname "$(readlink -f "$(command -v javac)")")")"
export PATH="$JAVA_HOME/bin:$PATH"

curl --fail --location --retry 3 \
  https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.11/apache-maven-3.9.11-bin.tar.gz \
  --output "$HOME/.cache/toyc-downloads/apache-maven-3.9.11-bin.tar.gz"
tar -xzf "$HOME/.cache/toyc-downloads/apache-maven-3.9.11-bin.tar.gz" \
  -C "$HOME/.local/opt"
ln -sfn "$HOME/.local/opt/apache-maven-3.9.11/bin/mvn"   "$HOME/.local/bin/mvn"

curl --fail --location --retry 3 \
  https://services.gradle.org/distributions/gradle-8.5-bin.zip \
  --output "$HOME/.cache/toyc-downloads/gradle-8.5-bin.zip" ||
  curl --fail --location --retry 3 \
    https://mirrors.cloud.tencent.com/gradle/gradle-8.5-bin.zip \
    --output "$HOME/.cache/toyc-downloads/gradle-8.5-bin.zip"
unzip -q -o "$HOME/.cache/toyc-downloads/gradle-8.5-bin.zip"   -d "$HOME/.local/opt"
ln -sfn "$HOME/.local/opt/gradle-8.5/bin/gradle"   "$HOME/.local/bin/gradle"

mvn --version
gradle --version
```

检查输出中的 Maven 版本为 `3.9.11`、Gradle 版本为 `8.5`，两者使用的 JVM 均为 Java 21。Gradle 安装包使用官方来源，下载失败时自动尝试镜像。

再验证 Java 编译与运行：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
mkdir -p "$HOME/.cache/toyc-env/java"
cat > "$HOME/.cache/toyc-env/java/EnvironmentCheck.java" <<'EOF'
public class EnvironmentCheck {
    public static void main(String[] args) {
        System.out.println("Java environment OK");
    }
}
EOF

javac --release 21 "$HOME/.cache/toyc-env/java/EnvironmentCheck.java"
java -cp "$HOME/.cache/toyc-env/java" EnvironmentCheck
```

应输出 `Java environment OK`。选择 Gradle 的同学们继续用下面的 Java 21 项目验证构建与运行：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
mkdir -p "$HOME/.cache/toyc-env/gradle/src/main/java"
cat > "$HOME/.cache/toyc-env/gradle/settings.gradle" <<'EOF'
rootProject.name = 'toyc-environment-check'
EOF

cat > "$HOME/.cache/toyc-env/gradle/build.gradle" <<'EOF'
plugins {
    id 'application'
}

tasks.withType(JavaCompile).configureEach {
    options.release = 21
}

application {
    mainClass = 'EnvironmentCheck'
}
EOF

cat > "$HOME/.cache/toyc-env/gradle/src/main/java/EnvironmentCheck.java" <<'EOF'
public class EnvironmentCheck {
    public static void main(String[] args) {
        System.out.println("Gradle environment OK (Java "
            + Runtime.version().feature() + ")");
    }
}
EOF

gradle --no-daemon --console=plain --offline \
  -p "$HOME/.cache/toyc-env/gradle" clean build run
```

输出中应包含 `Gradle environment OK (Java 21)` 和 `BUILD SUCCESSFUL`；构建产物位于 `~/.cache/toyc-env/gradle/build/`。此检查使用 Gradle 内置插件，无外部依赖，因此可以离线执行；正式项目引入 ANTLR 等依赖时，首次构建需要联网。

Maven 安装方式和 Gradle 对 Java 21 的支持分别见 [Maven 官方说明](https://maven.apache.org/install.html)和 [Gradle 8.5 发布说明](https://docs.gradle.org/8.5/release-notes.html)。

### 3.3 Rust

基础链接工具已在第二步安装。下面按开发主机架构下载官方 rustup 安装程序，再安装指定版本的 Rust 和 Cargo；下载时使用 IPv4：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
TOYC_RUST_HOST="$(uname -m)-unknown-linux-gnu"
curl --ipv4 --fail --location --retry 3 \
  "https://static.rust-lang.org/rustup/dist/$TOYC_RUST_HOST/rustup-init" \
  --output "$HOME/.cache/toyc-downloads/rustup-init"
chmod +x "$HOME/.cache/toyc-downloads/rustup-init"
"$HOME/.cache/toyc-downloads/rustup-init" \
  -y --profile minimal --default-toolchain 1.85.0
source "$HOME/.cargo/env"

rustc --version
cargo --version
```

<details>
<summary>Rust 官方下载出现超时或 SSL 连接失败时</summary>

在当前 Ubuntu 终端中设置 [RsProxy 镜像](https://rsproxy.cn/)，再执行安装。镜像配置在安装命令之前生效，整个过程仍通过命令行完成：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
export RUSTUP_DIST_SERVER="https://rsproxy.cn"
export RUSTUP_UPDATE_ROOT="https://rsproxy.cn/rustup"
TOYC_RUST_HOST="$(uname -m)-unknown-linux-gnu"
curl --ipv4 --fail --location --retry 3 \
  "https://rsproxy.cn/rustup/dist/$TOYC_RUST_HOST/rustup-init" \
  --output "$HOME/.cache/toyc-downloads/rustup-init"
chmod +x "$HOME/.cache/toyc-downloads/rustup-init"
"$HOME/.cache/toyc-downloads/rustup-init" \
  -y --profile minimal --default-toolchain 1.85.0
source "$HOME/.cargo/env"
rustc --version
cargo --version
```

</details>

两者版本应为 `1.85.0`。创建一个无外部依赖的程序，验证 Cargo 构建与运行：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
mkdir -p "$HOME/.cache/toyc-env/rust/src"
cat > "$HOME/.cache/toyc-env/rust/Cargo.toml" <<'EOF'
[package]
name = "environment-check"
version = "0.1.0"
edition = "2021"
EOF

cat > "$HOME/.cache/toyc-env/rust/src/main.rs" <<'EOF'
fn main() {
    println!("Rust environment OK");
}
EOF

cargo run --quiet --manifest-path "$HOME/.cache/toyc-env/rust/Cargo.toml"
```

最后应输出 `Rust environment OK`。rustup 的工具链管理方式见[Rust 官方说明](https://rust-lang.github.io/rustup/concepts/toolchains.html)。

## 四、安装 RISC-V 交叉工具链与 QEMU

所有实现语言都需要这一步：同学们实现的编译器在开发主机上运行，生成的 RV64GC 汇编由交叉工具链链接，再由 `qemu-riscv64` 执行。

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
sudo apt install -y gcc-riscv64-unknown-elf binutils-riscv64-unknown-elf \
  gcc-riscv64-linux-gnu gdb-multiarch qemu-user

riscv64-unknown-elf-gcc --version
riscv64-linux-gnu-gcc --version
qemu-riscv64 --version
gdb-multiarch --version
```

以下独立汇编程序直接调用 Linux 的输出和退出接口，可以在获取课程运行时库之前验证链接器与 QEMU：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
# qemu-riscv64 命令也在此终端输入，由 QEMU 执行 RISC-V 程序
mkdir -p "$HOME/.cache/toyc-env/riscv"
cat > "$HOME/.cache/toyc-env/riscv/check.s" <<'EOF'
.section .rodata
message:
    .ascii "RV64GC OK\n"
.text
.globl _start
_start:
    li a0, 1
    la a1, message
    li a2, 10
    li a7, 64
    ecall
    li a0, 0
    li a7, 93
    ecall
EOF

riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static -Wl,-e,_start \
  "$HOME/.cache/toyc-env/riscv/check.s" \
  -o "$HOME/.cache/toyc-env/riscv/check"
file "$HOME/.cache/toyc-env/riscv/check"
qemu-riscv64 "$HOME/.cache/toyc-env/riscv/check"
```

`file` 应识别出 RISC-V 的 64 位 ELF，运行输出应为 `RV64GC OK`。在 x86-64 / ARM 主机上运行 RISC-V 产物时，显式使用 `qemu-riscv64`。

本页采用 qemu-user 运行单个静态 ELF，Ubuntu / WSL 提供编译器的开发环境。启动完整 Linux 虚拟机的 qemu-system 模式属于扩展学习，可参阅第六步的 QEMU 调试资料。

## 五、安装词法 / 语法生成器（选用）

手写词法分析器和语法分析器可以跳过本节。使用生成器时，实验报告需说明词法规则、语法分析方法和完整文法文件；仅提交生成物而未说明原理的，最高按 80% 计分。

生成器用于实验一、实验二。IR 生成、优化和目标代码生成仍需自行实现。

本页的 Flex / Bison 用于 C / C++ 前端，ANTLR 示例分别面向 C++ 和 Java。Rust 用户可先采用手写前端，保持同学们实现的编译器使用同一种实现语言。

### 5.1 Flex / Bison

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
sudo apt install -y flex bison libfl-dev
flex --version
bison --version
```

Bison 通常使用自下而上的 LALR(1) 分析；ANTLR 使用自适应 LL 分析。根据所选实现语言和前端设计选择工具。

### 5.2 ANTLR 4.13.1：安装生成器

ANTLR 生成器是 Java 程序。即使同学们实现的编译器使用 C++，也需要先安装 Java；以下命令会补齐 JDK 21，再下载生成器并创建可在新终端使用的 `antlr4` 命令：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
sudo apt install -y openjdk-21-jdk
curl --fail --location --retry 3 \
  https://www.antlr.org/download/antlr-4.13.1-complete.jar \
  --output "$HOME/.local/share/antlr/antlr-4.13.1-complete.jar"

cat > "$HOME/.local/bin/antlr4" <<'EOF'
#!/bin/sh
exec java -jar "$HOME/.local/share/antlr/antlr-4.13.1-complete.jar" "$@"
EOF
chmod +x "$HOME/.local/bin/antlr4"
antlr4
```

输出开头应显示 `ANTLR Parser Generator Version 4.13.1`。生成器和项目使用的运行库版本应保持一致。

下面的文法仅用于环境验证。在同一个目录中，完成所选语言的后续验证：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
mkdir -p "$HOME/.cache/toyc-env/antlr"
cat > "$HOME/.cache/toyc-env/antlr/EnvCheck.g4" <<'EOF'
grammar EnvCheck;
start : INT PLUS INT EOF ;
PLUS  : '+' ;
INT   : [0-9]+ ;
WS    : [ \t\r\n]+ -> skip ;
EOF
```

### 5.3 ANTLR C++：安装运行库并验证

**C++ 用户执行本小节。** 生成器只产生 C++ 源文件，编译这些文件还需要 ANTLR C++ 运行库。按“下载源码 → 解压 → 配置 → 构建 → 安装”的顺序执行：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
curl --fail --location --retry 3 \
  https://www.antlr.org/download/antlr4-cpp-runtime-4.13.1-source.zip \
  --output "$HOME/.cache/toyc-downloads/antlr4-cpp-runtime-4.13.1-source.zip"
mkdir -p "$HOME/.cache/toyc-env/antlr-runtime"
unzip -q -o "$HOME/.cache/toyc-downloads/antlr4-cpp-runtime-4.13.1-source.zip" \
  -d "$HOME/.cache/toyc-env/antlr-runtime"

cmake -S "$HOME/.cache/toyc-env/antlr-runtime" \
  -B "$HOME/.cache/toyc-env/antlr-runtime/build" \
  -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_STANDARD=17 \
  -DCMAKE_INSTALL_PREFIX="$HOME/.local" -DCMAKE_INSTALL_LIBDIR=lib \
  -DANTLR4_INSTALL=ON -DANTLR_BUILD_CPP_TESTS=OFF -DANTLR_BUILD_SHARED=OFF
cmake --build "$HOME/.cache/toyc-env/antlr-runtime/build" -j2
cmake --install "$HOME/.cache/toyc-env/antlr-runtime/build"

cd "$HOME/.cache/toyc-env/antlr"
antlr4 -Dlanguage=Cpp -visitor -no-listener -o cpp EnvCheck.g4
cat > cpp/main.cpp <<'EOF'
#include "antlr4-runtime.h"
#include "EnvCheckLexer.h"
#include "EnvCheckParser.h"
#include <iostream>
int main() {
    antlr4::ANTLRInputStream input(std::cin);
    EnvCheckLexer lexer(&input);
    antlr4::CommonTokenStream tokens(&lexer);
    EnvCheckParser parser(&tokens);
    auto* tree = parser.start();
    if (parser.getNumberOfSyntaxErrors() != 0) return 1;
    std::cout << tree->toStringTree(&parser) << '\n';
    return 0;
}
EOF

g++ -std=c++17 \
  -I"$HOME/.local/include/antlr4-runtime" -Icpp cpp/*.cpp \
  "$HOME/.local/lib/libantlr4-runtime.a" -pthread -o cpp/env-check
printf '7+5\n' | ./cpp/env-check
```

应输出 `(start 7 + 5 <EOF>)`。这同时验证了生成器、C++ 头文件、运行库与链接配置。正式项目使用 CMake 时，需要将生成的源文件加入目标，并链接 `antlr4_static` 或相应的运行库文件；配置方法见 [ANTLR C++ 官方文档](https://github.com/antlr/antlr4/blob/4.13.1/runtime/Cpp/cmake/Antlr4Package.md)。

### 5.4 ANTLR Java：验证生成代码

**Java 用户执行本小节。** 完整 jar 包已经包含 Java 运行库，可用于本次验证：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
cd "$HOME/.cache/toyc-env/antlr"
antlr4 -Dlanguage=Java -visitor -no-listener -o java EnvCheck.g4
javac -cp "$HOME/.local/share/antlr/antlr-4.13.1-complete.jar" java/*.java
printf '7+5\n' | java \
  -cp "$HOME/.local/share/antlr/antlr-4.13.1-complete.jar:java" \
  org.antlr.v4.gui.TestRig EnvCheck start -tree
```

应输出 `(start 7 + 5 <EOF>)`。正式 Maven / Gradle 项目分别使用 `antlr4-maven-plugin` 或 Gradle 的内置 `antlr` 插件管理生成步骤，依赖版本统一设为 `4.13.1`。Gradle 内置插件的写法是 `id 'antlr'`，生成器依赖使用 `org.antlr:antlr4:4.13.1`，Java 运行库使用 `org.antlr:antlr4-runtime:4.13.1`。

## 六、获取课程附件并验证运行时库

这一步通过链接获取**课程组提供的文件**。这些附件统一列在[资源下载](../reference/downloads)页：

| 资料 | 获取入口 | 本地用途 |
| --- | --- | --- |
| ToyC 词法与文法约定 | [查看文法](../reference/grammar) | 实现词法 / 语法分析时的语言依据 |
| ToyC RV64GC 运行时库 | [下载 libtoyc.a](pathname:///downloads/libtoyc.a) | 链接同学们实现的编译器生成的汇编 |
| 课程设计报告书写规范 | [下载报告规范](pathname:///word/武汉大学计算机学院课程设计报告书写规范.doc) | 完成实验后的统一报告 |
| QEMU 本地调试指南 | [下载调试指南](pathname:///pdf/QEMU本地调试指南.pdf) | 单步调试 RISC-V 产物 |
| SysY2022 语言定义 | [下载语言定义](pathname:///pdf/SysY2022语言定义-V1.pdf) | 竞赛参考 |
| SysY2022 运行时库说明 | [下载运行时库说明](pathname:///pdf/SysY2022运行时库-V1.pdf) | 竞赛参考 |
| SysY2026 扩展规范 | [下载扩展规范](pathname:///pdf/Sysy2026.pdf) | 竞赛参考 |

SysY 文档用于扩展学习，ToyC 实验的语言规则以本站文法为准。

### 6.1 放置 libtoyc.a

在 Ubuntu 终端中准备目录：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
mkdir -p "$HOME/ToyC/third_party/toyc"   "$HOME/ToyC/third_party/docs"
```

下载 `libtoyc.a` 后，将它放到 `~/ToyC/third_party/toyc/libtoyc.a`。Windows 浏览器通常把文件保存到 Windows 下载目录，可在 Ubuntu 中复制；下面的 Windows 用户名应替换为自己的实际用户名：

```bash
# 执行位置：WSL Ubuntu 终端（访问 Windows 下载目录）
cp "/mnt/c/Users/你的Windows用户名/Downloads/libtoyc.a" \
  "$HOME/ToyC/third_party/toyc/libtoyc.a"
```

已有原生 Ubuntu 的用户可从其下载目录复制：

```bash
# 执行位置：原生 Ubuntu 开发主机终端
cp "$HOME/Downloads/libtoyc.a"   "$HOME/ToyC/third_party/toyc/libtoyc.a"
```

以上两种复制方式按当前系统选择一种。报告规范和参考 PDF 可集中放到 `third_party/docs/`。

### 6.2 验证 ToyC 运行时库

使用下面的 C 程序验证库文件、启动入口以及 `getint` / `putint`：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
# qemu-riscv64 命令也在此终端输入，由 QEMU 执行 RISC-V 程序
test -f "$HOME/ToyC/third_party/toyc/libtoyc.a"
mkdir -p "$HOME/.cache/toyc-env/runtime"
cat > "$HOME/.cache/toyc-env/runtime/check.c" <<'EOF'
extern int getint(void);
extern void putint(int value);
int main(void) {
    int value = getint();
    putint(value + 1);
    return 0;
}
EOF

riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static -fno-builtin \
  "$HOME/.cache/toyc-env/runtime/check.c" \
  "$HOME/ToyC/third_party/toyc/libtoyc.a" \
  -o "$HOME/.cache/toyc-env/runtime/check"
TOYC_RESULT="$(printf '41\n' | qemu-riscv64 "$HOME/.cache/toyc-env/runtime/check")"
test "$TOYC_RESULT" = 42
printf 'ToyC runtime OK: %s\n' "$TOYC_RESULT"
```

应输出 `ToyC runtime OK: 42`。运行时接口和调用约定详见[ToyC 运行时库](../reference/toyc-runtime)。

`libtoyc.a` 由评测平台提供，无需提交到同学们的项目仓库；本地下载的库仅用于调试。软件安装缓存、环境验证程序和下载附件也无需作为实验提交物。

## 七、开始编译器项目

完成所选语言验证、RISC-V 验证和运行时库验证后，环境即准备完成。回到项目目录：

```bash
# 执行位置：WSL / Ubuntu 开发主机终端
cd "$HOME/ToyC"
git init
```

所有实验共享一个源码仓库和构建系统：

```text
ToyC/
├── CMakeLists.txt / Makefile / pom.xml / build.gradle / Cargo.toml
├── src/
│   ├── lexer/
│   ├── parser/
│   ├── ir/
│   ├── codegen/
│   └── optim/
├── third_party/
│   ├── toyc/libtoyc.a
│   └── docs/
└── README.md
```

构建配置文件放在项目根目录。如果已有课程项目仓库，在原仓库中继续开发，并按实际路径替换本页的示例路径。后续命令中的相对路径以项目根目录为起点，编译器接口要求见[统一驱动接口](./workflow#统一驱动接口)。

从[第一部分：词法分析](../labs/part1-lexer)开始实现。实现相应阶段后，再按照[统一驱动接口](./workflow#统一驱动接口)和[开发与测试流程](workflow)验证 `-token`、`-ast`、`-asm` 等接口。

## 常见搭建问题

| 现象 | 检查与处理 |
| --- | --- |
| `curl: command not found` / `unzip: command not found` | 先完成第二步的基础工具安装，再执行下载与解压命令 |
| `sudo` 要求密码 | 输入首次启动 Ubuntu 时创建的 Linux 账号密码 |
| 软件包找不到 | 确认 Ubuntu 版本为 24.04，并先执行 `sudo apt update` |
| `mvn` / `gradle` / `antlr4` 找不到 | 检查 `~/.local/bin` 是否已加入 `PATH`，确认对应安装步骤已成功 |
| Java 版本不是 21 | 使用第三步的 `update-alternatives` 选择 Java 21；若自行设置过 `JAVA_HOME`，也需指向该 JDK |
| ANTLR C++ 找不到头文件或运行库 | 完成 5.3 的运行库构建与安装，并在项目中同时配置 include 路径和链接库 |
| 解压提示文件不存在或格式错误 | 检查前一条下载命令是否成功；修复下载错误后重新下载，再解压 |
| `Exec format error` | RISC-V ELF 在开发主机上用 `qemu-riscv64` 执行 |
| 链接提示找不到 `libtoyc.a` | 完成 6.1，核对库文件名和链接命令中的完整路径 |
