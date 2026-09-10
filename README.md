# 编译原理实验 · 文档站

以 **MiniC 编译器**为主线的编译原理实验文档站。站点由 [Docusaurus](https://docusaurus.io/)（React）构建，
所有内容都来自仓库内的 Markdown 文件，并自动部署到 GitHub Pages。

- 线上地址：`https://<your-github-username>.github.io/CompilerSystemPractice/`
- 内容源：`docs/` 目录（**网页即 md，不存在第二份需要同步的内容**）

## 快速开始

```bash
npm install      # 安装依赖
npm start        # 本地开发，默认 http://localhost:3000
npm run build    # 构建静态站点到 build/
npm run serve    # 本地预览构建结果
npm run typecheck # TypeScript 类型检查
```

## 目录结构

```text
CompilerSystemPractice/
├── docs/                      # ★ 全部实验文档（Markdown，网站内容源）
│   ├── intro.md               # 课程总览
│   ├── guide/                 # 实验指南：环境、流程、报告规范
│   ├── labs/                  # 七个实验 + 综合课程设计
│   └── reference/             # 公共文法约定、常见问题
├── src/
│   ├── components/            # 首页 React 组件（特性卡片、实验网格）
│   ├── css/custom.css         # Corporate Clean 主题（Infima 变量覆盖）
│   └── pages/index.tsx        # 首页
├── static/                    # 静态资源（logo、favicon）
├── .github/workflows/         # 部署与 CI 工作流
├── docusaurus.config.ts       # 站点配置（标题、baseUrl、Mermaid、页脚）
└── sidebars.ts                # 侧边栏（按 docs/ 目录自动生成）
```

## 新增一篇实验文档

1. 在 `docs/labs/` 下新建 `lab8-xxx.md`；
2. 在文件头部写明元信息（`sidebar_position` 决定排序）：

   ```markdown
   ---
   sidebar_position: 9
   sidebar_label: 实验八 · XXX
   title: 实验八 · XXX
   description: 一句话摘要，会进入页面 meta 标签
   ---
   ```

3. 保存后侧边栏自动出现该条目，**无需修改任何配置文件**。

支持的增强语法：Mermaid 图表（` ```mermaid `）、Docusaurus 提示框（`:::tip` / `:::warning` / `:::danger`）、
代码高亮与行内 `code`。

## 部署到 GitHub Pages

首次部署前，把 `docusaurus.config.ts` 中的兜底仓库信息改成你自己的：

```ts
const organizationName = process.env.GITHUB_REPOSITORY_OWNER ?? 'your-github-username';
const projectName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'CompilerSystemPractice';
```

在 GitHub 仓库的 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**，
之后每次推送到 `main` 分支都会自动构建并部署（见 `.github/workflows/deploy.yml`）。

> CI 工作流会执行类型检查与构建。由于 `onBrokenLinks: 'throw'`，
> 文档中出现失效链接时构建会直接失败，从而在合并前拦截问题。

## 设计风格

视觉遵循 **Corporate Clean（企业简洁风）**：蓝色主色（blue-600）、浅灰背景、
统一 `rounded-lg / rounded-xl` 圆角、克制的 `shadow-sm` 层次、悬停上浮与按下缩放反馈、
`focus-visible` 焦点环带偏移量（满足 WCAG 2.1 AA）、过渡时长不超过 200ms。

风格 token 集中定义在 `src/css/custom.css` 顶部的 CSS 变量中，组件与文档页共用同一套变量，
并已适配暗色模式与 `prefers-reduced-motion`。
