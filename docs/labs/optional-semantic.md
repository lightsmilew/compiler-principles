---
sidebar_position: 2.5
sidebar_label: 选做 · 语义分析
title: 选做 · 语义分析
description: 在 AST 与 LLVM IR 之间进行符号、作用域、类型和控制流约束检查
---

# 选做 · 语义分析

语义分析位于语法分析之后、LLVM IR 生成之前。它不改变 AST 的语法结构，而是为 AST 补充符号、类型和控制流信息，并拒绝语法正确但语义错误的程序。本部分为选做，不影响第一、第二和第三部分的基本提交要求。

```mermaid
flowchart LR
  T[Token] --> P[语法分析]
  P --> A[AST]
  A --> S[选做：语义分析]
  S --> I[LLVM IR 生成]
```

## 一、符号表与作用域

符号表至少记录名称、类别、类型、是否为常量、声明位置和 LLVM IR 对应值：

```text
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

进入 `Block` 时压入新作用域，离开时弹出。查找名称时从当前作用域向外查找；同一作用域重复声明应报错，内层作用域可以遮蔽外层变量。

## 二、检查内容

- `main` 必须是无参数、返回 `int` 的函数；
- 函数名在全局唯一，调用目标存在且调用位置满足声明顺序；
- 变量和形参使用前必须声明；
- `const int` 必须有初始化表达式，常量不能作为赋值左值；
- `int`、`void` 返回值与 return 语句匹配；
- void 函数调用不能作为条件或赋值右值；
- `break`、`continue` 只能出现在 while 循环中；
- 二元运算两侧为 `int`，比较和逻辑表达式结果为 `int`；
- 除数为编译期常量时，不能为零；
- int 函数的所有可能路径都必须返回值。

## 三、AST 标注

语义分析通过后，可以给表达式节点附加类型和符号引用，给函数调用节点附加目标函数，给变量节点附加符号表项：

```text
Variable("x") -> symbol=x, type=int, llvm_value=%x
Call("add", args) -> function=add, return_type=int
Binary("<", lhs, rhs) -> type=int, is_boolean=true
```

这样 LLVM IR 生成器不需要再次猜测名称含义，只负责根据已验证的 AST 产生 `load`、`store`、`icmp`、`call` 和分支指令。

## 四、遍历伪代码

```text
analyze_function(function):
    declare_function_signature(function)
    enter_scope()
    declare_parameters(function.params)
    loop_depth = 0
    analyze_block(function.body)
    require_return_on_all_paths(function)
    leave_scope()

analyze_decl(decl):
    for item in decl.items:
        reject_duplicate(item.name)
        if decl.is_const: require item.initializer
        symbol = declare(item.name, decl.type, decl.is_const)
        if item.initializer exists:
            check_type(analyze_expr(item.initializer), decl.type)

analyze_stmt(Break | Continue):
    require loop_depth > 0
```

选做实现应输出错误位置、错误类别和简短原因，并在报告中给出至少一个合法程序和三个语义错误程序。
