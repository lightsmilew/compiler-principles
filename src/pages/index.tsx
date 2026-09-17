import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import LabGrid from '@site/src/components/LabGrid';
import styles from './index.module.css';

/* ==========================================================================
   Hero
   ========================================================================== */
function Hero() {
  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.heroInner}>
          <Heading as="h1" className={styles.title}>
            编译原理实验
          </Heading>
          <p className={styles.subtitle}>
            以一门语言 <strong>ToyC</strong> 为主线，从词法分析一路做到目标代码生成。
            六个递进式实验，最终得到一个完整、可运行的编译器。
          </p>
          <div className={styles.actions}>
            <Link className={styles.btnPrimary} to="/docs/labs/part1-lexer">
              开始第一部分
            </Link>
            <Link className={styles.btnSecondary} to="/docs/guide/environment">
              配置开发环境
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ==========================================================================
   实验内容：垂直时间线
   ========================================================================== */
function LabsSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHead}>
          <Heading as="h2" className={styles.sectionTitle}>
            实验内容
          </Heading>
          <p className={styles.sectionDesc}>
            六个递进式实验加综合课程设计，点击任意卡片进入对应文档。
          </p>
        </div>
        <LabGrid />
      </div>
    </section>
  );
}

/* ==========================================================================
   快速上手
   ========================================================================== */
function QuickStart() {
  return (
    <div className={styles.quickStartWrap}>
      <div className={styles.quickStartSteps}>
        <Heading as="h3" className={styles.qsTitle}>
          快速上手
        </Heading>
        <ol className={styles.steps}>
          <li className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <div>
              <p className={styles.stepTitle}>配置开发环境</p>
              <p className={styles.stepText}>
                安装 GCC / G++、CMake、RISC-V 工具链与 QEMU，见{' '}
                <Link to="/docs/guide/environment">开发环境配置</Link>。
              </p>
            </div>
          </li>
          <li className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <div>
              <p className={styles.stepTitle}>阅读实验文档</p>
              <p className={styles.stepText}>
                从第一部分开始，逐部分完成实验。每个阶段都有明确的验收标准。
              </p>
            </div>
          </li>
          <li className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <div>
              <p className={styles.stepTitle}>提交与验收</p>
              <p className={styles.stepText}>
                按 <Link to="/docs/guide/workflow">提交流程</Link> 分支提交，助教通过在线评测验收。
              </p>
            </div>
          </li>
        </ol>
      </div>

      <div className={styles.quickStartCommands}>
        <Heading as="h3" className={styles.qsTitle}>
          常用编译命令
        </Heading>
        <div className={styles.codeCard}>
          <div className={styles.codeHeader}>terminal</div>
          <pre className={styles.code}>
            <code>
              <span className={styles.codeComment}>{'# '}</span>
              <span className={styles.codePrompt}>编译 ToyC</span>
              {'\n'}cmake -B build &amp;&amp; cmake --build build
              {'\n\n'}
              <span className={styles.codeComment}>{'# '}</span>
              <span className={styles.codePrompt}>分阶段输出</span>
              {'\n'}./compiler --dump-tokens input.c
              {'\n'}./compiler --dump-ast input.c
              {'\n'}./compiler --dump-ir input.c
              {'\n'}./compiler --dump-asm input.c
              {'\n\n'}
              <span className={styles.codeComment}>{'# '}</span>
              <span className={styles.codePrompt}>运行生成的汇编</span>
              {'\n'}riscv64-unknown-elf-gcc -march=rv64gc \
              {'\n'}  -static out.s libtoyc.a -o out.elf
              {'\n'}qemu-riscv64 out.elf
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   底部 CTA
   ========================================================================== */
function CTA() {
  return (
    <section className={`${styles.section} ${styles.sectionAlt}`}>
      <div className="container">
        <div className={styles.cta}>
          <div>
            <Heading as="h3" className={styles.ctaTitle}>
              先看语言与文法约定
            </Heading>
            <p className={styles.ctaText}>
              ToyC 的词法规则、上下文无关文法与各阶段标准输出格式，是全部实验的唯一依据。
            </p>
          </div>
          <Link className={styles.ctaButton} to="/docs/reference/grammar">
            查看文法约定
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   页面导出
   ========================================================================== */
export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title="编译原理实验" description={siteConfig.tagline}>
      <Hero />
      <LabsSection />
      <section className={styles.section}>
        <div className="container">
          <QuickStart />
        </div>
      </section>
      <CTA />
    </Layout>
  );
}
