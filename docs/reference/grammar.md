---
sidebar_position: 1
sidebar_label: MiniC 词法与文法约定
title: MiniC 词法与文法约定
description: 贯穿全部实验的公共语言定义：记号类别、正则描述与上下文无关文法
---

# MiniC 词法与文法约定

全部实验共用同一门语言 **MiniC**。本节给出的定义是各实验测试用例的唯一依据，
如果你的实现与本定义冲突，一律以本定义为准。

## 一、程序的词法构成

### 1. 关键字

```text
int  float  void  if  else  while  for  break  continue
return  const  struct  sizeof  printf
```

### 2. 标识符与常量

| 类别 | 正则描述 | 示例 |
| --- | --- | --- |
| 标识符 | `[A-Za-z_][A-Za-z0-9_]*` | `main`, `_tmp1`, `count2` |
| 十进制整数 | `[1-9][0-9]*\|0` | `0`, `42`, `1000` |
| 八进制整数 | `0[0-7]+` | `0755` |
| 十六进制整数 | `0[xX][0-9a-fA-F]+` | `0xFF`, `0x1a` |
| 浮点数 | `[0-9]+\.[0-9]+([eE][+-]?[0-9]+)?` | `3.14`, `1.0e-5` |
| 字符串字面量 | `"([^"\\\n]\|\\.)*"` | `"hello\n"` |
| 字符字面量 | `'([^'\\\n]\|\\.)'` | `'a'`, `'\n'` |

### 3. 运算符与界符

```text
+  -  *  /  %  =  ==  !=  <  <=  >  >=  &&  ||  !  &  |  ^  ~
++  --  +=  -=  *=  /=  %=
(  )  [  ]  {  }  ;  ,  .  ->  :  ?
```

### 4. 注释与空白

- 单行注释：`//` 到行尾；
- 块注释：`/* ... */`，**不允许嵌套**；
- 空白：空格、制表符、换行，均为分隔符。

:::warning 最长匹配原则
当多条规则都能匹配时，取**最长**的匹配；长度相同则取**先定义**的规则。

例：输入 `a+++b` 应被切分为 `a` `++` `+` `b`，而不是 `a` `+` `++` `b`。
:::

## 二、上下文无关文法

下面给出 MiniC 的参考文法，采用 EBNF 书写。其中 `{ X }` 表示重复零次或多次，
`[ X ]` 表示可选。

```text
Program      -> { GlobalDecl }

GlobalDecl   -> FuncDef | VarDecl

FuncDef      -> Type Identifier '(' [ ParamList ] ')' Block

ParamList    -> Param { ',' Param }
Param        -> Type Identifier [ '[' ']' ]

VarDecl      -> Type InitDecl { ',' InitDecl } ';'
InitDecl     -> Identifier [ '[' Integer ']' ] [ '=' Initializer ]

Type         -> 'int' | 'float' | 'void'

Block        -> '{' { BlockItem } '}'
BlockItem    -> VarDecl | Stmt

Stmt         -> AssignStmt ';'
              | ExprStmt ';'
              | Block
              | IfStmt
              | WhileStmt
              | ForStmt
              | BreakStmt ';'
              | ContinueStmt ';'
              | ReturnStmt ';'

IfStmt       -> 'if' '(' Expr ')' Stmt [ 'else' Stmt ]
WhileStmt    -> 'while' '(' Expr ')' Stmt
ForStmt      -> 'for' '(' [ Expr ] ';' [ Expr ] ';' [ Expr ] ')' Stmt
ReturnStmt   -> 'return' [ Expr ]

Expr         -> AssignExpr
AssignExpr   -> OrExpr [ '=' AssignExpr ]
OrExpr       -> AndExpr { '||' AndExpr }
AndExpr      -> EqExpr  { '&&' EqExpr }
EqExpr       -> RelExpr { ( '==' | '!=' ) RelExpr }
RelExpr      -> AddExpr { ( '<' | '<=' | '>' | '>=' ) AddExpr }
AddExpr      -> MulExpr { ( '+' | '-' ) MulExpr }
MulExpr      -> UnaryExpr { ( '*' | '/' | '%' ) UnaryExpr }
UnaryExpr    -> ( '!' | '-' | '+' ) UnaryExpr | PostfixExpr
PostfixExpr  -> PrimaryExpr { '[' Expr ']' | '(' [ ArgList ] ')' | '++' | '--' }
PrimaryExpr  -> Identifier | Integer | Float | String | Char
              | '(' Expr ')'
```

## 三、优先级与结合性

| 优先级 | 运算符 | 结合性 |
| --- | --- | --- |
| 1（最高） | `()` `[]` `++` `--`（后缀） | 左 |
| 2 | `!` `-` `+` `~`（前缀） | 右 |
| 3 | `*` `/` `%` | 左 |
| 4 | `+` `-` | 左 |
| 5 | `<` `<=` `>` `>=` | 左 |
| 6 | `==` `!=` | 左 |
| 7 | `&&` | 左 |
| 8 | `\|\|` | 左 |
| 9（最低） | `=`（赋值） | 右 |

## 四、First 集与 Follow 集速查

`Expr` 派生式对应的 FIRST 集（用于实验二的预测分析表）：

```text
FIRST(Expr)       = FIRST(OrExpr)
FIRST(OrExpr)     = FIRST(AndExpr)
FIRST(AndExpr)    = FIRST(EqExpr)
FIRST(EqExpr)     = FIRST(RelExpr)
FIRST(RelExpr)    = FIRST(AddExpr)
FIRST(AddExpr)    = FIRST(MulExpr)
FIRST(MulExpr)    = FIRST(UnaryExpr)
FIRST(UnaryExpr)  = { '!', '-', '+', '(', Identifier, Integer, Float, String, Char }
```

对于含可选分支的非终结符，例如 `IfStmt -> 'if' '(' Expr ')' Stmt [ 'else' Stmt ]`：

```text
FIRST(IfStmt) = { 'if' }
FOLLOW(Stmt)  ⊇ { 'else', '}', 'if', 'while', 'for', 'return', 'break', 'continue', ';' }
```

## 五、约定产物格式

为便于统一评测，各阶段的标准输出格式约定如下：

### Token 流（实验一）

```text
<INT, 1, 1, "int">
<ID, 1, 5, "main">
<LPAREN, 1, 9, "(">
...
```

即 `<类别, 行号, 列号, "字面量">`，每行一个。

### 四元式（实验五）

```text
(op, arg1, arg2, result)
```

例：`a = b + c * d` 生成

```text
(*, c, d, t1)
(+, b, t1, t2)
(=, t2, _, a)
```

## 六、参考实现

课程组提供的参考实现在仓库 `ref/` 目录中，仅包含各阶段的输出样例，
**不含源代码**，可用于比对自己的输出格式。
