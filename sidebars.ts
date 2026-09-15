import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * 侧边栏由 docs/ 目录结构自动生成。
 *
 * 顺序与标题通过两处控制：
 *  1. 目录级：docs/<目录>/_category_.json 中的 label / position
 *  2. 文件级：md 文章头部的 `sidebar_position` 与 `sidebar_label`
 *
 * 新增一篇实验文档时无需改动本文件，放进 docs/ 即可。
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: '实验六部分',
      items: [
        'labs/part1-lexer',
        'labs/part2-parser',
        'labs/optional-semantic',
        'labs/part3-ir',
        'labs/part4-codegen',
        'labs/part5-ir-optimization',
        'labs/part6-target-optimization',
      ],
    },
    'labs/capstone',
    {
      type: 'category',
      label: '实验指南',
      items: ['guide/environment', 'guide/workflow', 'guide/report', 'guide/submission'],
    },
    {
      type: 'category',
      label: '参考资料',
      items: ['reference/grammar', 'reference/llvm-mlir', 'reference/sysy-runtime', 'reference/faq'],
    },
  ],
};

export default sidebars;
