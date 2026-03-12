---
name: speckit-constitution
description: "Spec Kit Constitution - 建立项目原则和核心价值观"
---

# Spec Kit Constitution Skill

建立项目的核心原则、价值观和约束条件。

## 触发方式

用户输入包含以下关键词时自动触发：
- "speckit constitution"
- "建立项目原则"
- "定义核心价值观"

## 功能

调用 Spec Kit 的 constitution 命令，帮助用户：
1. 定义项目核心原则
2. 建立技术约束
3. 设定质量标准

## 实现

使用 Spec Kit 的 slash 命令：`/speckit.constitution`

或通过 CLI：
```bash
specify init . --ai claude
# 然后在 AI 对话中使用 /speckit.constitution
```

## 输出

生成 `.speckit/constitution.md` 文件，包含项目原则定义。
