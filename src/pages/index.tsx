import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CompilerShowcase from '@site/src/components/CompilerShowcase';
import styles from './index.module.css';

const labs = [
  {title: '词法分析', label: 'LEXICAL ANALYSIS', description: '源码里哪些是关键字，哪些是变量名？把字符读成 Token，编译就从这里开始。', from: 'Source', to: 'Token', path: 'part1-lexer', category: '编译器前端'},
  {title: '语法分析', label: 'SYNTAX ANALYSIS', description: '为什么先算乘法？按 ToyC 文法构建 AST，把运算和语句的结构表达清楚。', from: 'Token', to: 'AST', path: 'part2-parser', category: '编译器前端'},
  {title: '中间代码生成', label: 'INTERMEDIATE REPRESENTATION', description: '设计中间表示，将 AST 转换为包含运算、访存和控制流的 IR。', from: 'AST', to: 'IR', path: 'part3-ir', category: '编译器前端'},
  {title: '目标代码生成', label: 'CODE GENERATION', description: '完成指令选择、栈帧布局与函数调用，将 IR 转换为 RV64GC 汇编。', from: 'IR', to: 'RISC-V', path: 'part4-codegen', category: '编译器后端'},
  {title: 'IR 优化', label: 'IR OPTIMIZATION', description: '在保持语义不变的前提下，完成数据流分析、常量传播与死代码消除。', from: 'IR', to: 'Optimized IR', path: 'part5-ir-optimization', category: '优化进阶'},
  {title: '目标代码优化', label: 'TARGET OPTIMIZATION', description: '面向 RISC-V 指令，练习寄存器分配、溢出处理与窥孔优化。', from: 'RISC-V', to: 'Optimized ASM', path: 'part6-target-optimization', category: '优化进阶'},
];

const resources = [
  {number: '01', title: '开发环境', description: '安装所选语言工具链、RISC-V 工具链与 QEMU，并运行环境验证程序。', path: '/docs/guide/environment', action: '配置环境'},
  {number: '02', title: '语言约定', description: '查阅 ToyC 的词法规则、文法和输入输出规范。', path: '/docs/reference/grammar', action: '阅读文法'},
  {number: '03', title: '提交流程', description: '查阅代码规范、阶段提交要求、评测与汇报安排。', path: '/docs/guide/workflow', action: '查看流程'},
];

function Arrow({diagonal = false}: {diagonal?: boolean}) {
  return (
    <svg className={styles.arrowIcon} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      {diagonal ? <path d="M5 15 15 5M8 5h7v7" /> : <path d="M3 10h13M11 5l5 5-5 5" />}
    </svg>
  );
}

function CapstoneMark() {
  return (
    <svg className={styles.capstoneIcon} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M6 16h20M11 9l-5 7 5 7M21 9l5 7-5 7" />
      <circle cx="6" cy="16" r="2" />
      <circle cx="26" cy="16" r="2" />
    </svg>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout title="编译原理实验" description="实现自己的 ToyC 编译器：词法与语法分析、中间表示、RISC-V 代码生成和优化。">
      <main className={styles.home}>
        <header className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div className={styles.heroIntro}>
                <Heading as="h1" className={styles.title}>写个编译器，<br /><span>看看代码怎么跑。</span></Heading>
                <p className={styles.subtitle}>从 ToyC 源码到 RISC-V 汇编，动手实现一个编译器。</p>
                <div className={styles.actions}>
                  <Link className={styles.primaryButton} to="/docs/labs/part1-lexer">开始实验 <Arrow /></Link>
                  <Link className={styles.secondaryButton} to="/docs/guide/environment">搭建开发环境 <Arrow diagonal /></Link>
                </div>
                <div className={styles.heroMeta}><span><strong>06</strong> 个实验部分</span><span><strong>60</strong> 建议课时</span><span>目标平台 RV64GC</span></div>
              </div>
              <div className={styles.showcaseWrap}><CompilerShowcase /></div>
            </div>
            <div className={styles.techStrip}><span>语言与工具</span><div><span>ToyC</span><i /><span>C / C++ · Java · Rust</span><i /><span>IR</span><i /><span>RISC-V 64GC</span><i /><span>QEMU</span></div><span className={styles.stripNote}>源码 → 中间表示 → 汇编</span></div>
          </div>
        </header>

        <section className={`${styles.container} ${styles.section}`} aria-labelledby="labs-title">
          <div className={styles.sectionHead}>
            <div><p className={styles.kicker}>实验安排</p><Heading as="h2" id="labs-title">六个实验部分</Heading><p className={styles.sectionDescription}>第一至四部分实现基线编译器，第五、六部分增加优化。</p></div>
            <Link className={styles.textLink} to="/docs/labs/capstone">课程要求与目标 <Arrow /></Link>
          </div>
          <div className={styles.labGrid}>
            {labs.map((lab, index) => (
              <Link key={lab.path} to={`/docs/labs/${lab.path}`} className={styles.labCard}>
                <div className={styles.cardTop}><span className={styles.labNumber}>{String(index + 1).padStart(2, '0')}</span><span className={styles.category}>{lab.category}</span><span className={styles.cardArrow}><Arrow diagonal /></span></div>
                <div className={styles.labLabel}>{lab.label}</div>
                <Heading as="h3">{lab.title}</Heading><p>{lab.description}</p>
                <div className={styles.cardBottom}><code>{lab.from}</code><Arrow /><code>{lab.to}</code></div>
              </Link>
            ))}
          </div>
          <Link className={styles.capstone} to="/docs/labs/capstone"><CapstoneMark /><div><Heading as="h3">综合课程设计</Heading><p>整合各部分实现，完成平台评测、实验报告与汇报展示。</p></div><span className={styles.capstoneLink}>查看要求 <Arrow /></span></Link>
        </section>

        <section className={styles.startSection} aria-labelledby="start-title">
          <div className={styles.container}>
            <div className={styles.sectionHead}><div><p className={styles.kicker}>实验准备</p><Heading as="h2" id="start-title">开发环境与实验规范</Heading><p className={styles.sectionDescription}>开始实验前，完成环境验证并阅读语言规则和提交要求。</p></div><Link className={styles.textLink} to="/docs/reference/faq">查看常见问题 <Arrow diagonal /></Link></div>
            <div className={styles.resourceGrid}>{resources.map(resource => <Link key={resource.number} className={styles.resource} to={resource.path}><span className={styles.resourceNumber}>{resource.number} /</span><Heading as="h3">{resource.title}</Heading><p>{resource.description}</p><span className={styles.textLink}>{resource.action} <Arrow /></span></Link>)}</div>
            <div className={styles.bottomNote}><span>建议从词法分析开始，按顺序完成每个实验。</span><Link to="/docs/labs/part1-lexer">进入第一个实验 <Arrow /></Link></div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
