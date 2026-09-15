import type {ReactNode, CSSProperties} from 'react';
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
    meta: 'Token 流',
    to: '/docs/labs/part1-lexer',
  },
  {
    index: '02',
    title: '第二部分 · 语法分析',
    description: '构造 ToyC AST，通过 LL(1) 分析器为后续 IR 生成提供基础。',
    meta: 'AST',
    to: '/docs/labs/part2-parser',
  },
  {
    index: '03',
    title: '第三部分 · 中间代码生成',
    description: '每类 AST 语句和表达式如何转换为 LLVM IR，最终提交设计报告。',
    meta: 'IR 设计报告',
    to: '/docs/labs/part3-ir',
  },
  {
    index: '04',
    title: '第四部分 · 目标代码生成',
    description: '把未优化 IR 生成可运行的 RISC-V 64GC 汇编，建立正确性基线。',
    meta: '基线汇编',
    to: '/docs/labs/part4-codegen',
  },
  {
    index: '05',
    title: '第五部分 · 中间代码优化',
    description: 'CFG、Use-Def、数据流分析，常量传播、死代码消除。',
    meta: '优化 IR',
    to: '/docs/labs/part5-ir-optimization',
  },
  {
    index: '06',
    title: '第六部分 · 目标代码优化',
    description: '寄存器分配、spill 策略、窥孔优化。',
    meta: '优化汇编',
    to: '/docs/labs/part6-target-optimization',
  },
  {
    index: '★',
    title: '综合课程设计',
    description: '把六个部分串成完整编译器，现场演示并答辩，接受随机用例测试。',
    meta: '完整编译器',
    to: '/docs/labs/capstone',
  },
];

function LabCard({index, title, description, meta, to}: LabItem) {
  return (
    <Link className={styles.card} to={to}>
      <div className={styles.cardIndex}>{index}</div>
      <div className={styles.cardBody}>
        <p className={styles.cardTitle}>{title}</p>
        <p className={styles.cardDesc}>{description}</p>
        <span className={styles.cardMeta}>{meta}</span>
      </div>
    </Link>
  );
}

export default function LabGrid(): ReactNode {
  // 7 张卡片均匀分布在 360° 圆周上，每张间隔 360/7 ≈ 51.43°
  // 从 -90°（正上方）开始，顺时针展开
  const step = 360 / labs.length;
  return (
    <div className={styles.fanOuter}>
      {/* 中心锚点 */}
      <div className={styles.fanHub} aria-hidden="true">
        <span className={styles.fanHubLabel}>ToyC</span>
        <span className={styles.fanHubSub}>编译原理实验</span>
      </div>
      {/* 卡片绕圆心排列 */}
      <ul className={styles.fanRing}>
        {labs.map((lab, i) => {
          const angle = -90 + i * step;
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad);
          const y = Math.sin(rad);
          const slotStyle: CSSProperties = {
            '--x': x.toFixed(4),
            '--y': y.toFixed(4),
          };
          return (
            <li
              key={lab.title}
              className={styles.fanSlot}
              style={slotStyle}>
              <LabCard {...lab} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
