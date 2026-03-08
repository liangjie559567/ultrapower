---
name: ccg-workflow
description: 启动 Claude-Codex 协作工作流，自动检测项目类型并执行相应流程
---

# CCG Workflow - Claude-Codex Collaboration Workflow

## Trigger
- `/ccg-workflow`
- User mentions "ccg workflow", "claude codex workflow"

## Description
启动 Claude-Codex 协作工作流，自动检测项目类型并执行相应流程。

## Workflow
1. 检测项目类型（新项目 vs 老项目）
2. 路由到对应工作流
3. 执行完整开发闭环

## Usage
```
/ccg-workflow [new|old]
```

参数可选，不提供时自动检测。
