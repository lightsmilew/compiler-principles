import type {ReactNode} from 'react';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
  icon: ReactNode;
};

/** 统一的线性图标：1.5px 描边，24x24 网格，颜色继承 currentColor */
const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const FeatureList: FeatureItem[] = [
  {
    title: '文档即唯一内容源',
    icon: (
      <svg {...iconProps}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h4" />
      </svg>
    ),
    description: (
      <>
        仓库 <code>docs/</code> 目录下的 Markdown 就是网站本身，页面由这些
        文件直接构建生成。改写 md 即改写网页，无需维护第二份内容。
      </>
    ),
  },
  {
    title: '七个实验逐级递进',
    icon: (
      <svg {...iconProps}>
        <path d="M4 19h16" />
        <path d="M6 19V11M11 19V6M16 19v-5M21 19V9" />
      </svg>
    ),
    description: (
      <>
        从词法分析到目标代码生成，每个实验的产物都是下一个实验的输入，
        最终拼装出一个可运行的 MiniC 编译器。
      </>
    ),
  },
  {
    title: '可验证的阶段性产物',
    icon: (
      <svg {...iconProps}>
        <path d="M9 12.5 11.5 15 15.5 9.5" />
        <path d="M12 3 5 6.5v5c0 4.2 2.9 7.9 7 9.5 4.1-1.6 7-5.3 7-9.5v-5z" />
      </svg>
    ),
    description: (
      <>
        每个阶段都提供独立的 dump 开关（Token 流、语法树、四元式、汇编），
        助教无需阅读源码即可验证正确性。
      </>
    ),
  },
];

function Feature({title, description, icon}: FeatureItem) {
  return (
    <div className={styles.card}>
      <span className={styles.iconBox}>{icon}</span>
      <Heading as="h3" className={styles.title}>
        {title}
      </Heading>
      <p className={styles.description}>{description}</p>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <div className={styles.grid}>
      {FeatureList.map((props) => (
        <Feature key={props.title} {...props} />
      ))}
    </div>
  );
}
