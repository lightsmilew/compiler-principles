import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import LabGrid from '@site/src/components/LabGrid';

import styles from './index.module.css';

const stats = [
  {value: '7', label: '个递进式实验'},
  {value: '1', label: '门公共语言 MiniC'},
  {value: '3', label: '大编译阶段'},
  {value: '100%', label: '文档即内容源'},
];

const steps = [
  {
    title: '准备开发环境',
    text: '安装编译器、Git 与汇编模拟器，跑通最小可运行验证。',
    to: '/docs/guide/environment',
  },
  {
    title: '开始实验一',
    text: '实现词法分析器，输出规范化的 Token 流并通过自测用例。',
    to: '/docs/labs/lab1-lexer',
  },
  {
    title: '遵循提交流程',
    text: '按分支模型提交代码与报告，通过助教验收后进入下一个实验。',
    to: '/docs/guide/workflow',
  },
];

function Hero() {
  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.heroInner}>
          <Heading as="h1" className={styles.title}>
            编译原理实验
          </Heading>
          <p className={styles.subtitle}>
            以一个 MiniC 编译器为主线，从词法分析一路做到目标代码生成。
            每个阶段的产物都是下一个阶段的输入，最终你会得到一个能跑起来的完整编译器。
          </p>
          <div className={styles.actions}>
            <Link className={styles.btnPrimary} to="/docs/intro">
              开始阅读文档
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

function Stats() {
  return (
    <section className={styles.stats}>
      <div className="container">
        <div className={styles.statsGrid}>
          {stats.map((item) => (
            <div key={item.label}>
              <div className={styles.statValue}>{item.value}</div>
              <div className={styles.statLabel}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickStart() {
  return (
    <div className={styles.quickStart}>
      <ol className={styles.steps}>
        {steps.map((step, i) => (
          <li className={styles.step} key={step.title}>
            <span className={styles.stepIndex}>{i + 1}</span>
            <span>
              <Link to={step.to}>
                <p className={styles.stepTitle}>{step.title}</p>
              </Link>
              <p className={styles.stepText}>{step.text}</p>
            </span>
          </li>
        ))}
      </ol>
      <div className={styles.codeCard}>
        <div className={styles.codeHeader}>terminal</div>
        <pre className={styles.code}>
          <code>
            <span className={styles.codeComment}># 1. 获取实验仓库</span>
            {'\n'}git clone &lt;repo&gt; &amp;&amp; cd CompilerSystemPractice
            {'\n\n'}
            <span className={styles.codeComment}># 2. 分阶段验证你的编译器</span>
            {'\n'}./mycompiler --dump-tokens input.mc{'   '}
            <span className={styles.codeComment}># 实验一</span>
            {'\n'}./mycompiler --dump-ast input.mc{'      '}
            <span className={styles.codeComment}># 实验二、三</span>
            {'\n'}./mycompiler --dump-ir input.mc{'       '}
            <span className={styles.codeComment}># 实验五</span>
            {'\n'}./mycompiler --dump-asm input.mc{'      '}
            <span className={styles.codeComment}># 实验七</span>
          </code>
        </pre>
      </div>
    </div>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="编译原理实验"
      description={siteConfig.tagline}>
      <Hero />

      <Stats />

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <Heading as="h2" className={styles.sectionTitle}>
              为什么用这个站点
            </Heading>
            <p className={styles.sectionDesc}>
              面向课程交付而设计：内容只用 Markdown 维护，进度按实验拆分，
              每一阶段都有可被自动比对的输出格式。
            </p>
          </div>
          <HomepageFeatures />
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionMuted}`}>
        <div className="container">
          <div className={styles.sectionHead}>
            <Heading as="h2" className={styles.sectionTitle}>
              实验内容
            </Heading>
            <p className={styles.sectionDesc}>
              七个实验加一个综合课程设计，点击任意一张卡片进入对应的实验文档。
            </p>
          </div>
          <LabGrid />
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <Heading as="h2" className={styles.sectionTitle}>
              快速上手
            </Heading>
            <p className={styles.sectionDesc}>
              三步跑通第一个实验。遇到问题先查阅参考资料中的常见问题。
            </p>
          </div>
          <QuickStart />
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionMuted}`}>
        <div className="container">
          <div className={styles.cta}>
            <div>
              <Heading as="h3" className={styles.ctaTitle}>
                先看公共语言与文法约定
              </Heading>
              <p className={styles.ctaText}>
                MiniC 的记号定义、上下文无关文法与各阶段标准输出格式，是全部实验的唯一依据。
              </p>
            </div>
            <Link className={styles.ctaButton} to="/docs/reference/grammar">
              查看文法约定
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
