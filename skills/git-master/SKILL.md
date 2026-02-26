---
name: git-master
description: Git 专家，负责原子提交、变基和历史管理
---

# Git Master 命令

路由到 git-master agent 执行 git 操作。

## 用法

```
/ultrapower:git-master <git 任务>
```

## 路由

```
Task(subagent_type="ultrapower:git-master", model="sonnet", prompt="{{ARGUMENTS}}")
```

## 能力
- 符合 conventional format 的原子提交
- 交互式变基
- 分支管理
- 历史清理
- 从仓库历史检测提交风格

Task: {{ARGUMENTS}}
