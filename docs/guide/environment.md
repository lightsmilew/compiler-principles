---
sidebar_position: 1
sidebar_label: 开发环境与工具链
title: 开发环境与工具链
description: 编译器实验所需的环境准备、推荐工具与最小可运行验证
---

# 开发环境与工具链

## 一、语言与编译器

实验代码可以使用 **C / C++ / Java / Python / Rust / Go** 中任意一种语言实现，
但整个实验过程中不可更换语言。推荐使用 C++17 或 Java 17。

| 语言 | 推荐版本 | 说明 |
| --- | --- | --- |
| C / C++ | C11 / C++17 | 性能好，便于后续做寄存器分配 |
| Java | JDK 17+ | 生态完善，调试友好 |
| Python | 3.10+ | 开发快，适合验证算法，注意性能 |
| Rust / Go | 最新稳定版 | 鼓励使用，注意提交构建脚本 |

## 二、必须安装的工具

### 1. Git

用于管理代码与提交实验。请配置好用户名与邮箱：

```bash
git config --global user.name "你的姓名"
git config --global user.email "你的学号@example.edu.cn"
```

### 2. Flex 与 Bison（选做，不强制）

实验一与实验二允许使用词法/语法分析器生成器。Windows 用户推荐通过
WSL2 或 MSYS2 安装：

```bash
# Ubuntu / WSL2
sudo apt install flex bison
```

:::warning 使用生成器的前提
若使用 Flex/Bison，实验报告中必须给出完整的 `.l` / `.y` 文件，
并额外说明如何手工构造等价的分析器；否则该实验最高按 80% 计分。
:::

### 3. 汇编与运行环境（实验七需要）

实验七生成的目标代码基于 **MIPS32** 或 **x86-64** 之一，请任选其一并固定：

```bash
# MIPS：推荐使用 SPIM / QtSpim 模拟器
# x86-64：Linux 下使用 gcc + objdump，或直接生成 AT&T 语法汇编
```

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

# 3. 用你自己的编译器处理它（实验一之后应能输出 Token 流）
./mycompiler --dump-tokens hello.mc
```

如果能正常输出 Token 流而程序不崩溃，环境即准备完成。

## 五、常见环境问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `flex: command not found` | 未安装或未加入 PATH | 重装并在 `~/.bashrc` 中导出 PATH |
| 生成中文乱码 | 终端编码与文件编码不一致 | 统一使用 UTF-8，避免 BOM |
| `Permission denied` 运行脚本 | 脚本没有可执行位 | `chmod +x build.sh` |
| Windows 下换行符导致解析失败 | CRLF 混入输入 | 配置 `.gitattributes` 强制 LF |
