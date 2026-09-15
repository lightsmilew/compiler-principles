---
sidebar_position: 1
sidebar_label: ToyC 词法与文法约定
title: ToyC 词法与文法约定
description: ToyC 语言的词法、上下文无关文法与语义约束
---

# ToyC 词法与文法约定

全部实验共用同一门语言 **ToyC**。本节给出的定义是各实验测试用例的唯一依据。

## 一、上下文无关文法

下面使用 EBNF 记号：`*` 表示重复零次或多次，`?` 表示可选。

```text
CompUnit    -> FuncDef+

FuncDef     -> ('int' | 'void') ID '(' [ Param (',' Param)* ] ')' Block
Param       -> 'int' ID

Block       -> '{' BlockItem* '}'
BlockItem   -> Decl | Stmt

Decl        -> VarDecl | ConstDecl
VarDecl     -> 'int' VarDef (',' VarDef)* ';'
VarDef      -> ID [ '=' Expr ]
ConstDecl   -> 'const' 'int' ConstDef (',' ConstDef)* ';'
ConstDef    -> ID '=' Expr

Stmt        -> Block
            | ';'
            | Expr ';'
            | ID '=' Expr ';'
            | 'if' '(' Expr ')' Stmt [ 'else' Stmt ]
            | 'while' '(' Expr ')' Stmt
            | 'break' ';'
            | 'continue' ';'
            | 'return' Expr ';'

Expr        -> LOrExpr
LOrExpr     -> LAndExpr | LOrExpr '||' LAndExpr
LAndExpr    -> RelExpr | LAndExpr '&&' RelExpr
RelExpr     -> AddExpr
            | RelExpr ('<' | '>' | '<=' | '>=' | '==' | '!=') AddExpr
AddExpr     -> MulExpr
            | AddExpr ('+' | '-') MulExpr
MulExpr     -> UnaryExpr
            | MulExpr ('*' | '/' | '%') UnaryExpr
UnaryExpr   -> PrimaryExpr | ('+' | '-' | '!') UnaryExpr
PrimaryExpr -> ID
             | NUMBER
             | '(' Expr ')'
             | ID '(' [ Expr (',' Expr)* ] ')'
```

库函数调用不需要单独出现在文法中。`getint` 和 `putint` 仍按普通 `ID` 解析，
由语义分析预置函数符号，由目标代码生成阶段生成外部调用。

## 二、终结符特征

### 关键字

```text
int  void  const  if  else  while  break  continue  return
```

### 标识符

终结符 `ID` 的正则表达式为：

```text
[_A-Za-z][_A-Za-z0-9]*
```

### 整数

终结符 `NUMBER` 识别十进制整数常量：

```text
-?(0|[1-9][0-9]*)
```

推荐在词法阶段将负号识别为 `-` 运算符，由 `UnaryExpr` 处理；如果将负号并入 `NUMBER`，必须在报告中说明并保持 Token 输出一致。

### 运算符与界符

```text
+  -  *  /  %  =  ==  !=  <  >  <=  >=  &&  ||  !
(  )  {  }  ;  ,
```

### 空白和注释

空白字符和注释均被忽略。空白包括空格、制表符和换行符；单行注释以 `//` 开始，
到最近换行符前结束；多行注释以 `/*` 开始，以最近的 `*/` 结束。

## 三、语义约束

### 程序结构

程序必须包含一个名为 `main`、参数列表为空、返回类型为 `int` 的函数作为入口点。

### 函数

函数只能声明在全局作用域中且名称唯一，不能声明在函数体内。函数支持若干 `int`
类型参数，返回值可以是 `int` 或 `void`。函数不能作为值存储、传递或运算；函数调用
必须写在被调函数声明之后，但支持函数内部调用自身。

`int` 函数必须在每条可能执行路径上返回一个 `int` 值；`void` 函数可以没有 return，
但如果包含 return，则不能有返回值。

### 变量与常量声明

变量声明支持单个或多个声明项，初始化表达式是可选的：

```c
int a;
int b = 1, c, d = a + b;
```

没有初始化表达式的变量在语义上获得默认值 `0`，或者由实现规定为未初始化状态；实现必须在报告中明确选择，并在测试中保持一致。变量声明只能出现在语句块中，每个变量名在同一作用域内只能声明一次。

常量声明必须带初始化表达式，且声明后不能被赋值：

```c
const int limit = 10, step = 2;
```

变量和常量的使用必须发生在声明之后。语句块创建新的作用域，函数形参在函数体内可见，内层作用域可以屏蔽外层变量名，但不能重复声明同一作用域中的名字。

### 语句与控制流

空语句、表达式语句、赋值、声明、if-else、while、break、continue 和 return 的语义遵循 C 语言习惯。没有返回值的函数调用不能作为 if/while 条件或赋值右值；`break` 和 `continue` 只能出现在循环中。

### 表达式

逻辑与和逻辑或必须短路求值；非零值为真、零值为假；除数不能为零。常量不能作为赋值语句左值。

## 四、运算符优先级与结合性

| 优先级 | 运算符 | 结合性 |
| --- | --- | --- |
| 1（最高） | 函数调用、括号 | 左 |
| 2 | `!` `+` `-`（一元） | 右 |
| 3 | `*` `/` `%` | 左 |
| 4 | `+` `-` | 左 |
| 5 | `<` `>` `<=` `>=` | 左 |
| 6 | `==` `!=` | 左 |
| 7 | `&&` | 左 |
| 8（最低） | `||` | 左 |

## 五、标准输出格式

### Token 流

```text
<INT, 1, 1, "int">
<ID, 1, 5, "main">
<LPAREN, 1, 9, "(">
```

每行一个 Token，格式为 `<类别, 行号, 列号, "字面量">`。

### 三地址码

```text
(op, arg1, arg2, result)
```

例如 `a = b + c * d`：

```text
(*, c, d, t0)
(+, b, t0, t1)
(=, t1, _, a)
```
