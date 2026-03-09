---
name: ccg-workflow
description: Claude-Codex 协作工作流 - 自动检测项目类型并执行完整开发闭环
skill: ccg-workflow
---

# CCG Workflow

启动 Claude-Codex 协作工作流。

## Usage

```bash
/ccg-workflow [new | old]
```

## Parameters

* `new` - 强制使用新项目流程

* `old` - 强制使用老项目流程

* 不提供参数时自动检测

## Workflow

### 新项目流程

1. 需求分析 (Claude)
2. 技术设计 (Claude)
3. 代码开发 (Codex)
4. 优化循环 (Claude ↔ Codex)
5. 测试循环 (Claude ↔ Codex)

### 老项目流程

1. 读取现状 (Codex)
2. 生成修改计划 (Claude)
3. 模块拆分 (Codex)
4. 逐模块闭环 (Claude ↔ Codex)
