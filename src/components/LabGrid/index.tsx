import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

/* ==========================================================================
   流水线数据：编译器六阶段 + 综合设计
   ========================================================================== */
type Stage = {
  index: string;
  title: string;
  description: string;
  input: string;
  output: string;
  to: string;
  type: 'frontend' | 'optimize' | 'backend' | 'capstone';
};

const stages: Stage[] = [
  {
    index: '01',
    title: '词法分析',
    description: '字符流 → Token 流，覆盖正则、DFA、最长匹配、注释和错误恢复。',
    input: 'ToyC源文件',
    output: 'Token',
    to: '/docs/labs/part1-lexer',
    type: 'frontend',
  },
  {
    index: '02',
    title: '语法分析',
    description: 'Token 流 → AST，通过语法分析器为后续 IR 生成提供基础。',
    input: 'Token',
    output: 'AST',
    to: '/docs/labs/part2-parser',
    type: 'frontend',
  },
  {
    index: '03',
    title: '语义分析与 IR 生成',
    description: 'AST → IR，每类 AST 节点如何转换为中间表示。',
    input: 'AST',
    output: 'IR',
    to: '/docs/labs/part3-ir',
    type: 'frontend',
  },
  {
    index: '04',
    title: '目标代码生成',
    description: '未优化 IR → 可运行的 RISC-V 64GC 汇编。',
    input: 'IR',
    output: '汇编',
    to: '/docs/labs/part4-codegen',
    type: 'backend',
  },
  {
    index: '05',
    title: 'IR 优化',
    description: 'CFG、Use-Def、数据流分析，常量传播、死代码消除。',
    input: 'IR',
    output: '优化 IR',
    to: '/docs/labs/part5-ir-optimization',
    type: 'optimize',
  },
  {
    index: '06',
    title: '目标代码优化',
    description: '寄存器分配、spill 策略、窥孔优化、调度与重排。',
    input: '汇编',
    output: '优化汇编',
    to: '/docs/labs/part6-target-optimization',
    type: 'backend',
  },
  {
    index: '★',
    title: '综合课程设计',
    description: '形成完整编译器，现场答辩，接受随机提问。',
    input: 'ToyC源文件',
    output: '可执行文件',
    to: '/docs/labs/capstone',
    type: 'capstone',
  },
];

/* ==========================================================================
   主组件：垂直时间线
   ========================================================================== */
export default function LabGrid(): ReactNode {
  return (
    <div className={styles.timeline}>
      {/* 中央连接线 */}
      <div className={styles.line} aria-hidden="true" />

      {/* 时间线节点列表 */}
      <div className={styles.nodes}>
        {stages.map((stage, i) => (
          <div
            key={stage.index}
            className={`${styles.item} ${i % 2 === 0 ? styles.itemLeft : styles.itemRight}`}>
            {/* 节点圆点 */}
            <div className={`${styles.dot} ${styles[`dot_${stage.type}`]}`}>
              <span className={styles.dotIndex}>{stage.index}</span>
            </div>

            {/* 内容卡片 */}
            <Link className={styles.card} to={stage.to}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{stage.title}</h3>
                <span className={`${styles.badge} ${styles[`badge_${stage.type}`]}`}>
                  {stage.type === 'frontend' && '前端'}
                  {stage.type === 'optimize' && '优化'}
                  {stage.type === 'backend' && '后端'}
                  {stage.type === 'capstone' && '综合'}
                </span>
              </div>
              <p className={styles.cardDesc}>{stage.description}</p>
              <div className={styles.cardIO}>
                <span className={styles.ioChip}>
                  <span className={styles.ioIcon}>←</span>
                  {stage.input}
                </span>
                <span className={styles.ioDivider}>→</span>
                <span className={styles.ioChip}>
                  {stage.output}
                  <span className={styles.ioIcon}>→</span>
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
