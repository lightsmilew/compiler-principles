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
    'labs/capstone',
    {
      type: 'category',
      label: '实验指南',
      items: ['guide/environment', 'guide/workflow', 'guide/report', 'guide/grading', 'guide/submission'],
    },
    {
      type: 'category',
      label: '实验部分',
      items: [
        'labs/part1-lexer',
        'labs/part2-parser',
        'labs/optional-semantic',
        'labs/part3-ir',
        'labs/part4-codegen',
        'labs/part5-ir-optimization',
        'labs/part6-target-optimization',
        'labs/part7-competition',
      ],
    },
    {
      type: 'category',
      label: '机器无关代码优化',
      link: {
        type: 'generated-index',
        title: '机器无关代码优化',
        description:
          'LLVM IR 层的机器无关优化：基本块与 CFG、mem2reg、常量传播、CSE、死代码消除、控制流简化、循环不变代码外提、强度削减、函数内联、基本块重排。',
      },
      items: [
        'optim/ir-cfg',
        'optim/ir-mem2reg',
        'optim/ir-dce',
        'optim/ir-cprop',
        'optim/ir-cse',
        'optim/ir-cfg-simplify',
        'optim/ir-licm',
        'optim/ir-strength-reduction',
        'optim/ir-inline',
        'optim/ir-block-layout',
      ],
    },
    {
      type: 'category',
      label: '目标代码优化',
      link: {
        type: 'generated-index',
        title: '目标代码优化',
        description: 'RISC-V64GC 汇编层的后端优化：活跃区间、寄存器分配、Spill、窥孔、强度削减。',
      },
      items: [
        'optim/asm-liveness',
        'optim/asm-linear-scan',
        'optim/asm-graph-coloring',
        'optim/asm-spill',
        'optim/asm-peephole',
        'optim/asm-strength-reduction',
      ],
    },
    {
      type: 'category',
      label: '参考资料',
      items: ['reference/grammar', 'reference/llvm-mlir', 'reference/toyc-runtime', 'reference/faq'],
    },
  ],
};

export default sidebars;
