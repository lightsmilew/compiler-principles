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
  {title: 'IR 优化', label: 'IR OPTIMIZATION', description: '在正确的基础上更进一步。探索数据流分析、常量传播与死代码消除。', from: 'LLVM IR', to: 'Optimized IR', path: 'part5-ir-optimization', category: '优化进阶'},
  {title: '目标代码优化', label: 'TARGET OPTIMIZATION', description: '把性能落实到指令。探索寄存器分配、窥孔优化与指令调度。', from: 'RISC-V', to: 'Optimized ASM', path: 'part6-target-optimization', category: '优化进阶'},
];

const resources = [
  {number: '01', title: '准备开发环境', description: '安装 CMake、RISC-V 工具链与 QEMU，准备好你的实验工作台。', path: '/docs/guide/environment', action: '配置环境'},
  {number: '02', title: '读懂语言约定', description: '查看 ToyC 词法、文法与输出规范，为每个阶段建立共同的依据。', path: '/docs/reference/grammar', action: '阅读文法'},
  {number: '03', title: '了解提交流程', description: '熟悉分支提交与实验验收流程，让每一次实现都有清晰的交付。', path: '/docs/guide/workflow', action: '查看流程'},
];

function Arrow({diagonal = false}: {diagonal?: boolean}) {
  return <span aria-hidden="true">{diagonal ? '↗' : '→'}</span>;
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
                <div className={styles.eyebrow}><span className={styles.statusDot} /> 编译原理实验 · 从理解到实现</div>
                <Heading as="h1" className={styles.title}>亲手构建，<br />你的第一个<span>编译器。</span></Heading>
                <p className={styles.subtitle}>从一行 ToyC 代码出发，走过词法、语法与中间表示，<br className={styles.desktopBreak} />最终抵达 RISC-V。让课本里的原理，成为能运行的程序。</p>
                <div className={styles.actions}>
                  <Link className={styles.primaryButton} to="/docs/labs/part1-lexer">开始实验 <Arrow /></Link>
                  <Link className={styles.secondaryButton} to="/docs/labs/capstone">了解课程全貌 <Arrow diagonal /></Link>
                </div>
                <div className={styles.heroMeta}><span><strong>06</strong> 个递进实验</span><span><strong>01</strong> 个完整编译器</span><span>从零实现 · 逐步验证</span></div>
              </div>
              <CompilerPreview />
            </div>
            <div className={styles.techStrip}><span>贯穿实验的技术栈</span><div><span>ToyC</span><i /><span>C / C++</span><i /><span>LLVM IR</span><i /><span>RISC-V 64GC</span><i /><span>QEMU</span></div><span className={styles.stripNote}>理解每一次转换</span></div>
          </div>
        </header>

        <section className={`${styles.container} ${styles.section}`} aria-labelledby="labs-title">
          <div className={styles.sectionHead}>
            <div><p className={styles.kicker}>THE LEARNING PATH</p><Heading as="h2" id="labs-title">六个阶段，一条完整的编译之路</Heading><p className={styles.sectionDescription}>先让程序正确运行，再探索如何让它运行得更好。</p></div>
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
          <Link className={styles.capstone} to="/docs/labs/capstone"><span className={styles.capstoneIcon} aria-hidden="true">⌘</span><div><Heading as="h3">把每一步，连成一个完整作品</Heading><p>综合课程设计 · 整合编译流程，验证实现，准备报告与答辩。</p></div><span className={styles.capstoneLink}>进入综合设计 <Arrow /></span></Link>
        </section>

        <section className={styles.startSection} aria-labelledby="start-title">
          <div className={styles.container}>
            <div className={styles.sectionHead}><div><p className={styles.kicker}>BEFORE YOU BUILD</p><Heading as="h2" id="start-title">写下第一行代码之前</Heading><p className={styles.sectionDescription}>准备好工具，明确约定，然后专注于实现。</p></div><Link className={styles.textLink} to="/docs/reference/faq">遇到问题？查看 FAQ <Arrow diagonal /></Link></div>
            <div className={styles.resourceGrid}>{resources.map(resource => <Link key={resource.number} className={styles.resource} to={resource.path}><span className={styles.resourceNumber}>{resource.number} /</span><Heading as="h3">{resource.title}</Heading><p>{resource.description}</p><span className={styles.textLink}>{resource.action} <Arrow /></span></Link>)}</div>
            <div className={styles.bottomNote}><span>每一个 Token，都是理解程序的开始。</span><Link to="/docs/labs/part1-lexer">从词法分析出发 <Arrow /></Link></div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
