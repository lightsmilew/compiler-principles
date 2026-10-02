---
sidebar_position: 5
sidebar_label: 资源下载
title: 资源下载
description: 汇总课程报告规范、ToyC 运行时库、SysY 语言规范及 QEMU 调试指南的下载链接
---

# 资源下载

本页汇总站点提供的全部课程附件，包含实验报告规范、ToyC 运行时静态库和竞赛参考文档。点击表格中的链接可获取对应文件。

## 课程实验资源

| 资源 | 格式 | 用途与下载链接 |
| --- | --- | --- |
| 武汉大学计算机学院课程设计报告书写规范 | DOC | [下载报告书写规范](pathname:///word/武汉大学计算机学院课程设计报告书写规范.doc)，完成全部实验后统一撰写报告时使用 |
| ToyC RV64GC 运行时库 `libtoyc.a` | 静态库 | [下载运行时库](pathname:///downloads/libtoyc.a)，本地链接编译器生成的汇编，提供 `getint`、`putint` 接口 |

报告要求见[实验报告与提交规范](../guide/report)，运行时函数与链接方式见[ToyC 运行时库](toyc-runtime)。本地调试时建议将 `libtoyc.a` 放在 `third_party/toyc/`；希冀评测平台会提供该库，无需将其上传到编译器项目仓库。

## 竞赛与调试文档

| 资源 | 格式 | 用途与下载链接 |
| --- | --- | --- |
| QEMU 本地调试指南 | PDF | [下载调试指南](pathname:///pdf/QEMU本地调试指南.pdf)，了解如何单步调试生成的 RISC-V 汇编 |
| SysY2022 语言定义 V1 | PDF | [下载语言定义](pathname:///pdf/SysY2022语言定义-V1.pdf)，查阅数据类型、语句和函数等语言规则 |
| SysY2022 运行时库 V1 | PDF | [下载运行时库说明](pathname:///pdf/SysY2022运行时库-V1.pdf)，查阅竞赛运行时函数的接口 |
| SysY2026 扩展规范 | PDF | [下载扩展规范](pathname:///pdf/Sysy2026.pdf)，查阅张量类型与矩阵乘法运算符等扩展 |

这些竞赛文档用于扩展学习，不增加 ToyC 课程实验要求。课程语言以[ToyC 词法与文法约定](grammar)为准；参加竞赛时，应以当年赛题发布的规范为准。下载后的文档可集中放在 `third_party/docs/`，便于离线查阅。
