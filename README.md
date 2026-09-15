# 编译原理实验 · 文档站

> 以 **ToyC 编译器**为主线的编译原理实验文档站。
> 站点由 [Docusaurus](https://docusaurus.io/)（React）构建，所有内容都来自仓库内的 Markdown 文件，
> 自动部署到 GitHub Pages。
>
> - 线上地址：<https://lightsmilew.github.io/compiler-principles/>
> - 内容源：`docs/` 目录（**网页即 md，不存在第二份需要同步的内容**）

## 这是什么

这门课要求每位同学从零写一个能把 `ToyC` 源码翻译成 RISC-V64GC 汇编的编译器，
分 **六个递进实验** + 一个 **综合课程设计** 完成。本仓库不是编译器本身，
而是这门课配套的**实验文档站**——讲解每个阶段的考点、实现思路、参考代码与提交流程，
对应站点上的每一个页面都有一份仓库内的 Markdown 源文件。

视觉上采用 **珞珈绿（武大绿）** 主题，整体风格走 **Corporate Clean（企业简洁风）**：
统一圆角与轻量阴影、悬停上浮与按下缩放反馈、克制的过渡时长（≤ 200ms）、
对暗色模式与 `prefers-reduced-motion` 友好。整套风格 token 都集中在
`src/css/custom.css` 顶部的 CSS 变量里，组件与文档页共用同一套变量。

## 目录结构

```text
CompilerSystemPractice/
├── docs/                      # ★ 全部实验文档（Markdown，网站内容源）
│   ├── guide/                 # 实验指南：环境、流程、报告规范、提交
│   ├── labs/                  # 七个实验部分 + 综合课程设计
│   │   ├── capstone.md        # 课程总览（最先阅读）
│   │   ├── part1-lexer.md     # 第一部分：词法分析
│   │   ├── part2-parser.md    # 第二部分：语法分析
│   │   ├── optional-semantic.md
│   │   ├── part3-ir.md        # 第三部分：LLVM IR 生成
│   │   ├── part4-codegen.md   # 第四部分：目标代码生成（RISC-V64GC）
│   │   ├── part5-ir-optimization.md
│   │   ├── part6-target-optimization.md
│   │   └── part7-competition.md
│   ├── optim/                 # 中端 + 后端优化专题（CFG / DCE / CSE / LICM / …）
│   └── reference/             # 公共文法、LLVM IR/SysY 运行时、FAQ
├── src/
│   ├── components/            # 首页 React 组件（实验网格等）
│   ├── css/custom.css         # 珞珈绿主题（Infima 变量覆盖）
│   └── pages/index.tsx        # 首页
├── static/                    # 静态资源（logo、favicon、参考 PDF）
├── .github/workflows/         # 部署与 CI 工作流（deploy.yml）
├── docusaurus.config.ts       # 站点配置（标题、baseUrl、Mermaid 主题、页脚）
└── sidebars.ts                # 侧边栏（按 docs/ 目录与 sidebar_position 自动生成）
```

## 🚀 5 分钟本地跑起来

按下面四步就能在 `http://localhost:3000` 看到文档站。**默认进入就能看到站点**，
不需要任何环境变量，不需要登录任何账号。

### 步骤 0 — 准备环境

| 工具 | 推荐版本 | 检查命令 |
| --- | --- | --- |
| Node.js | ≥ 18.0（推荐 20 LTS） | `node -v` |
| npm | ≥ 9（Node 自带） | `npm -v` |
| Git | 任意近期版本 | `git --version` |

如果 Node 还没装，到 <https://nodejs.org/zh-cn> 下载 LTS 版本即可。

### 步骤 1 — 克隆仓库

```bash
git clone https://github.com/lightsmilew/compiler-principles.git
cd compiler-principles
```

> 如果你 fork 过，把上面链接里的 `lightsmilew` 换成你自己的用户名。

### 步骤 2 — 安装依赖

```bash
npm install
```

> 这会从 npm 拉取 Docusaurus 及其插件（React、Mermaid、Prism 等）。
> 首次安装大约需要 1–3 分钟；如果卡住可以临时换镜像：
> `npm config set registry https://registry.npmmirror.com`

### 步骤 3 — 启动开发服务器

```bash
npm start
```

几秒后会自动打开浏览器，访问 `http://localhost:3000/compiler-principles/`。
打开的瞬间就能看到完整的文档站，所有 Markdown 修改都会**热更新**——改一个字保存，
浏览器自动刷新。

### 步骤 4 — 常用命令速查

```bash
npm start              # 本地开发（热更新，http://localhost:3000）
npm run build          # 构建静态站点到 build/
npm run serve          # 本地预览构建结果（默认 http://localhost:3000）
npm run typecheck      # TypeScript 类型检查
npm run clear          # 清缓存（遇到奇怪问题时再跑）
```

## ✍️ 新增一篇实验文档

侧边栏和导航**完全由 `docs/` 目录 + Markdown 文件头自动生成**，
新增文档不需要改任何配置文件：

1. **放进对应子目录**：
   - 实验 → `docs/labs/`
   - 优化专题 → `docs/optim/`
   - 实验指南 → `docs/guide/`
   - 参考资料 → `docs/reference/`

2. **写好文件头元信息**（`sidebar_position` 决定排序）：

   ```markdown
   ---
   sidebar_position: 9
   sidebar_label: 第七部分 · XXX
   title: 第七部分 · XXX
   description: 一句话摘要，会进入页面 meta 标签
   ---
   ```

3. **保存即可**。侧边栏会自动出现该条目，并按 `sidebar_position` 排序。

支持的增强语法：

- **Mermaid 图表**（语法树、DFA、流程图）：` ```mermaid `
- **Docusaurus 提示框**：`:::tip` / `:::info` / `:::warning` / `:::danger`
- **代码高亮 + 行号** + **行内 `code`**（Prism 主题）
- **数学公式**：`$inline$` 与 `$$block$$`（由默认 remark/math + rehype/katex 提供）

### 文档内部链接怎么写

站内链接用**相对路径 + 文档 id（不带 `.md` 后缀）**。Docusaurus v3+ 不再解析 `.md` 后缀：

```markdown
同目录：[下一节](./next-section)
跨目录：[综合课程设计](../labs/capstone)
带锚点：[环境配置](../guide/environment#附参考文档下载)
```

> ⚠️ 写了 `.md` 后缀（比如 `xxx.md`）Docusaurus 会把它当外部链接，
> 构建时输出 `Markdown link ... couldn't be resolved` 警告并计入 broken links。

## 🚢 部署到 GitHub Pages

### 首次部署

1. 把代码 push 到 GitHub（建议推到 `main` 分支）。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 等待第一次 CI 跑完（约 1–2 分钟），站点就会出现在
   <https://lightsmilew.github.io/compiler-principles/>。

`.github/workflows/deploy.yml` 已经写好：每次推到 `main` 就自动执行
`npm ci → npm run build → 上传 build/ → GitHub Pages 发布`。

### 改仓库名 / 用户名

如果你的仓库不是 `lightsmilew/compiler-principles`，需要同步改两处 `docusaurus.config.ts`：

```ts
const organizationName = '你的GitHub用户名';
const projectName       = '你的仓库名';

const url      = `https://${organizationName}.github.io`;
const baseUrl  = `/${projectName}/`;
```

### CI 安全网

CI 会跑 `npm run build`，并启用 `onBrokenLinks: 'throw'`——**任何失效链接都会让构建失败**，
这样能在合并 PR 之前就把坏链接拦住。如果想让警告不阻塞构建，
可以在 `docusaurus.config.ts` 里把这一行改成 `onBrokenLinks: 'warn'`。

## 🎨 视觉风格（Corporate Clean · 珞珈绿）

| 维度 | 设定 |
| --- | --- |
| 主色 | 珞珈绿（`#0e4834` 武大绿） |
| 辅色 | 珞樱粉、东湖蓝、秋桂黄、春藤紫、黉瓦绿、霜叶红、晨雾灰（用于 Mermaid 多色场景） |
| 圆角 | 全局 `rounded-lg` / `rounded-xl` |
| 阴影 | `shadow-sm` 克制层次，hover 时升到 `shadow-md` |
| 交互 | 悬停 `translateY(-2px)`、按下 `scale(0.98)`，过渡 ≤ 200ms |
| 无障碍 | 满足 WCAG 2.1 AA，`focus-visible` 焦点环带偏移量 |
| 响应式 | 768 / 1100 / 480 三个断点；窄屏单列、宽屏网格 |

风格 token 集中在 `src/css/custom.css` 顶部（`--cc-*`），
通过覆盖 Infima 的 `--ifm-*` 变量驱动全站主题。
需要换主色，只需要改 `--cc-accent` 与 `--ifm-color-primary*` 这两段，
整站（按钮、链接、侧边栏激活态、首页 Hero、Mermaid 主题）会一起切换。

## ❓ 常见问题

<details>
<summary><strong>Q：npm install 报网络错误怎么办？</strong></summary>

A：可以临时切换到国内镜像：

```bash
npm config set registry https://registry.npmmirror.com
npm install
```

或者直接用 `cnpm` / `pnpm` / `yarn` 任一包管理器都可以。
</details>

<details>
<summary><strong>Q：npm start 启动后页面空白或 404？</strong></summary>

A：站点 baseUrl 是 `/compiler-principles/`，所以本地访问的是
<http://localhost:3000/compiler-principles/>，**而不是** <http://localhost:3000/>。
直接点终端里显示的那个链接就好。
</details>

<details>
<summary><strong>Q：构建报 <code>Markdown link ... couldn't be resolved</code>？</strong></summary>

A：站内链接不要带 `.md` 后缀。把 `[X](../foo/bar.md)` 改成 `[X](../foo/bar)` 即可。
</details>

<details>
<summary><strong>Q：改了 Markdown 但浏览器没刷新？</strong></summary>

A：先确认 dev server 还在跑（终端里没退出）。如果还不行，
跑 `npm run clear` 清缓存后重新 `npm start`。
</details>

<details>
<summary><strong>Q：怎么关闭某个页面的"编辑此页"链接？</strong></summary>

A：移除 Markdown 文件头里的 `slug` / 或者在 `docusaurus.config.ts` 中删掉 `editUrl`。
</details>

## 🤝 参与贡献

欢迎提交 Issue 与 Pull Request 来补充 / 修正实验文档。
建议流程：

1. Fork 本仓库，从 `main` 切新分支。
2. 在 `docs/` 对应目录下新增或修改 Markdown。
3. 本地跑 `npm run build` 确认构建通过、无 broken link 警告。
4. Push 分支并开 PR，CI 会自动构建预览。

## 📜 许可

课程文档采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 共享。
如需用于商业用途，请联系作者获取授权。

---

<p align="center">
  Built with ❤️ using <a href="https://docusaurus.io/">Docusaurus</a> · 珞珈绿主题 · 王仕杰、吴润康
</p>
