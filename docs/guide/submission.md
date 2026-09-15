---
sidebar_position: 4
sidebar_label: 希冀提交与评测
title: 希冀提交与评测
description: 四人分组、Git 仓库可访问性、构建入口和希冀平台提交流程
---

# 希冀提交与评测

本次作业四人为一组完成，提交时只需要一名成员提交。仓库中必须包含 `group.json`，用于记录小组成员名单。评测系统会克隆指定仓库和分支，在 Linux 环境中自动构建、运行并比较输出。

## 一、仓库必须包含的内容

```text
ToyC/
├── CMakeLists.txt 或 Makefile / pom.xml / build.gradle / dune-project
├── src/                         # 编译器源代码
├── README.md                    # 构建、运行、参数说明
└── group.json                   # 必需：小组名单和提交信息
```

上表是评测所需的最小结构。`tests/`、`report.md` 和 `libtoyc.a` 不要求提交到仓库；如果课程平台另有上传入口，按助教通知提交。`README.md` 必须给出一条从干净 Linux 环境开始的构建命令，并明确可执行文件名。评测程序不能依赖 IDE、Windows 路径、绝对路径或本机缓存。

## 二、模板文件

仓库提供可直接下载的 <a href="/compiler-principles/templates/group.json" download="group.json">group.json 模板</a>。下载后复制到项目根目录：

```bash
curl -L -o group.json https://<course-site>/<base>/templates/group.json
```

也可以直接复制模板内容，替换成员姓名和学号。文件必须是合法 JSON，不要添加注释或 Markdown 代码围栏。

## 三、小组名单

在 `group.json` 中填写四名成员的姓名和学号。参考格式：

```json
{
  "members": [
    {"name": "成员 A", "student_id": "20240001"},
    {"name": "成员 B", "student_id": "20240002"},
    {"name": "成员 C", "student_id": "20240003"},
    {"name": "成员 D", "student_id": "20240004"}
  ]
}
```

模板文件中只包含成员姓名和学号字段；四名成员必须全部填写。

## 四、编译器命令行约定

编译器从标准输入读取 ToyC 源代码，把 RV64GC 汇编写到标准输出：

```bash
./mycompiler --dump-asm < test.c > test.s
```

可选优化参数：

```bash
./mycompiler --dump-asm -opt < test.c > optimized.s
```

没有 `-opt` 时保证功能正确；有 `-opt` 时可以启用基础优化，也可以忽略该参数。诊断信息写到标准错误，成功返回 0，输入错误返回非零值。

## 五、运行时静态库

`libtoyc.a` 不属于学生项目的必需提交文件。课程组提供完整的静态库下载资源：

- <a href="/compiler-principles/downloads/libtoyc.a" download="libtoyc.a">下载 ToyC RV64GC 运行时库 libtoyc.a</a>
- [运行时库接口说明](../reference/sysy-runtime.md)

下载后放到本地工作目录，例如：

```bash
mkdir -p third_party/toyc
curl -L -o third_party/toyc/libtoyc.a \
   https://<course-site>/<base>/downloads/libtoyc.a
```

链接时显式加入该文件：

```bash
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
   -nostdlib -static output.s third_party/toyc/libtoyc.a -o output.elf
```

不要把库文件复制进学生仓库，也不要自行重新编译替换评测库；以课程组发布的完整文件和校验值为准。

## 六、提交到希冀平台

以课程助教发布的希冀平台地址为准，平台通常需要以下字段：

- **仓库地址**：GitHub、Gitee 或 GitLab 的 Git clone URL，例如 `https://gitee.com/<account>/<repository>.git`；
- **分支名**：例如 `main` 或 `submission`；
- **访问令牌**：仅在仓库为私有时填写，使用只读权限令牌；
- **构建入口**：例如 `CMakeLists.txt`、`Makefile`、`pom.xml` 或 `dune-project`；
- **可执行文件或主类名**：与 `README.md` 中的命令一致。

仓库地址必须是评测服务器可以访问的 clone URL，不要提交本机路径（如 `D:\work\...`、`/home/user/...`）或网页首页 URL。提交前在一个干净目录测试：

```bash
cd "$(mktemp -d)"
git clone --branch main https://gitee.com/<account>/<repository>.git project
cd project
cmake -S . -B build
cmake --build build
```

如果评测平台无法访问私有仓库，优先将仓库设为公开，或在希冀平台的令牌字段中填写只读令牌。不要把真实令牌写进 README、脚本、提交信息或仓库 URL；令牌一旦泄露应立即撤销并重新生成。

如果平台明确要求“带认证的仓库地址”，使用平台提供的安全输入框或助教规定的占位格式，不要把真实令牌粘贴到 Markdown 或聊天记录中。

## 七、提交前检查

```bash
# 检查当前分支和远端
 git branch --show-current
 git remote -v

# 检查工作树中没有构建产物和密钥
 git status --short
 git grep -n -E 'token|ghp_|glpat-|password' -- ':!*.md'

# 确认 RV64GC 输出和标准输入
 ./your_compiler < tests/hello.c > /tmp/hello.s
riscv64-unknown-elf-gcc -march=rv64gc -mabi=lp64d \
   -nostdlib -static /tmp/hello.s libtoyc.a -o /tmp/hello.elf
qemu-riscv64 /tmp/hello.elf
```

平台提交后应记录提交时间、仓库地址、分支和提交哈希，便于出现构建问题时定位具体版本。
