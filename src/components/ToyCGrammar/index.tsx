import type {ReactNode} from 'react';
import CodeBlock from '@theme/CodeBlock';
import {toycGrammar} from '@site/src/data/toycGrammar';

export default function ToyCGrammar(): ReactNode {
  return <CodeBlock language="text" title="ToyC 文法">{toycGrammar}</CodeBlock>;
}
