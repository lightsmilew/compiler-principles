import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const phases = [
  {
    title: '前端分析', subtitle: '第一、二部分', color: 'blue',
    stages: [
      {number: '01', title: '词法分析', from: '字符', to: 'Token', path: 'part1-lexer'},
      {number: '02', title: '语法分析', from: 'Token', to: 'AST', path: 'part2-parser'},
    ],
  },
  {
    title: '代码生成', subtitle: '第三、四部分', color: 'green',
    stages: [
      {number: '03', title: '中间代码生成', from: 'AST', to: 'IR', path: 'part3-ir'},
      {number: '04', title: '目标代码生成', from: 'IR', to: 'RV64GC', path: 'part4-codegen'},
    ],
  },
  {
    title: '代码优化', subtitle: '第五、六部分', color: 'purple',
    stages: [
      {number: '05', title: '中间代码优化', from: 'IR', to: '优化 IR', path: 'part5-ir-optimization'},
      {number: '06', title: '目标代码优化', from: '汇编', to: '优化汇编', path: 'part6-target-optimization'},
    ],
  },
];

function PhaseIcon({index}: {index: number}): ReactNode {
  return (
    <svg className={styles.phaseIcon} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {index === 0 ? (
          <path d="m10 8-7 8 7 8m12-16 7 8-7 8M19 5l-6 22" />
        ) : index === 1 ? (
          <path d="m16 3 13 7-13 7L3 10l13-7Zm-13 13 13 7 13-7M3 22l13 7 13-7" />
        ) : (
          <><path d="M4 24a13 13 0 1 1 24 0M16 16l7-7M8 16h1m14 0h1M16 4v1" /><circle cx="16" cy="16" r="2.5" /></>
        )}
      </g>
    </svg>
  );
}

export default function CourseMap(): ReactNode {
  return (
    <figure className={styles.board} aria-label="六部分实验的阶段路线">
      <div className={styles.phases}>
        {phases.map((phase, index) => (
          <section className={[styles.phase, styles[phase.color]].join(' ')} key={phase.title}>
            <header className={styles.phaseHeader}>
              <div><span className={styles.eyebrow}>{phase.subtitle}</span><h4 className={styles.phaseTitle}>{phase.title}</h4></div>
              <PhaseIcon index={index} />
            </header>
            <ol className={styles.stages} start={index * 2 + 1}>
              {phase.stages.map(stage => (
                <li key={stage.number}>
                  <Link to={'/docs/labs/' + stage.path} className={styles.stage}>
                    <span className={styles.stageNumber} aria-hidden="true">{stage.number}</span>
                    <div className={styles.stageContent}>
                      <strong>{stage.title}</strong>
                      <span className={styles.io}>{stage.from}<span aria-hidden="true"> → </span>{stage.to}</span>
                    </div>
                    <span className={styles.linkArrow} aria-hidden="true">↗</span>
                  </Link>
                </li>
              ))}
            </ol>
            <div className={styles.phaseNote}>
              {index === 0 ? (
                <><Link to="/docs/labs/optional-semantic">选做：语义分析</Link><span>在 AST 与 IR 之间检查作用域、类型等。</span></>
              ) : index === 1 ? (
                <><strong>基线验证</strong><span>链接运行时库，用 QEMU 运行生成的程序。</span></>
              ) : (
                <><strong>性能评测</strong><span>通过 <code>-opt</code> 启用优化。</span></>
              )}
            </div>
          </section>
        ))}
      </div>
      <div className={styles.integration}>
        <span className={styles.integrationMark} aria-hidden="true">✓</span>
        <div><strong>综合课程设计</strong><span>整合六个部分，提供统一的编译器接口。</span></div>
        <span className={styles.integrationGoal}>功能评测 · 性能评测</span>
      </div>
      <figcaption className={styles.caption}>实验按编号依次完成，第四部分完成后得到可运行的基线编译器，第五、六部分在此基础上增加优化。点击卡片可查看实验内容。</figcaption>
    </figure>
  );
}

const pipelinePhases = [
  {
    title: '编译器前端', input: 'ToyC 源程序 · input.c', color: 'blue',
    steps: [
      {title: '词法分析 → 语法分析', note: '第一、二部分 · 字符 → Token → AST'},
      {title: '语义分析', note: '选做 · 符号表、作用域与类型检查', conditional: true},
    ],
    output: 'AST',
  },
  {
    title: '中间表示', input: '输入 AST', color: 'green',
    steps: [
      {title: '中间代码生成', note: '第三部分 · AST → IR'},
      {title: '中间代码优化', note: '第五部分 · 传入 -opt 时启用', conditional: true},
    ],
    output: 'IR / 优化后的 IR',
  },
  {
    title: '编译器后端', input: '输入 IR', color: 'purple',
    steps: [
      {title: '目标代码生成', note: '第四部分 · 指令选择与代码生成'},
      {title: '目标代码优化', note: '第六部分 · 传入 -opt 时启用', conditional: true},
    ],
    output: 'RV64GC 汇编 · input.s',
  },
];

export function CompilerPipeline(): ReactNode {
  return (
    <figure className={styles.board} aria-label="编译器的实际处理顺序与产物运行流程">
      <div className={styles.pipeline}>
        {pipelinePhases.map((phase, index) => (
          <section className={[styles.pipelinePhase, styles[phase.color]].join(' ')} key={phase.title}>
            <header className={styles.pipelineHeader}>
              <span className={styles.pipelineNumber}>{index + 1}</span><h4 className={styles.phaseTitle}>{phase.title}</h4>
              {index < 2 && <span className={styles.phaseArrow} aria-hidden="true">→</span>}
            </header>
            <div className={styles.pipelineInput}>{phase.input}</div>
            <div className={styles.pipelineSteps}>
              {phase.steps.map(step => (
                <div className={step.conditional ? styles.conditionalStep : styles.pipelineStep} key={step.title}>
                  <strong>{step.title}</strong><span>{step.note}</span>
                </div>
              ))}
            </div>
            <div className={styles.pipelineOutput}><span>输出</span><strong>{phase.output}</strong></div>
          </section>
        ))}
      </div>
      <div className={styles.execution}>
        <div className={styles.executionHeader}><strong>链接与运行</strong><span>使用环境搭建阶段安装的工具</span></div>
        <div className={styles.executionSteps}>
          <div><strong><code>input.s</code> + <code>libtoyc.a</code></strong><span>RISC-V GCC 链接</span></div>
          <span className={styles.executionArrow} aria-hidden="true">→</span>
          <div><strong>RISC-V 可执行文件</strong><span><code>input</code>（ELF）</span></div>
          <span className={styles.executionArrow} aria-hidden="true">→</span>
          <div><strong>程序运行结果</strong><span><code>qemu-riscv64</code> 执行</span></div>
        </div>
      </div>
      <figcaption className={styles.caption}>实际编译时，IR 优化在目标代码生成之前；功能评测不传 <code>-opt</code>，性能评测传入 <code>-opt</code>。虚线框表示选做分析或由参数启用的优化。</figcaption>
    </figure>
  );
}
