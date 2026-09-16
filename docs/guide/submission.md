---
sidebar_position: 4
sidebar_label: 希冀提交与评测
title: 希冀提交与评测
description: 最多四人组队、Git 仓库可访问性、构建入口和希冀平台提交流程
---

# 希冀提交与评测

本次作业最多 4 人为一组完成，提交时只需要一名成员提交。仓库中必须包含 `group.csv`，用于记录小组成员名单。评测系统会克隆指定仓库和分支，在 Linux 环境中自动构建、运行并比较输出。

## 一、仓库必须包含的内容

```text
ToyC/
├── CMakeLists.txt 或 Makefile / pom.xml / build.gradle / dune-project
├── src/                         # 编译器源代码
├── README.md                    # 编译器架构、算法实现思路说明
└── group.csv                    # 必需：小组名单和提交信息
```

上表是评测所需的最小结构。每个实验只需提交源代码（`src/` 或对应语言源码）和小组名单 `group.csv`；`tests/`、`实验报告` 和 `libtoyc.a` 不要求提交到仓库，libtoyc.a 由评测平台统一提供。如果课程平台另有上传入口，按助教通知提交。评测程序不能依赖 IDE、Windows 路径、绝对路径或本机缓存。

## 二、模板文件

仓库提供可直接下载的 [group.csv 模板](pathname:///templates/group.csv)。下载后复制到项目根目录：

```bash
curl -L -o group.csv "${SITE_BASE_URL:-http://localhost:3000}/compiler-principles/templates/group.csv"
```

`SITE_BASE_URL` 是站点根 URL，部署到 GitHub Pages 后通常为 `https://<username>.github.io`。

也可以直接复制模板内容，替换成员姓名和学号。文件必须是合法 CSV（UTF-8 编码、首行为表头），不要添加 Markdown 代码围栏。

## 三、小组名单

在 `group.csv` 中填写四名成员的姓名和学号。参考格式：

```csv
序号,姓名,学号
1,成员 A,20240001
2,成员 B,20240002
3,成员 C,20240003
4,成员 D,20240004
```

模板文件中只包含序号、姓名和学号字段；序号、姓名和学号必须全部填写，不要漏列或多列。

## 四、编译器命令行约定

编译器从标准输入读取 ToyC 源代码，把 RV64GC 汇编写到标准输出。完整的命令行接口与各开关的含义见 [统一驱动接口](../labs/capstone#五统一驱动接口)。

最常用的两种调用：

```bash
./compiler --dump-asm < input.c > input.s          # 基线汇编
./compiler --dump-asm -opt < input.c > input.opt.s # 含基础优化
```

> **测试文件命名约定**：助教评测时按以下格式提供测试文件与输出文件，学生自测时也建议遵循同样命名，便于和助教脚本对账：
>
> | 阶段 | 编译器输入 | 程序运行时输入 | 链接产物 | 程序输出 |
> |---|---|---|---|---|
> | 第一部分（词法） | `*.c` | — | — | `*.token` |
> | 第二部分（语法） | `*.c` | — | — | `*.check-ast` |
> | 第三部分（IR） | `*.c` | — | — | `*.ll` / `*.opt.ll` |
> | 第四部分（汇编） | `*.c` | `*.in` | `input`（无后缀 ELF） | `*.out` |
>
> **完整流程**：你的 `./compiler` 读 `*.c` → 输出汇编 `*.s` → `riscv64-unknown-elf-gcc` 链接 `*.s` 与 `libtoyc.a` → 生成可执行文件（无后缀，如 `input`）→ 运行可执行文件，把 stdout 重定向到 `*.out`，这是助教评测脚本实际比对的文件。
>
> `*.c` 是 ToyC 源文件，`*.in` 是 ToyC 程序运行时的标准输入数据（例如 `getint()` 读取的内容），`*.out` 是 ToyC 程序的标准输出结果（例如 `putint()` 写入的内容）。三者不要混淆。

没有 `-opt` 时保证功能正确；有 `-opt` 时可以启用基础优化，也可以忽略该参数。诊断信息写到标准错误，成功返回 0，输入错误返回非零值。

本课程的参考文档（SysY 语言规范、QEMU 调试指南等）可在 [开发环境与工具链](../guide/environment#附参考文档下载) 页面下载。

## 五、运行时静态库

`libtoyc.a` 由希冀评测平台统一提供，学生无需上传到仓库。课程组也提供本地下载链接供本地调试使用：

- [下载 ToyC RV64GC 运行时库 libtoyc.a](pathname:///downloads/libtoyc.a)
- [运行时库接口说明](../reference/sysy-runtime)

下载后放到本地工作目录，例如：

```bash
mkdir -p third_party/toyc
curl -L -o third_party/toyc/libtoyc.a "${SITE_BASE_URL:-http://localhost:3000}/compiler-principles/downloads/libtoyc.a"
```

链接时显式加入该文件：

```bash
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
   -nostdlib -static input.s third_party/toyc/libtoyc.a -o input
./input < runtime.in > input.out
```

不要把库文件复制进学生仓库，也不要自行重新编译替换评测库；以课程组发布的完整文件和校验值为准。

## 六、提交到希冀平台

以课程助教发布的希冀平台地址为准，平台通常需要以下字段：

- **仓库地址**：GitHub、Gitee 或 GitLab 的 Git clone URL，例如 `https://gitee.com/<account>/<repository>.git`；
- **分支名**：例如 `main` 或 `submission`；
- **访问令牌**：仅在仓库为私有时填写，使用只读权限令牌；


仓库地址必须是评测服务器可以访问的 clone URL，不要提交本机路径（如 `D:\work\...`、`/home/user/...`）或网页首页 URL。提交前在一个干净目录测试：

```bash
cd "$(mktemp -d)"
git clone --branch main https://gitee.com/<account>/<repository>.git project
cd project
cmake -S . -B build
cmake --build build
```

如果评测平台无法访问私有仓库，优先将仓库设为公开，或在希冀平台的令牌字段中填写只读令牌。不要把真实令牌写进 README、脚本、提交信息或仓库 URL；令牌一旦泄露应立即撤销并重新生成。

如果平台明确要求"带认证的仓库地址"，使用平台提供的安全输入框或助教规定的占位格式，不要把真实令牌粘贴到 Markdown 或聊天记录中。

## 七、提交前检查

```bash
# 检查当前分支和远端
git branch --show-current
git remote -v

# 检查工作树中没有构建产物和密钥
git status --short
git grep -n -E 'token|ghp_|glpat-|password' -- ':!*.md'

# 确认 RV64GC 输出和标准输入
./compiler < input.c > /tmp/input.s
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
  -nostdlib -static /tmp/input.s third_party/toyc/libtoyc.a -o /tmp/input
/tmp/input < /tmp/runtime.in > /tmp/input.out   # input.out 是 ToyC 程序 stdout
```

平台提交后应记录提交时间、仓库地址、分支和提交哈希，便于出现构建问题时定位具体版本。
