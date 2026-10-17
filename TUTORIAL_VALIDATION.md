# 教程核查与实测记录

## 2026-10-17：全新 WSL 环境实测

新建 `ToyC-EnvCheck-20261017` 发行版，从 Ubuntu 24.04 官方基础镜像开始测试，系统版本为 24.04.5、架构为 x86_64。使用新建普通用户，按 `docs/guide/environment.md` 的命令安装，未使用原 WSL 用户的工具或依赖缓存。原有 `Ubuntu` 发行版保留。

| 验证项目 | 实际结果 |
| --- | --- |
| 基础工具与 C++ | apt 安装成功，CMake 编译并运行 C++17 示例 |
| Java | JDK 21 编译、运行成功，Maven 3.9.11 与 Gradle 8.5 均使用 Java 21 |
| Gradle | 环境检查项目离线构建、运行成功 |
| Rust | 官方源和 RsProxy 分别在两个新用户下安装 Rust / Cargo 1.85.0，均成功构建并运行示例 |
| RISC-V 与 QEMU | 两套交叉工具链安装成功，独立汇编运行输出 `RV64GC OK` |
| ToyC 运行时库 | 使用仓库提供的 `libtoyc.a` 链接，QEMU 运行输出 `ToyC runtime OK: 42` |
| ANTLR 本地环境 | 4.13.1 生成器和 C++ 静态运行库安装成功，Java、C++ 示例均输出 `(start 7 + 5 <EOF>)` |
| Flex / Bison 与 CMake | 使用生成器构建页的配置生成、编译、链接并运行最小文法程序 |
| ANTLR 与 CMake | 将运行库安装到构建页指定的 `/usr/local`，按文档配置构建并运行成功 |
| ANTLR 与 Gradle | 使用本机完整 JAR，离线执行 `clean build installDist`，通过 `compiler` 启动脚本运行成功 |
| ANTLR 与 Maven | 新依赖缓存下执行 `mvn -B package`，生成、编译并通过 `compiler` 脚本运行成功 |
| 新终端 | 新开 Bash 终端能找到 Maven、Gradle、ANTLR、Rust 和 Cargo |

安装和构建命令未发现错误。修正了 Java 分支的联网说明，并将正式项目配置统一链接到生成器构建页。集成验证使用最小文法与入口程序，只验证构建配置。

Windows 安装块通过 PowerShell 语法检查，并确认在线列表中存在 `Ubuntu-24.04`；没有重新安装 Windows 的 WSL 组件。ARM64 分支未执行。Gradle 官方包已实际下载、解压并使用，腾讯备用下载地址只检查了 HTTP 响应。日志和验证程序保存在 `.cache/wsl-env-check/`。

## 2026-10-13：此前核查

核查日期：2026-10-13（Asia/Shanghai）。覆盖 docs 下 36 篇教程、README、运行时说明，以及站点配置、CI、Dockerfile 和下载附件。本记录区分实际执行、工具语法检查、资料核对与尚未端到端执行的范围，不把代码片段或伪代码算作已运行程序。

## 当前结果

| 验证项目 | 方法与结果 |
| --- | --- |
| TypeScript / MDX / 静态站点 | npm run typecheck、npm run build 通过；修复裸露小于号引起的 MDX 编译错误与表格内逻辑或/按位或的未转义错列 |
| 内部页面、锚点及资源 | 40 个构建页面，513 个唯一目标，0 个失效；检查构建 HTML 的实际 href/src 与目标文件及 id |
| 外部目标 | 82 个实际 URL 可访问，0 个未确认；保存状态、重定向目标与重试次数；不发送凭据或示例占位 URL |
| 代码块清单 | 461 个全部登记；86 个 Bash 块通过 bash -n，28 个具体汇编块通过 GNU as，12 个完整 LLVM 模块通过 llvm-as |
| PowerShell | 2 个安装/启动块由 PowerShell AST 解析器验证；Ubuntu-24.04 已在当前 WSL 在线发行版列表中确认 |
| ToyC 样例 | 独立词法/语法检查；错误样例按预期 reject；完整 208 个 Token 与文档一致 |
| 综合程序汇编 | 文档手写汇编与独立 GCC 编译的源程序在 QEMU 中 stdout 与退出码一致：161514131211109876432，退出码 1 |
| 完整 LLVM 示例 | 11 个标量模块共 425 组输入，数组模块另测 6 组；真实 lowering、交叉链接与 QEMU 执行均通过，含 mem2reg 与内联前后示例 |
| 魔数除法 | 从文档读取 6 组参数；120048 组无符号商/余数检查，实际有符号除 10 汇编执行 10012 组，通过；抽样之外补充公式推导 |
| MLIR | 3 个完整示例由 MLIR 18 解析、验证并执行 Affine/SCF 到 CF 的 lowering，通过 |
| ToyC 静态库 | 导出符号、LP64D、无构造/析构输出、整数边界、EOF、缓冲补充及 stderr 检查通过 |
| qemu-user 调试 | 发布的 GDB 指令实际连接目标，命中 main、单步、正常退出，输出 42；测试使用空闲端口 |
| qemu-system | 实际下载 Ubuntu 24.04 RISC-V cloud image，确认 qcow2、转换 raw、制作 NoCloud 数据盘；完整启动、SSH 登录、scp 和程序执行通过，输出 42、退出码 0 |
| ANTLR | 4.13.1 Java 与 C++ 示例真实生成、编译、链接及运行，均输出 (start 7 + 5 <EOF>)；采用隔离目录与 JDK 21 |
| 调试 PDF | 与在线 Markdown 共用源码，重新生成 4 页 PDF；逐页渲染检查，完整命令块不跨页切断 |

126 个语法检查通过的块不等于 126 个完整程序。其余 330 个块是格式输出、数据结构、伪代码或其它教学片段；另有 5 个带编号、占位符或省略号的汇编片段，已单独登记。LLVM 示例缺少 I/O 声明时，检查夹具补入声明并在记录中注明；不会改变示例函数体。

## 修复内容与依据

| 范围 | 核查及修复 |
| --- | --- |
| 语言、词法与语法 | 用户确认的规则统一到共享文法；普通局部声明允许省略初值，局部 const 保留且要求初始化；单变量声明、无全局声明、无前向调用、一元负号、同层关系/相等运算；综合样例与 Token 同步 |
| 语义与作用域 | 参数和函数外层共用作用域；声明分支、函数/变量种类、void 使用、赋值约束、参数数量和返回类型检查；结构化返回检查明确其保守限制 |
| IR 生成 | 入口 alloca、声明位置初始化、终结块不再追加 br；通用整数条件与逻辑非；逻辑表达式在值上下文中的短路合并 |
| 代码生成与 ABI | 32 位 W 指令、有效栈偏移、caller/callee 保存、并行参数搬运、调用结果捕获顺序、8 字节栈参数槽、大栈帧立即数范围；phi 按边并行复制 |
| 优化 | CSE 的支配关系与作用域表；mem2reg 的入口/不可达处理；DCE 的终止和副作用条件；CFG 与 phi 更新；多返回点内联；图着色保留原图、更新当前度数、乐观候选与统一 spill 重写；布局保持入口及所有控制流边 |
| 性能表述 | 删除无目标处理器依据的固定周期、固定性能百分比与自动收益结论；计时与指令数区分，额外归纳更新与溢出标志明确 |
| 竞赛和评分 | 依据官方 2026 页面核对赛制；日期注明年份，语言扩展与课程区别明确；删除无评测配置支持的固定样例数量、分值与奖项断言 |
| 安装、链接与运行 | 每个命令块标注终端；分开宿主机、QEMU 用户态与虚拟机；修复无效 CPU 型号、直接执行异构 ELF、磁盘格式、NoCloud 文件名及 GDB 启动顺序 |
| Docker / 站点工程 | Ubuntu 24.04 软件源布局、RV64 工具链、ANTLR 版本一致、Maven 官方归档地址、Python venv；删除无效 CI 环境变量说明，严格内部链接与锚点检查 |

主要技术依据：[LLVM LangRef](https://llvm.org/docs/LangRef.html)、[LLVM EarlyCSE](https://llvm.org/docs/Passes.html#early-cse-early-common-subexpression-elimination)、[RISC-V psABI](https://riscv-non-isa.github.io/riscv-elf-psabi-doc/)、[RISC-V M 扩展](https://docs.riscv.org/reference/isa/v20240411/unpriv/m-st-ext.html)、[MLIR Affine](https://mlir.llvm.org/docs/Dialects/Affine/)、[SCF](https://mlir.llvm.org/docs/Dialects/SCFDialect/)、[CF](https://mlir.llvm.org/docs/Dialects/ControlFlowDialect/)、[George/Appel 原论文](https://www.cs.tufts.edu/comp/150FP/archive/andrew-appel/iterated.pdf)、[QEMU 调试](https://www.qemu.org/docs/master/system/gdb.html)、[cloud-init NoCloud](https://cloudinit.readthedocs.io/en/latest/reference/datasources/nocloud.html)、[ANTLR C++ 配置](https://github.com/antlr/antlr4/blob/4.13.1/runtime/Cpp/cmake/Antlr4Package.md)、[2026 官方赛事页面](https://course.educg.net/pages/contest/contest.jsp?contestCID=0&contestID=Zd6BcaiCWJ4&doVisit=true&my=false)。

## 复现

站点构建在仓库根目录执行。Linux / WSL 验证需要 bash、LLVM 18、MLIR 18 tools、两套 riscv64 GCC/binutils、qemu-user 和 gdb-multiarch。CI 已加入代码块、ToyC、LLVM/MLIR、QEMU 调试及运行时检查；外部 URL 检查保留为显式命令，避免网络波动误报。

```bash
# 执行位置：WSL / Ubuntu 开发主机终端（本仓库根目录）
npm run typecheck
npm run build
python3 scripts/verify_tutorial.py --external
python3 scripts/verify_toyc_examples.py
python3 scripts/verify_codegen_examples.py
python3 scripts/verify_qemu_debugging.py
python3 runtime/test_runtime.py
```

PDF 源码为 docs/guide/qemu-debugging.md，生成器为 scripts/build_qemu_guide_pdf.py；需要 reportlab、pypdf 和可嵌入的中文 TrueType 字体。修改后应重新生成并逐页渲染检查。

本次详细日志在 .cache/tutorial-audit：blocks.json、snippets.json、internal-links.json、external-links.json、toyc-examples.json、codegen-execution.json、gdb.json/gdb.log、antlr.json、versions.json、vm/result.json 与 vm/boot.log。缓存不上传为站点内容。

## 验证范围的边界

- 本仓库是教程站点，没有学生的 ./compiler 实现或实际平台评测脚本；教学接口、构建约定与伪代码经过核对，但不能宣称已端到端通过希冀评测。平台专属的提交格式、时间及开关仍需相应课程配置支持。
- Dockerfile 的已发现错误已修复，下载来源与关键工具流程已检查；当前机器没有 Docker 引擎，整镜像 docker build 未执行。Maven/Gradle/Rust 的整套安装及项目构建、ARM64 开发主机分支、重新安装 WSL 也未在本次实测；不把可达下载链接或 Bash 语法检查说成安装通过。
- 原竞赛 PDF 与报告 DOC 保留原附件，已检查可读性、接口说明及教程引用；不替原作者修订规范，也不把旧附件视为未来赛事或当前学校政策的证明。
- 伪代码的算法条件与反例经过复核；它们含自定义接口，不是完整可编译的学生实现。随机算术检查不能替代全范围数学证明，外链可达结果也有日期限制。
