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
    title: '词法分析器',
    description: '正则到有限自动机，实现最长匹配与错误恢复，输出规范化 Token 流。',
    meta: '核心产出：Token 流',
    to: '/docs/labs/lab1-lexer',
  },
  {
    index: '02',
    title: '语法分析 · LL(1)',
    description: '消除左递归、计算 FIRST/FOLLOW 集，实现递归下降与预测分析表。',
    meta: '核心产出：语法树',
    to: '/docs/labs/lab2-parser-ll',
  },
  {
    index: '03',
    title: '语法分析 · LR',
    description: '构造 LR(0)/SLR(1)/LALR(1) 项目集规范族与 ACTION/GOTO 分析表。',
    meta: '核心产出：分析表',
    to: '/docs/labs/lab3-parser-lr',
  },
  {
    index: '04',
    title: '语义分析与符号表',
    description: '作用域栈与名字解析、类型检查，输出带类型标注的抽象语法树。',
    meta: '核心产出：带类型 AST',
    to: '/docs/labs/lab4-semantic',
  },
  {
    index: '05',
    title: '中间代码生成',
    description: '用回填技术翻译控制流与布尔表达式，生成三地址码四元式序列。',
    meta: '核心产出：四元式',
    to: '/docs/labs/lab5-ir',
  },
  {
    index: '06',
    title: '代码优化',
    description: '基本块与控制流图、数据流分析，实现常量传播与公共子表达式消除。',
    meta: '核心产出：优化后 IR',
    to: '/docs/labs/lab6-optimize',
  },
  {
    index: '07',
    title: '目标代码生成',
    description: '指令选择、寄存器分配与栈帧布局，把四元式翻译为目标汇编代码。',
    meta: '核心产出：汇编代码',
    to: '/docs/labs/lab7-codegen',
  },
  {
    index: '★',
    title: '综合课程设计',
    description: '把七个实验串成完整编译器，现场演示并答辩，接受随机用例测试。',
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
