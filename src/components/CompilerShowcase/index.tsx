import {useId, useRef, useState, type KeyboardEvent, type ReactNode} from 'react';
import styles from './styles.module.css';

type StageId = 'token' | 'ast' | 'ir' | 'asm';

const stages: {id: StageId; label: string; title: string; note: string; code?: string}[] = [
  {
    id: 'token', label: 'Token', title: '词法单元 · main.token',
    note: '关键字、标识符和整数分别成为 Token。空格与换行在词法阶段被忽略。',
    code: [
      "0:'int':\"int\"", "1:Ident:\"main\"", "2:'(':\"(\"",
      "3:')':\")\"", "4:'{':\"{\"", "5:'return':\"return\"",
      '6:IntConst:40', "7:'+':\"+\"", '8:IntConst:2',
      "9:';':\";\"", "10:'}':\"}\"",
    ].join('\n'),
  },
  {
    id: 'ast', label: 'AST', title: '返回表达式 · AST 结构',
    note: '树中保留 return 与加法的结构。评测的 -ast 接口输出语法检查结果 accept / reject。',
  },
  {
    id: 'ir', label: 'IR', title: '中间表示 · LLVM 风格示意',
    note: '加法写成一条指令，返回语句使用它的结果。实验中的 IR 由同学们设计实现。',
    code: ['define i32 @main() {', 'entry:', '  %sum = add i32 40, 2', '  ret i32 %sum', '}'].join('\n'),
  },
  {
    id: 'asm', label: '汇编', title: '目标代码 · 常量折叠后',
    note: '40 + 2 的结果在编译时就能算出。优化后，main 直接通过 a0 返回 42。',
    code: ['.text', '.globl main', 'main:', '    li    a0, 42', '    ret'].join('\n'),
  },
];

export default function CompilerShowcase(): ReactNode {
  const [stageId, setStageId] = useState<StageId>('asm');
  const instanceId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stage = stages.find(item => item.id === stageId)!;

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % stages.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index + stages.length - 1) % stages.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = stages.length - 1;
    else return;
    event.preventDefault();
    setStageId(stages[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className={styles.showcase} aria-label="ToyC 编译阶段示例">
      <div className={styles.windowBar}>
        <span className={styles.windowDots} aria-hidden="true"><i /><i /><i /></span>
        <span>同一段代码，四个阶段</span>
        <span className={styles.exampleBadge}>编译示例</span>
      </div>
      <div className={styles.workspace}>
        <div className={styles.source}>
          <div className={styles.fileBar}><span><i aria-hidden="true" />源程序</span><span>main.c</span></div>
          <div className={styles.sourceCode}>
            <span className={styles.lineNumbers} aria-hidden="true">1<br />2<br />3</span>
            <pre><code><span className={styles.keyword}>int</span>{' main() {\n  '}<span className={styles.keyword}>return</span>{' '}<span className={styles.number}>40</span>{' + '}<span className={styles.number}>2</span>{';\n}'}</code></pre>
          </div>
          <div className={styles.sourceFooter}><span>ToyC</span><span>整数 · 函数 · 返回语句</span></div>
        </div>
        <div className={styles.result}>
          <div className={styles.tabs} role="tablist" aria-label="编译阶段">
            {stages.map((item, index) => (
              <button
                key={item.id}
                ref={element => {tabRefs.current[index] = element;}}
                type="button"
                role="tab"
                id={instanceId + '-tab-' + item.id}
                aria-controls={instanceId + '-panel'}
                aria-selected={stageId === item.id}
                tabIndex={stageId === item.id ? 0 : -1}
                onClick={() => setStageId(item.id)}
                onKeyDown={event => navigateTabs(event, index)}>
                {item.label}
              </button>
            ))}
            <span className={styles.stageHint}>点击切换</span>
          </div>
          <div
            className={styles.resultPanel}
            role="tabpanel"
            tabIndex={0}
            id={instanceId + '-panel'}
            aria-labelledby={instanceId + '-tab-' + stageId}>
            <div className={styles.resultTitle}>{stage.title}</div>
            {stageId === 'ast' ? (
              <div className={styles.ast} role="img" aria-label="返回表达式的 AST：return 的子节点为加法，加法的两个操作数为 40 和 2">
                <span className={styles.astRoot}>return</span>
                <span className={styles.astStem} aria-hidden="true" />
                <span className={styles.astOperator}>+</span>
                <div className={styles.astBranches} aria-hidden="true" />
                <div className={styles.astLeaves}><span>40</span><span>2</span></div>
              </div>
            ) : (
              <pre className={styles.resultCode}><code>{stage.code}</code></pre>
            )}
          </div>
        </div>
      </div>
      <div className={styles.explanation}>
        <span className={styles.explanationDot} aria-hidden="true" />
        <p aria-live="polite">{stage.note}</p>
      </div>
    </div>
  );
}
