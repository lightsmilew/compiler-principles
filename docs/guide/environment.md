---
sidebar_position: 1
sidebar_label: 开发环境与工具链
title: 开发环境与工具链
description: 编译器实验所需的环境准备、推荐工具与最小可运行验证
---
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

:::info[关于生成器的使用]
实验一与实验二的词法/语法分析**允许**使用 Flex、Bison、ANTLR、Menhir 等生成器，属于选做工具。实验报告必须说明输入的文法文件全文、生成命令以及生成代码如何接入项目主程序；仅提交生成物而未说明原理的，最高按 80% 计分。ANTLR 的详细用法（含 .g4 编写、CMake/Maven 集成、Visitor 模式实现）见本节下方。
:::

### 1. ANTLR 4 详细用法（C++）

ANTLR 依赖 JRE（Java Runtime Environment），通过一个 `.g4` 语法文件同时生成词法分析器和语法分析器。以下以 ToyC 的变量声明和表达式为例，说明完整工作流程。

**前置依赖**

```bash
sudo apt install -y default-jdk cmake build-essential
java -version   # 确认出现版本号
```

下载 ANTLR jar 包并配置命令行别名：

```bash
mkdir -p "$HOME/.local/share/antlr"
curl -L https://www.antlr.org/download/antlr-4.13.1-complete.jar \
  -o "$HOME/.local/share/antlr/antlr-4.13.1-complete.jar"
cat >> "$HOME/.bashrc" <<'EOF'
export ANTLR_JAR="$HOME/.local/share/antlr/antlr-4.13.1-complete.jar"
alias antlr4='java -jar "$ANTLR_JAR"'
alias grun='java org.antlr.v4.gui.TestRig'
EOF
source "$HOME/.bashrc"
```

ANTLR 官方文档（含完整语法参考）：[https://www.antlr.org/](https://www.antlr.org/)

---

**第一步：编写 .g4 语法文件**

一个 `.g4` 文件分为两部分：`grammar` 声明（必须与文件名一致）以及词法规则和语法规则的定义。

以下是一个最小化的 ToyC 文法片段（用于说明结构，不覆盖全部语法）：

```antlr
// ToyC.g4
grammar ToyC;  // 文件名必须是 ToyC.g4，且与 grammar 名称一致

// ----- 词法规则（定义 token） -----
INT     : [0-9]+ ;
ID      : [a-zA-Z_][a-zA-Z0-9_]* ;
WS      : [ \t\r\n]+ -> skip ;   // 空白字符跳过，不进入 token 流
IF      : 'if' ;
ELSE    : 'else' ;
WHILE   : 'while' ;
RETURN  : 'return' ;
LPAREN  : '(' ;
RPAREN  : ')' ;
LBRACE  : '{' ;
RBRACE  : '}' ;
SEMI    : ';' ;
COMMA   : ',' ;
ASSIGN  : '=' ;
MUL     : '*' ;
DIV     : '/' ;
MOD     : '%' ;
PLUS    : '+' ;
MINUS   : '-' ;
LT      : '<' ;
GT      : '>' ;
LE      : '<=' ;
GE      : '>=' ;
EQ      : '==' ;
NE      : '!=' ;
AND     : '&&' ;
OR      : '||' ;
NOT     : '!' ;

// ----- 语法规则（定义可组合的语法结构） -----
program      : funcDecl* ;                           // 程序由若干函数声明组成
funcDecl     : type ID LPAREN params? RPAREN block ; // 函数声明
params       : type ID (COMMA type ID)* ;            // 参数列表
block        : LBRACE stmt* RBRACE ;                 // 语句块
stmt         : decl SEMI                              // 变量声明
             | expr SEMI                              // 表达式语句
             | RETURN expr SEMI                       // return 语句
             | IF LPAREN expr RPAREN stmt (ELSE stmt)? // if/if-else
             | WHILE LPAREN expr RPAREN stmt         // while 循环
             | block                                  // 嵌套块
             ;
decl         : type ID (COMMA ID)* ;                 // 变量声明
type         : 'int' ;
expr         : expr op=(MUL|DIV|MOD) expr            // 乘除模
             | expr op=(PLUS|MINUS) expr              // 加减
             | expr op=(LT|GT|LE|GE) expr            // 关系运算
             | expr op=(EQ|NE) expr                   // 相等性运算
             | expr AND expr
             | expr OR expr
             | NOT expr
             | ID                                      // 变量引用
             | INT                                     // 整数常量
             | LPAREN expr RPAREN
             ;
```

词法规则的写法：
- **大写开头**：`INT`、`IF`、`ASSIGN` 等 → 生成 token 类型
- **小写开头**：`expr`、`stmt`、`block` → 语法规则，生成方法名
- `-> skip`：让 lexer 直接丢弃该 token，不传给 parser
- `'if'`、`'('`：直接写字符串字面量，lexer 会为其生成对应 token

语法规则的写法：
- `|` 分支：表示"或者"，如 `stmt` 可以是一条声明、表达式语句或 `return`
- `?`：可选（0或1次）
- `*`：零或多次
- `+`：一或多次
- `(group)?`：带名字的子规则，如 `op=(MUL|DIV)` 把匹配到的 token 记为 `op`

---

**第二步：生成 lexer 和 parser**

```bash
# 在 .g4 文件所在目录执行
# -Dlanguage=Cpp   指定生成 C++ 代码（Java 项目改为 -Dlanguage=Java）
# -o outputDir     指定生成代码的输出目录
# -visitor         生成 visitor 模式（推荐，用于遍历语法树）
antlr4 -Dlanguage=Cpp -o toyc_parser -visitor ToyC.g4

# 查看生成的文件
ls toyc_parser/
# ToyC.tokens  ToyCLexer.h  ToyCLexer.cpp
# ToyCParser.h ToyCParser.cpp
# ToyCParserVisitor.h  ToyCParserBaseVisitor.h  ToyCBaseVisitor.h
```

ANTLR 会生成三类文件：
- `ToyCLexer`：词法分析器，把输入字符流切成 token 流
- `ToyCParser`：语法分析器，基于 token 流构建语法树（ParseTree）
- `ToyCVisitor` / `ToyCBaseVisitor`：遍历器基类，继承它实现对每个语法节点的处理

---

**第三步：在 CMake 项目中集成**

```bash
mkdir -p src/frontend
mv ToyC.g4 src/frontend/
mkdir -p build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j$(nproc)
```

对应的 `CMakeLists.txt`：

```cmake
cmake_minimum_required(VERSION 3.10)
project(ToyC CXX)

set(CMAKE_CXX_STANDARD 17)
find_package(Threads REQUIRED)

file(GLOB_RECURSE SRC "src/*.cpp")
include_directories(src)

# ANTLR 生成的代码目录
include_directories(${CMAKE_SOURCE_DIR}/src/frontend/toyc_parser)

add_executable(compiler ${SRC})
target_link_libraries(compiler Threads::Threads)
```

---

**第四步：实现 visitor，构建 AST**

ANTLR 生成的 `ToyCParser` 以递归下降方式工作，每个语法规则对应一个方法，返回该规则的 `Context*` 对象。Visitor 模式允许你为每个规则实现处理函数：

```cpp
// ast_builder.hpp
#pragma once
#include "frontend/toyc_parser/ToyCParser.h"
#include "frontend/toyc_parser/ToyCBaseVisitor.h"
#include <memory>
#include <string>
#include <vector>

// AST 结点基类
struct ASTNode { virtual ~ASTNode() = default; };
struct IntLiteral : ASTNode { int value; explicit IntLiteral(int v) : value(v) {} };
struct BinaryExpr : ASTNode {
    std::string op;
    std::unique_ptr<ASTNode> left, right;
    BinaryExpr(std::string o, std::unique_ptr<ASTNode> l, std::unique_ptr<ASTNode> r)
        : op(std::move(o)), left(std::move(l)), right(std::move(r)) {}
};
// ... 其他结点类型

// 实现 visitor
class ASTBuilder : public ToyCBaseVisitor {
public:
    // 每个语法规则对应一个 visitXxx 方法，返回值是你自己定义的类型

    std::any visitIntLiteral(ToyCParser::IntLiteralContext* ctx) override {
        int val = std::stoi(ctx->INT()->getText());
        return std::any(std::make_unique<IntLiteral>(val));
    }

    std::any visitExpr(ToyCParser::ExprContext* ctx) override {
        if (ctx->children.size() == 3 && ctx->children[1] == ctx->op) {
            // 二元表达式：left op right
            auto left  = std::any_cast<std::unique_ptr<ASTNode>>(visit(ctx->expr(0)));
            auto right = std::any_cast<std::unique_ptr<ASTNode>>(visit(ctx->expr(1)));
            return std::any(std::make_unique<BinaryExpr>(
                ctx->op->getText(), std::move(left), std::move(right)));
        }
        // 单操作数情况（变量、括号表达式等）
        return visitChildren(ctx);
    }
};
```

关键点：
- `ToyCBaseVisitor` 提供了每个规则的默认实现（遍历子节点），你只需要 override 需要特殊处理的规则
- `visit` 方法返回 `std::any`（Java 风格的泛型容器），需要用 `std::any_cast` 解包
- `ctx->children` 包含该规则匹配到的所有子节点，通过 `ctx->ID()`、`ctx->INT()` 等方法直接拿到子 token

---

**第五步：使用 parser**

```cpp
#include "frontend/toyc_parser/ToyCLexer.h"
#include "frontend/toyc_parser/ToyCParser.h"
#include "antlr4-runtime.h"
#include <iostream>

int main() {
    antlr4::ANTLRInputStream input(std::cin);   // 从标准输入读取源程序
    ToyCLexer lexer(&input);
    antlr4::CommonTokenStream tokens(&lexer);
    ToyCParser parser(&tokens);

    ToyCParser::ProgramContext* tree = parser.program();
    std::cout << "parse tree: " << tree->toStringTree(&parser) << std::endl;

    ASTBuilder builder;
    auto ast = builder.visitProgram(tree);
    return 0;
}
```

工作流程：

```
源代码文本
    ↓
ANTLRInputStream（字符流）
    ↓
ToyCLexer（词法分析：字符 → Token）
    ↓
CommonTokenStream（Token 流）
    ↓
ToyCParser（语法分析：Token → ParseTree）
    ↓
ASTBuilder.visitXxx（Visitor 遍历：ParseTree → AST）
    ↓
后续阶段（语义分析、IR 生成…）
```

:::info[关于使用生成器的前提]
若使用 Flex/Bison，实验报告中必须给出完整的 `.l` / `.y` 文件，
并额外说明如何手工构造等价的分析器；否则该实验最高按 80% 计分。
:::

### 2. ANTLR 4 详细用法（Java）

Java 使用 Maven 或 Gradle 管理依赖，ANTLR 运行时库可以直接加进构建配置，不需要手动下载 jar 包。

**Maven 项目**

在 `pom.xml` 中加入依赖和 ANTLR 插件：

```xml
<dependencies>
    <dependency>
        <groupId>org.antlr</groupId>
        <artifactId>antlr4-runtime</artifactId>
        <version>4.13.1</version>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.antlr</groupId>
            <artifactId>antlr4-maven-plugin</artifactId>
            <version>4.13.1</version>
            <executions>
                <execution>
                    <goals>
                        <goal>true</goal>
                        <goal>antlr4</goal>
                    </goals>
                </execution>
            </executions>
            <configuration>
                <source>17</source>
                <target>17</target>
                <arguments>
                    <argument>-visitor</argument>
                </arguments>
            </configuration>
        </plugin>
    </plugins>
</build>
```

**Gradle 项目**

在 `build.gradle` 中：

```groovy
plugins {
    id 'java'
    id 'antlr' version '4.13.1'
}

repositories { mavenCentral() }
dependencies {
    antlr4 "org.antlr:antlr4-runtime:4.13.1"
}
```

:::info
Java 项目也可以手动下载 `antlr-4.13.1-complete.jar` 到本地，但使用 Maven/Gradle 依赖更便于团队协作；不要把大体积 jar 包提交到仓库。
:::

**生成代码**

把 `.g4` 文件放到 `src/main/antlr/` 目录（与 Maven 标准目录一致），执行：

```bash
mvn generate-sources    # Maven：自动调用 ANTLR 生成代码到 target/generated-sources/antlr/
# 或者用 Gradle
gradle generateGrammarSource
```

生成的代码会自动加入源码路径，可直接在项目中使用。

**Java 中的使用方式**

```java
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.tree.*;

public class ToyCCompiler {
    public static void main(String[] args) throws Exception {
        // 1. 从标准输入读取源代码
        CharStream input = CharStreams.fromStream(System.in);

        // 2. 词法分析：源代码 → Token 流
        ToyCLexer lexer = new ToyCLexer(input);
        CommonTokenStream tokens = new CommonTokenStream(lexer);

        // 3. 语法分析：Token 流 → ParseTree
        ToyCParser parser = new ToyCParser(tokens);
        ParseTree tree = parser.program();

        // 4. 打印语法树（调试用）
        System.out.println(tree.toStringTree(parser));

        // 5. Visitor 遍历：ParseTree → AST（自行实现）
        ASTBuilder builder = new ASTBuilder();
        ASTNode ast = builder.visit(tree);
    }
}
```

:::info
Maven/Gradle 生成的类会自动在 `target/generated-sources/antlr/` 下，不需要手动 import。
:::

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

### 2. Java 环境（Maven / Gradle）

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

### 3. OCaml 环境（Dune / Menhir）

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

### 4. C/C++ 构建工具（CMake / Make）

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

:::warning[使用生成器的前提]
若使用 Flex/Bison，实验报告中必须给出完整的 `.l` / `.y` 文件，
并额外说明如何手工构造等价的分析器；否则该实验最高按 80% 计分。
:::

ANTLR、Menhir 等生成器同样需要在报告中说明输入文法、生成命令和生成代码如何接入项目。生成器是选做工具，不改变 ToyC 文法和统一输出格式。

### 5. 汇编与运行环境（第四至第六部分需要）

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
  -nostdlib -static input.s third_party/toyc/libtoyc.a -o input
printf '42\n' | qemu-riscv64 ./input > input.out
```

若课程组提供的是 Linux 目标库，则使用课程指定的 `riscv64-unknown-linux-gnu-*` 工具链和 ABI；不要把 RV32 库与 RV64 汇编混合链接。运行时库使用课程组提供的 `libtoyc.a`，编译器需要为 `getint()` 和 `putint(int)` 生成外部调用，并在最终链接时加入该库。

### 6. QEMU 启动与标准输入

编译器本身从标准输入读取 ToyC 源代码，生成汇编到标准输出。**可执行文件统一命名为 `compiler`**。建议把 ToyC 源文件命名为 `*.c`，把运行时数据命名为 `*.in`，把汇编命名为 `*.s`，把链接后的可执行文件命名为无后缀名（如 `input`），把程序运行后的标准输出命名为 `*.out`，与助教评测脚本约定保持一致：

```bash
./compiler < input.c > input.s
```

链接后，使用 QEMU 运行 RV64 程序，并把测试数据传给被编译程序的标准输入：

```bash
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static input.s third_party/toyc/libtoyc.a -o input
printf '42\n' | qemu-riscv64 ./input > input.out
```

:::info[文件命名约定]
**`*.c` vs `*.in` vs `*.out`**：`*.c` 是 ToyC 源文件，由**编译器**读取；`*.in` 是 ToyC 程序运行时的标准输入数据（例如 `getint()` 要读取的数字），由**被编译出的可执行文件**读取；`*.out` 是 ToyC 程序运行时的标准输出结果（例如 `putint()` 写入的内容），是助教评测时实际比对的文件。三者不要混淆。
:::

QEMU 用户态模式适合运行单个 RV64 Linux/静态 ELF；如果课程环境要求完整虚拟机，再使用 `qemu-system-riscv64` 配合课程提供的内核、设备树和磁盘镜像，不能只凭一个裸 ELF 启动完整系统。

### 7. 可选优化参数

编译器本身从标准输入读取 ToyC 源代码，生成汇编到标准输出。**可执行文件统一命名为 `compiler`**。建议把 ToyC 源文件命名为 `*.c`，把运行时数据命名为 `*.in`，把汇编命名为 `*.s`，把链接后的可执行文件命名为无后缀名（如 `input`），把程序运行后的标准输出命名为 `*.out`，与助教评测脚本约定保持一致：

```bash
./compiler < input.c > input.s
```

链接后，使用 QEMU 运行 RV64 程序，并把测试数据传给被编译程序的标准输入：

```bash
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static input.s third_party/toyc/libtoyc.a -o input
printf '42\n' | qemu-riscv64 ./input > input.out
```

:::info[文件命名约定]
**`*.c` vs `*.in` vs `*.out`**：`*.c` 是 ToyC 源文件，由**编译器**读取；`*.in` 是 ToyC 程序运行时的标准输入数据（例如 `getint()` 要读取的数字），由**被编译出的可执行文件**读取；`*.out` 是 ToyC 程序运行时的标准输出结果（例如 `putint()` 写入的内容），是助教评测时实际比对的文件。三者不要混淆。
:::

QEMU 用户态模式适合运行单个 RV64 Linux/静态 ELF；如果课程环境要求完整虚拟机，再使用 `qemu-system-riscv64` 配合课程提供的内核、设备树和磁盘镜像，不能只凭一个裸 ELF 启动完整系统。

## 三、目录约定

仓库采用**单根布局**：所有实验共享同一个编译器源码和构建脚本，评测机通过调用不同命令行接口（`--dump-tokens` / `--check-ast` / `--dump-asm` 等）区分实验阶段。

```text
ToyC/
├── CMakeLists.txt           # 或 Makefile / pom.xml / build.gradle（推荐 CMake）
├── src/                     # 全部实验的源代码（含词法、语法、IR、目标代码、优化）
│   ├── lexer/
│   ├── parser/
│   ├── ir/
│   ├── codegen/
│   └── optim/
├── third_party/             # 第三方依赖与下载的参考文档
│   └── toyc/libtoyc.a       # 运行时库（课程组提供，本地调试用）
├── README.md                # 构建、运行、参数说明
└── group.csv                # 小组名单
```

要点：

- 构建脚本放在**仓库根目录**，`src/` 下按模块划分子目录，不再为每个实验单独建目录；
- 不需要在仓库中维护 `tests/` 目录，评测机自带测试集；
- 源码仓库目录名由你决定（教程中统一用 `your_compiler_name` 作为占位，如 `toyc-cpp`、`toyc-java`、`toyc-ocaml`），但**编译产物（可执行文件）必须统一命名为 `compiler`**，评测平台以这个名字调用；
- 运行时库 `libtoyc.a` 由评测平台提供，不要提交到仓库；本地调试时放在 `third_party/toyc/libtoyc.a` 即可。

## 附：参考文档下载

以下文档可在本地离线阅读，也可通过下方链接重新下载：

- [下载 QEMU 本地调试指南](pathname:///pdf/QEMU本地调试指南.pdf) — 在 QEMU 中单步调试编译器生成的 RISC-V 汇编
- [下载 SysY2022 语言定义](pathname:///pdf/SysY2022语言定义-V1.pdf) — 编译系统赛的官方语言规范（基本数据类型、语句、函数等）
- [下载 SysY2022 运行时库](pathname:///pdf/SysY2022运行时库-V1.pdf) — `getint`、`putint` 等运行时函数的接口说明
- [下载 SysY2026 扩展规范](pathname:///pdf/Sysy2026.pdf) — 张量（tensor）类型与矩阵乘法运算符 `@`

下载后放到 `third_party/docs/` 目录下便于随时查阅：

```bash
mkdir -p third_party/docs
# SITE_BASE_URL 是站点根 URL，未设置时使用本地开发服务器
# 部署到 GitHub Pages 后通常设置为 https://<username>.github.io
curl -L -o third_party/docs/QEMU本地调试指南.pdf \
    "${SITE_BASE_URL:-http://localhost:3000}/compiler-principles/pdf/QEMU本地调试指南.pdf"
curl -L -o third_party/docs/SysY2022语言定义-V1.pdf \
    "${SITE_BASE_URL:-http://localhost:3000}/compiler-principles/pdf/SysY2022语言定义-V1.pdf"
curl -L -o third_party/docs/SysY2022运行时库-V1.pdf \
    "${SITE_BASE_URL:-http://localhost:3000}/compiler-principles/pdf/SysY2022运行时库-V1.pdf"
curl -L -o third_party/docs/Sysy2026.pdf \
    "${SITE_BASE_URL:-http://localhost:3000}/compiler-principles/pdf/Sysy2026.pdf"
```

## 四、最小可运行验证

在正式动手前，请先确保下面的命令能跑通，这证明你的工具链是完整的：

```bash
# 1. 编译并运行一个最小程序
cat > hello.c <<'EOF'
int main() {
  return 0;
}
EOF

# 2. 用统一驱动处理它（实验一之后应能输出 Token 流）
#    可执行文件统一叫 compiler，仓库目录名由你自取
./compiler --dump-tokens < hello.c > hello.token
```

如果能正常输出 Token 流而程序不崩溃，环境即准备完成。

## 五、常见环境问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `flex: command not found` | 未安装或未加入 PATH | 重装并在 `~/.bashrc` 中导出 PATH |
| 生成中文乱码 | 终端编码与文件编码不一致 | 统一使用 UTF-8，避免 BOM |
| `Permission denied` 运行脚本 | 脚本没有可执行位 | `chmod +x build.sh` |
| Windows 下换行符导致解析失败 | CRLF 混入输入 | 配置 `.gitattributes` 强制 LF |
