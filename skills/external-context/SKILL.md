---
name: external-context
description: 调用并行 document-specialist agent 进行外部网络搜索和文档查询
argument-hint: <搜索查询或主题>
---

# External Context Skill

调用并行 document-specialist agent 搜索外部文档、参考资料和上下文。

## 概述

External Context 将查询分解为并行网络搜索切面，每个切面由独立的 document-specialist agent 处理：

1. **分解** —— 将查询拆分为 2-5 个独立搜索切面
2. **并行搜索** —— 为每个切面派生 document-specialist agent
3. **综合** —— 将发现汇总为结构化上下文

## 用法

```
/ultrapower:external-context <主题或问题>
```

### 示例

```
/ultrapower:external-context What are the best practices for JWT token rotation in Node.js?
/ultrapower:external-context Compare Prisma vs Drizzle ORM for PostgreSQL
/ultrapower:external-context Latest React Server Components patterns and conventions
```

## 协议

### 切面分解

给定查询，分解为 2-5 个独立搜索切面：

```markdown
## Search Decomposition

**Query:** <原始查询>

### Facet 1: <切面名称>
- **Search focus:** 搜索内容
- **Sources:** 官方文档、GitHub、博客等

### Facet 2: <切面名称>
...
```

### 并行 Agent 调用

通过 Task 工具并行触发独立切面：

```
Task(subagent_type="ultrapower:document-specialist", model="sonnet", prompt="Search for: <facet 1 description>. Use WebSearch and WebFetch to find official documentation and examples. Cite all sources with URLs.")

Task(subagent_type="ultrapower:document-specialist", model="sonnet", prompt="Search for: <facet 2 description>. Use WebSearch and WebFetch to find official documentation and examples. Cite all sources with URLs.")
```

### 综合

所有 agent 完成后，综合发现：

```markdown
## External Context: <查询>

### Key Findings
1. **<发现>** - Source: [title](url)
2. **<发现>** - Source: [title](url)

### Detailed Results

#### Facet 1: <名称>
<汇总发现及引用>

#### Facet 2: <名称>
<汇总发现及引用>

### Sources
- [Source 1](url)
- [Source 2](url)
```

## 配置

- 最多 5 个并行 document-specialist agent
- 每个 agent 使用 WebSearch 和 WebFetch 工具
- 无魔法关键词触发 —— 仅支持显式调用

## 路由触发

并行外部搜索完成、资料汇总后调用 `next-step-router`：
- current_skill: "external-context"
- stage: "external_context_gathered"
- output_summary: 搜索切面数、收集的文档数、关键参考资料摘要