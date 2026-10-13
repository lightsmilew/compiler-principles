export const toycGrammar = `CompUnit    -> FuncDef+

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
            | 'return' [ Expr ] ';'

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
             | ID '(' [ Expr (',' Expr)* ] ')'`;
