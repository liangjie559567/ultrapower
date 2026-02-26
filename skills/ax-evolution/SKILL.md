---
name: ax-evolution
description: "/ax-evolution — Axiom 进化引擎触发：手动触发知识收割、模式检测和反思"
---

# Axiom 进化引擎触发 Skill

本 skill 是进化引擎的统一入口，提供知识管理的所有操作。

**开始时宣告：** "I'm using the ax-evolution skill to trigger the evolution engine."

## 命令

### /ax-evolution evolve
处理学习队列，更新知识库和模式库。

等同于 `/ax-evolve`，调用 axiom-evolution-engine agent。

### /ax-evolution reflect
触发反思引擎，生成会话反思报告。

等同于 `/ax-reflect`，调用 analyst agent 进行反思分析。

### /ax-evolution knowledge [query]
查询知识库。

```
搜索 .omc/axiom/evolution/knowledge_base.md
返回匹配的知识条目摘要
```

### /ax-evolution patterns [query]
查询模式库。

```
搜索 .omc/axiom/evolution/pattern_library.md
返回匹配的代码模式和模板
```

### /ax-evolution add [content]
手动添加知识到学习队列。

```yaml
learning_queue.add:
  source_type: manual
  priority: P2
  metadata:
    content: "[用户提供的知识]"
    added_by: user
```

### /ax-evolution stats
显示进化引擎统计数据。

输出：
- 知识库条目数（按分类）
- 模式库条目数（按状态）
- 学习队列待处理数
- 最近进化时间
- 知识平均置信度
