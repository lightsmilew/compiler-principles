import type {ReactNode} from 'react';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

type LabItem = {
  index: string;
  title: string;
  description: string;
  meta: string;
  to: string;
};

const labs: LabItem[] = [
  {
    index: '01',
    title: '第一部分 · 词法分析',
    description: '从字符流到 Token 流，覆盖正则、DFA、最长匹配、注释和错误恢复。',
    meta: '核心产出：Token 流',
    to: '/docs/labs/part1-lexer',
  },
  {
    index: '02',
    title: '第二部分 · 语法分析',
    description: '构造 ToyC AST，比较递归下降、LL(1) 与 LR 分析，并处理语法错误。',
    meta: '核心产出：AST',
    to: '/docs/labs/part2-parser',
  },
  {
    index: '03',
    title: '第三部分 · 中间代码生成',
    description: '详细说明每类 AST 语句和表达式如何转换为三地址码，最终提交设计报告。',
    meta: '核心产出：IR 设计报告',
    to: '/docs/labs/part3-ir',
  },
  {
    index: '04',
    title: '第四部分 · 目标代码生成',
    description: '先把未优化三地址码生成可运行的 RISC-V 64GC 汇编，建立正确性基线。',
    meta: '核心产出：基线汇编',
    to: '/docs/labs/part4-codegen',
  },
  {
    index: '05',
    title: '第五部分 · 中间代码优化',
    description: '在三地址码层进行 CFG、Use-Def、数据流分析和机器无关优化。',
    meta: '核心产出：优化 IR',
    to: '/docs/labs/part5-ir-optimization',
  },
  {
    index: '06',
    title: '第六部分 · 目标代码优化',
    description: '在 RISC-V 汇编层完成寄存器分配、spill 和窥孔优化。',
    meta: '核心产出：优化汇编',
    to: '/docs/labs/part6-target-optimization',
  },
  {
    index: '★',
    title: '综合课程设计',
    description: '把六个部分串成完整编译器，现场演示并答辩，接受随机用例测试。',
    meta: '核心产出：完整编译器',
    to: '/docs/labs/capstone',
  },
];

function LabCard({index, title, description, meta, to}: LabItem) {
  return (
    <Link className={styles.card} to={to}>
      <span className={styles.index} aria-hidden="true">
        {index}
      </span>
      <span className={styles.body}>
        <Heading as="h3" className={styles.title}>
          {title}
          <svg
            className={styles.arrow}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Heading>
        <p className={styles.description}>{description}</p>
        <span className={styles.meta}>{meta}</span>
      </span>
    </Link>
  );
}

export default function LabGrid(): ReactNode {
  return (
    <div className={styles.grid}>
      {labs.map((lab) => (
        <LabCard key={lab.title} {...lab} />
      ))}
    </div>
  );
}
