import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * GitHub Pages 部署参数。
 *
 * 在 GitHub Actions 中构建时，会自动读取当前仓库的 owner / name；
 * 本地构建或首次部署前，请把下面的兜底值改成你自己的 GitHub 用户名与仓库名。
 * （也可以用环境变量 GITHUB_REPOSITORY_OWNER / GITHUB_REPOSITORY 覆盖）
 */
// 已硬编码为 https://lightsmilew.github.io/compiler-principles/
const organizationName = 'lightsmilew';
const projectName = 'compiler-principles';

const config: Config = {
  title: '编译原理实验',
  tagline: '从词法分析到目标代码生成的完整实践',
  favicon: 'img/icon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // 线上站点地址：https://<用户名>.github.io/<仓库名>/
  url: `https://lightsmilew.github.io`,
  baseUrl: `/compiler-principles/`,
  // 注意：url 和 baseUrl 已硬编码为实际部署地址
  // 如果改用 GitHub Actions CI，请将上面的常量恢复为 env 读取

  // GitHub Pages 部署配置
  organizationName,
  projectName,

  trailingSlash: false,
  onBrokenLinks: 'throw',

  // 站点与文档语言为简体中文
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  // 开启 Mermaid 图表（语法树、DFA、流程图等）
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // 文档页面右下角的 "编辑此页" 链接
          editUrl: `https://github.com/${organizationName}/${projectName}/tree/main/`,
          // 启用 :::tip :::info :::danger :::caution 等提示块
          admonitions: {
            keywords: ['tip', 'info', 'note', 'success', 'warning', 'danger', 'caution'],
          },
        },
        // 本项目是实验文档站，不需要博客
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
      options: {
        fontFamily: 'var(--ifm-font-family-base)',
        // Preserve readable text at the diagram's natural size. The shared
        // container scrolls horizontally when a diagram exceeds the page width.
        flowchart: {curve: 'basis', useMaxWidth: false, htmlLabels: true},
        sequence: {useMaxWidth: false},
        pie: {useMaxWidth: false},
        themeVariables: {
          // 珞珈绿主题（与全站品牌色保持一致）
          primaryColor: '#0e4834',
          primaryTextColor: '#ffffff',
          primaryBorderColor: '#08291d',
          lineColor: '#115740',
          secondaryColor: '#e6efeb',
          tertiaryColor: '#f8fafc',
          fontSize: '14px',
        },
      },
    },
    navbar: {
      title: '编译原理实验',
      logo: {
        alt: '编译原理实验',
        src: 'img/title.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: '实验文档',
        },
        {
          href: `https://github.com/${organizationName}/${projectName}`,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: '文档',
          items: [
            {
              label: '课程总览',
              to: '/docs/labs/capstone',
            },
            {
              label: '第一部分：词法分析',
              to: '/docs/labs/part1-lexer',
            },
          ],
        },
        {
          title: '相关资源',
          items: [
            {
              label: 'Dragon Book（编译原理）',
              href: 'https://en.wikipedia.org/wiki/Compilers:_Principles,_Techniques,_and_Tools',
            },
            {
              label: 'Docusaurus 文档',
              href: 'https://docusaurus.io/docs',
            },
          ],
        },
        {
          title: '仓库',
          items: [
            {
              label: 'GitHub',
              href: `https://github.com/${organizationName}/${projectName}`,
            },
            {
              label: '问题反馈',
              href: `https://github.com/${organizationName}/${projectName}/issues`,
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} 编译原理课程组 · Built with Docusaurus`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['c', 'cpp', 'java', 'bash', 'json', 'yaml', 'python'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
