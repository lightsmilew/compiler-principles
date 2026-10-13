---
sidebar_position: 2.5
sidebar_label: 选做 · 语义分析
title: 选做 · 语义分析
description: 在 AST 与 LLVM IR 之间进行符号、作用域、类型和控制流约束检查
---

# 选做 · 语义分析

语义分析位于语法分析之后、IR 生成之前。它不改变 AST 的语法结构，而是为 AST 补充符号、类型和控制流信息，并拒绝"语法正确但语义错误"的程序。本部分为选做。

```mermaid
flowchart TB
  T[Token] --> P[语法分析]
  P --> A[AST]
  A --> S[选做：语义分析]
  S --> I[LLVM IR 生成]
```

:::info[基本原理]
语法分析验证程序是否符合文法，语义分析进一步验证名称、类型和控制流约束，拒绝语法正确但语义不合法的程序。
:::

## 一、符号表与作用域

符号表至少记录名称、类别、类型、是否为常量、声明位置和 IR 对应值：

```
Symbol {
    name
    kind: variable | constant | parameter | function
    type: int | void
    is_const
    declaration_location
    llvm_value
}

Scope {
    symbols: Map<string, Symbol>
    parent: Scope?
}
```

进入语句块时压入新作用域，离开时弹出；查找名称时从内向外逐层查找。内层作用域可以遮蔽外层同名变量：

```mermaid
flowchart TD
  G["全局作用域：main, add"] --> F["函数作用域：参数 n"]
  F --> B1["块作用域：x = 1"]
  B1 --> B2["内层块作用域：x = 2（遮蔽外层 x）"]
```

离开内层块后，`x` 又指回外层；同一作用域内重复声明同名变量则应报错。

## 二、检查内容

语义分析需要报告的典型错误：

| 类别 | 检查内容 |
| --- | --- |
| 程序结构 | `main` 必须是无参数、返回 `int` 的函数 |
| 函数 | 函数名全局唯一；调用目标存在；调用位置满足声明顺序 |
| 声明 | 变量和形参使用前必须声明；同一作用域不能重名 |
| 常量 | `const int` 必须有初始化表达式；常量不能作为赋值左值 |
| 类型 | `int` / `void` 返回值与 return 匹配；void 调用不能作为条件或右值 |
| 控制流 | `break`、`continue` 只能出现在 while 循环中 |
| 表达式 | 二元运算两侧为 `int`；比较和逻辑表达式结果为 `int`（0/1） |
| 除零 | 除数为编译期常量时不能为零 |
| 返回值 | `int` 函数的所有可能路径都必须返回值 |

## 三、AST 标注

语义分析通过后，可以给节点附加类型和符号引用，让 IR 生成器不必再"猜"名字含义：

```
Variable("x")        -> symbol = x,  type = int,  llvm_value = %x
Call("add", args)    -> function = add,  return_type = int
Binary("<", lhs, rhs)-> type = int,  is_boolean = true
```

## 四、遍历伪代码

记号约定：`=` 表示赋值，`//` 后是注释，注释中英文结合。

**算法 1 · 函数体语义分析（Analyze Function）**

**输入（Input）：** 函数 AST 节点 `fn`。
**输出（Output）：** 完成标注的函数，或报告语义错误。

```
 1: analyzeFunction(fn):
 2:     declareFunctionSignature(fn);              // 登记函数名与签名，检查 main 约定
 3:     enterScope();                               // 进入函数作用域
 4:     for each param p in fn.params do
 5:         if type(p) != int then error("参数只能为 int"); end if
 6:         declare(p.name, kind = parameter, type = int);
 7:     end for
 8:     ctx.loopDepth = 0;  ctx.currentFunction = fn;
 9:     for s in fn.body.statements do analyzeStmt(s); end for  // 最外层函数体与形参共用作用域
10:     if fn.returnType == int and not returnsOnAllPaths(fn.body) then
11:         error("int 函数必须在所有路径上返回值");       // 见算法 5
12:     end if
13:     leaveScope();
```

函数按源文件顺序登记并分析；先登记当前函数签名再分析其体，以支持自身递归。不能提前登记全部后续函数来放行前向调用。调用和变量引用都查询最近的名字绑定，再检查符号种类。

**算法 2 · 作用域栈的压入、声明与查找（Scope Stack）**

**输入（Input）：** 当前作用域栈 `scopes`，名称 `name`。
**输出（Output）：** 命中的符号，或报告"未声明 / 重复声明"。

```
 1: enterScope():  scopes.push({});               // 压入新作用域
 2: leaveScope():  scopes.pop();                  // 弹出
 3:
 4: declare(name, sym):
 5:     if scopes.top contains name then
 6:         error("同一作用域重复声明: " + name);     // 同层不能重名
 7:     end if
 8:     scopes.top[name] = sym;
 9:     return sym;
10:
11: lookup(name):
12:     for scope in reversed(scopes) do              // 由内向外逐层查找
13:         if name in scope then return scope[name]; end if
14:     end for
15:     error("使用了未声明的标识符: " + name);        // 未找到
```

**算法 3 · 变量与常量声明检查（Declaration Check）**

**输入（Input）：** 声明节点 `decl`。
**输出（Output）：** 已登记并完成类型检查的符号。

```
 1: analyzeDecl(decl):
 2:     if decl.isConst and decl.initializer == none then
 3:         error("局部 const 必须有初始化表达式");
 4:     end if
 5:     sym = declare(decl.name, { kind: variable, type: int, isConst: decl.isConst });
 6:     if decl.initializer != none then
 7:         checkType(analyzeExpr(decl.initializer), int);
 8:     end if
```

**算法 4 · 语句与表达式检查（Statement & Expression Check）**

**输入（Input）：** 语句或表达式节点。
**输出（Output）：** 标注后的类型信息，或报告语义错误。

```
 1: analyzeStmt(stmt):
 2:     match stmt:
 3:         Decl(d):         analyzeDecl(d);
 4:         Empty:           return;
 5:         Block(b):        enterScope();  for s in b do analyzeStmt(s); end for  leaveScope();
 6:         Assign(lhs, rhs):
 7:             sym = requireDeclared(lhs.name); require(sym.kind in {variable, parameter});
 8:             if sym.isConst then error("常量不能作为赋值左值"); end if
 9:             checkType(analyzeExpr(rhs), sym.type);
10:         If(c, t, e):
11:             checkCond(c);  analyzeStmt(t);
12:             if e != none then analyzeStmt(e); end if
13:         While(c, body):
14:             checkCond(c);
15:             ctx.loopDepth++;                        // 进入循环，深度 +1
16:             analyzeStmt(body);
17:             ctx.loopDepth--;                        // 离开循环，深度 -1
18:         Break | Continue:
19:             if ctx.loopDepth == 0 then error("break/continue 只能出现在循环中"); end if
20:         Return(v):
21:             if ctx.currentFunction.returnType == void then require(v == none);
22:             else require(v != none); checkType(analyzeExpr(v), int); end if
23:         ExprStmt(e):     analyzeExpr(e);
24:     end match
25:
26: analyzeExpr(e):
27:     match e:
28:         Call(name, args):
29:             fn = lookup(name);
30:             require(fn.kind == function);
31:             if fn == none then error("调用未声明的函数: " + name); end if
32:             require(length(args) == length(fn.params));  // 参数数量必须匹配
33:             for a in args do checkType(analyzeExpr(a), int); end for
34:             return fn.returnType;
35:         Number(n):       return int;
36:         Variable(n):     sym = requireDeclared(n); require(sym.kind in {variable, parameter}); return sym.type;
37:         Binary/Unary:    both sides must be int;  return int;   // 比较/逻辑结果也是 int(0/1)
38:     end match
```

**算法 5 · 所有路径返回值检查（Return-on-All-Paths）**

下面是保守的结构检查示意，不是完整的控制流证明。它可能拒绝 `while (1) { return 1; }` 等合法写法；完整实现应构造 CFG，处理可证明的恒真条件，区分 `return`、`break`、`continue` 和可达的函数出口，并避免把不可达的 `return` 算作有效返回。

**输入（Input）：** 语句节点 `node`。
**输出（Output）：** 布尔值，表示该节点是否在所有路径上返回。

```
 1: returnsOnAllPaths(node):
 2:     match node:
 3:         Return(_):    return true;                     // 直接 return
 4:         Block(stmts):
 5:             for s in stmts do
 6:                 if returnsOnAllPaths(s) then return true; end if
 7:             end for
 8:             return false;
 9:         If(c, t, e):
10:             if e == none then return false; end if      // 没有 else，则可能不返回
11:             return returnsOnAllPaths(t) and returnsOnAllPaths(e);
12:         While(_, _):  return false;                     // 循环可能一次都不执行
13:         others:       return false;
14:     end match
```
