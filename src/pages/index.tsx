import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const labs = [
  {title: '词法分析', label: 'LEXICAL ANALYSIS', description: '从字符中识别语言。用正则表达式与自动机，将源程序转换为 Token 流。', from: 'Source', to: 'Token', path: 'part1-lexer', category: '编译器前端'},
  {title: '语法分析', label: 'SYNTAX ANALYSIS', description: '让 Token 形成结构。依据文法构建抽象语法树，理解程序的组织方式。', from: 'Token', to: 'AST', path: 'part2-parser', category: '编译器前端'},
  {title: '语义分析与 IR 生成', label: 'INTERMEDIATE REPRESENTATION', description: '连接语法与执行。完成语义处理，将抽象语法树翻译为中间表示。', from: 'AST', to: 'LLVM IR', path: 'part3-ir', category: '编译器前端'},
  {title: '目标代码生成', label: 'CODE GENERATION', description: '让程序走向机器。把中间表示转换为可以运行的 RISC-V 64GC 汇编。', from: 'LLVM IR', to: 'RISC-V', path: 'part4-codegen', category: '编译器后端'},
  {title: 'IR 优化', label: 'IR OPTIMIZATION', description: '在保持语义不变的前提下，完成数据流分析、常量传播与死代码消除。', from: 'LLVM IR', to: 'Optimized IR', path: 'part5-ir-optimization', category: '优化进阶'},
  {title: '目标代码优化', label: 'TARGET OPTIMIZATION', description: '面向 RISC-V 指令，练习寄存器分配、溢出处理与窥孔优化。', from: 'RISC-V', to: 'Optimized ASM', path: 'part6-target-optimization', category: '优化进阶'},
];

const resources = [
  {number: '01', title: '准备开发环境', description: '安装 CMake、RISC-V 工具链与 QEMU，准备好你的实验工作台。', path: '/docs/guide/environment', action: '配置环境'},
  {number: '02', title: '读懂语言约定', description: '查看 ToyC 词法、文法与输出规范，为每个阶段建立共同的依据。', path: '/docs/reference/grammar', action: '阅读文法'},
  {number: '03', title: '了解提交流程', description: '熟悉分支提交与实验验收流程，让每一次实现都有清晰的交付。', path: '/docs/guide/workflow', action: '查看流程'},
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

function CompilerPreview() {
  return (
    <div className={styles.preview} aria-label="ToyC 编译过程示意">
      <div className={styles.windowBar}>
        <span className={styles.windowDots} aria-hidden="true"><i /><i /><i /></span>
        <span>一个程序的编译之旅</span><span className={styles.previewTag}>ToyC</span>
      </div>
      <div className={styles.editor}>
        <div className={styles.fileLabel}><span>源程序</span><span>main.c</span></div>
        <pre><code><span className={styles.keyword}>int</span>{' main() {\n'}{'  '}<span className={styles.keyword}>int</span>{' answer = '}<span className={styles.number}>40</span>{' + '}<span className={styles.number}>2</span>{';\n  '}<span className={styles.keyword}>return</span>{' answer;\n}'}</code></pre>
      </div>
      <div className={styles.pipeline} aria-label="词法分析、语法分析、中间表示、代码生成">
        {['Token', 'AST', 'IR', 'ASM'].map((item, index) => <span key={item}><b>{item}</b>{index < 3 && <Arrow />}</span>)}
      </div>
      <div className={styles.assembly}>
        <div className={styles.fileLabel}><span>目标代码 · 优化后示意</span><span>RISC-V</span></div>
        <pre><code>{'main:\n    '}<span className={styles.instruction}>li</span>{'    a0, 42\n    '}<span className={styles.instruction}>ret</span></code></pre>
      </div>
      <div className={styles.previewFooter}><span><i /> 从源代码，到可执行程序</span><span>return 42</span></div>
    </div>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout title="编译原理实验" description="以 ToyC 为起点，完成从词法分析、LLVM IR 到 RISC-V 目标代码生成的编译器实践。">
      <main className={styles.home}>
        <header className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div>
                <div className={styles.eyebrow}><span className={styles.statusDot} /> 编译系统实践 · ToyC 到 RISC-V</div>
                <Heading as="h1" className={styles.title}>从 ToyC 到 RISC-V，<br />完成一套<span>编译器。</span></Heading>
                <p className={styles.subtitle}>从词法、语法分析开始，依次完成 IR、代码生成和两轮优化；<br className={styles.desktopBreak} />每个阶段都能编译、运行并检查结果。</p>
                <div className={styles.actions}>
                  <Link className={styles.primaryButton} to="/docs/labs/part1-lexer">开始实验 <Arrow /></Link>
                  <Link className={styles.secondaryButton} to="/docs/labs/capstone">查看课程地图 <Arrow diagonal /></Link>
                </div>
                <div className={styles.heroMeta}><span><strong>06</strong> 个递进实验</span><span><strong>01</strong> 套完整编译器</span><span>阶段产物可独立验证</span></div>
              </div>
              <CompilerPreview />
            </div>
            <div className={styles.techStrip}><span>贯穿实验的技术栈</span><div><span>ToyC</span><i /><span>C / C++</span><i /><span>LLVM IR</span><i /><span>RISC-V 64GC</span><i /><span>QEMU</span></div><span className={styles.stripNote}>理解每一次转换</span></div>
          </div>
        </header>

        <section className={`${styles.container} ${styles.section}`} aria-labelledby="labs-title">
          <div className={styles.sectionHead}>
            <div><p className={styles.kicker}>学习路径</p><Heading as="h2" id="labs-title">六个阶段，组成一条编译流程</Heading><p className={styles.sectionDescription}>先完成正确性，再处理中间表示和目标代码的优化。</p></div>
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
          <Link className={styles.capstone} to="/docs/labs/capstone"><CapstoneMark /><div><Heading as="h3">综合设计：接通六个阶段</Heading><p>把前端、IR、代码生成和优化整合起来，完成可运行的 ToyC 编译器。</p></div><span className={styles.capstoneLink}>查看要求 <Arrow /></span></Link>
        </section>

        <section className={styles.startSection} aria-labelledby="start-title">
          <div className={styles.container}>
            <div className={styles.sectionHead}><div><p className={styles.kicker}>开始前准备</p><Heading as="h2" id="start-title">先把环境和约定准备好</Heading><p className={styles.sectionDescription}>确认工具链、语言规则和提交流程，再开始编写代码。</p></div><Link className={styles.textLink} to="/docs/reference/faq">查看常见问题 <Arrow diagonal /></Link></div>
            <div className={styles.resourceGrid}>{resources.map(resource => <Link key={resource.number} className={styles.resource} to={resource.path}><span className={styles.resourceNumber}>{resource.number} /</span><Heading as="h3">{resource.title}</Heading><p>{resource.description}</p><span className={styles.textLink}>{resource.action} <Arrow /></span></Link>)}</div>
            <div className={styles.bottomNote}><span>建议从词法分析开始，按顺序完成每个实验。</span><Link to="/docs/labs/part1-lexer">进入第一个实验 <Arrow /></Link></div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
