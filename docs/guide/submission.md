---
sidebar_position: 4
sidebar_label: 希冀提交与评测
title: 希冀提交与评测
description: Git 仓库可访问性、构建入口和希冀平台提交流程
---

# 希冀提交与评测

本课程允许最多 4 人为一组完成整个编译器实现，提交时只需要一名成员提交。分组信息由助教在群聊文档收集，建议分组时选出组长。

## 一、仓库必须包含的内容

编译器项目需要上传到 GitHub、Gitee 或 GitLab 等 Git 托管平台。提交评测时，希冀平台将从指定仓库拉取代码；仓库地址、访问令牌与分支名的填写格式见[提交到希冀平台](#六提交到希冀平台)。

```text
toyc-cpp/                        # 仓库目录名由你决定，此处以 toyc-cpp 为例
├── CMakeLists.txt 或 Makefile / pom.xml / build.gradle / Cargo.toml
├── src/                         # 编译器源代码
└── README.md                    # 简要说明编译器架构
```

评测系统会克隆指定仓库和分支，在 Linux 环境中自动构建、运行并比较输出。每个实验只需提交源代码（`src/` 或对应语言源码）；`tests/`、`实验报告` 和 `libtoyc.a` 不要求提交到仓库，libtoyc.a 由评测平台统一提供。评测程序不能依赖 IDE、Windows 路径、绝对路径或本机缓存。

## 二、编译器命令行约定

编译器从标准输入读取 ToyC 源代码，把 RV64GC 汇编写到标准输出。完整的命令行接口与各开关的含义见 [统一驱动接口](../labs/capstone#六统一驱动接口)。

最常用的两种调用：

```bash
./compiler -asm < input.c > input.s          # 基线汇编
./compiler -asm -opt < input.c > input.opt.s # 含基础优化
```

:::info[测试文件命名约定]
助教评测时按以下格式提供测试文件与输出文件，学生自测时也建议遵循同样命名，便于和助教脚本对比：

| 阶段 | 编译器输入 | 程序运行时输入 | 链接产物 | 程序输出 |
|---|---|---|---|---|
| 第一部分（词法） | `*.c` | — | — | `*.token` |
| 第二部分（语法） | `*.c` | — | — | `*.check-ast` |
| 第三部分（IR） | `*.c` | — | — | `*.ll` / `*.opt.ll` |
| 第四部分（汇编） | `*.c` | `*.in` | `input`（无后缀 ELF） | `*.out` |

**完整流程**：你的 `./compiler` 读 `*.c` → 输出汇编 `*.s` → `riscv64-unknown-elf-gcc` 链接 `*.s` 与 `libtoyc.a` → 生成可执行文件（无后缀，如 `input`）→ 运行可执行文件，把 stdout 重定向到 `*.out`，这是助教评测脚本实际比对的文件。

`*.c` 是 ToyC 源文件，`*.in` 是 ToyC 程序运行时的标准输入数据（例如 `getint()` 读取的内容），`*.out` 是 ToyC 程序的标准输出结果（例如 `putint()` 写入的内容）。三者不要混淆。
:::

没有 `-opt` 时保证功能正确；评测性能样例时平台会传入 `-opt`，此时应启动已实现的优化，或静默接受并忽略该参数。无论哪种情况，都不能向标准输出写入额外提示。诊断信息写到标准错误，成功返回 0，输入错误返回非零值。

本课程的报告规范、运行时库和参考文档可在[资源下载](../reference/downloads)页面集中下载。

## 五、运行时静态库

`libtoyc.a` 由希冀评测平台统一提供，学生无需上传到仓库。课程组也提供本地下载链接供本地调试使用：

- [下载 ToyC RV64GC 运行时库 libtoyc.a](pathname:///downloads/libtoyc.a)
- [运行时库接口说明](../reference/toyc-runtime)

下载后放到本地工作目录，例如：

```bash
mkdir -p third_party/toyc
curl -L -o third_party/toyc/libtoyc.a "${SITE_BASE_URL:-http://localhost:3000}/compiler-principles/downloads/libtoyc.a"
```

链接时显式加入该文件：

```bash
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
   -nostdlib -static input.s third_party/toyc/libtoyc.a -o input
./input < input.in > result.out
```

不要把库文件复制进学生仓库，也不要自行重新编译替换评测库。

## 六、提交到希冀平台

在课程助教发布的希冀平台入口提交评测时，需要提供以下信息：

- **仓库地址**：GitHub、Gitee 或 GitLab 的 HTTPS Git clone URL，例如 `https://github.com/myuser/myproj.git`；
- **访问令牌**：用于授权评测平台拉取仓库代码，需要具备该仓库的读取权限；
- **分支名（可选）**：例如 `main` 或 `mybranchname`，填写时必须与远程仓库中的分支名称一致。

希冀提交内容应包含访问令牌，按以下格式将用户名和令牌加入 HTTPS 仓库地址；如需指定分支，在地址后加一个空格和分支名：

```text
https://myuser:ghp_xxxxxx@github.com/myuser/myproj.git mybranchname
```

其中 `myuser` 为账号名，`ghp_xxxxxx` 为示例令牌占位符，`myproj` 为仓库名，`mybranchname` 为可选分支名。提交时应替换为自己的仓库信息和有效令牌；Gitee、GitLab 仓库按同样结构填写对应的主机名、仓库路径和令牌。不指定分支时，省略地址后的分支名：

```text
https://myuser:ghp_xxxxxx@github.com/myuser/myproj.git
```

访问令牌的获取方法详见：

- [GitHub 访问令牌获取方法](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [Gitee 访问令牌获取方法](https://blog.csdn.net/weixin_42098295/article/details/134982972)
- [GitLab 访问令牌获取方法](https://docs.gitlab.com/user/profile/personal_access_tokens/)

仓库地址必须是评测服务器可以访问的 clone URL，不要提交本机路径（如 `D:\work\...`、`/home/user/...`）或仓库的网页地址。带令牌的 URL 仅填写在希冀提交入口，不要写入 README、脚本、提交信息或公开文档；令牌权限以拉取代码所需的最小权限为限。

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
/tmp/input < /tmp/input.in > /tmp/result.out   # result.out 是 ToyC 程序 stdout，与 input.out 对比
```

平台提交后应记录提交时间、仓库地址、分支，便于出现构建问题时定位具体版本。
