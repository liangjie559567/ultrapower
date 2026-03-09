<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-03-02 -->

# skills/ax-knowledge/

## Purpose

Axiom 知识库管理 skill。搜索知识库和模式库，返回相关条目，支持关键词过滤和分类精确匹配。

## Key Files

| File | Description |
| ------ | ------------- |
| `SKILL.md` | Skill 定义文件，包含触发条件、执行工作流和使用说明 |

## For AI Agents

### 参数解析指引

`ax-knowledge` 支持以下调用形式：

```
ax-knowledge                          # 全量返回所有知识条目
ax-knowledge --filter typescript      # 按关键词过滤（title 或 category 包含）
ax-knowledge --category architecture  # 按分类精确匹配
```

**参数解析规则：**
1. 检测 `--filter <keyword>`：提取关键词，调用 `KnowledgeIndexManager.filterByKeyword(keyword)`
   - 关键词长度 > 256 字符时，返回错误提示而非抛出异常
   - 匹配规则：`title.includes(kw) | | category.includes(kw)`（toLowerCase 后比较）
1. 检测 `--category <category>`：提取分类名，调用 `KnowledgeIndexManager.filterByCategory(category)`
   - 匹配规则：`category === cat`（toLowerCase 后比较，精确匹配）
1. 无参数：调用 `KnowledgeIndexManager.loadIndex()`，返回全量

**输出统计行（必须包含）：**
```
显示 X/Y 条，使用无参数调用查看全部
```
其中 X 为过滤后条目数，Y 为知识库总条目数。

### 修改此目录时

* 编辑 `SKILL.md` 修改 skill 行为

* 触发关键词变更需同步更新 `src/features/magic-keywords/`

* 参见 `skills/writing-skills/` 了解 skill 编写规范

## Dependencies

### Internal

* `src/hooks/learner/index-manager.ts` — `filterByKeyword()` / `filterByCategory()` / `loadIndex()` 实现

* `src/skills/` — Skill TypeScript 运行时注册

* `src/features/magic-keywords/` — 关键词触发系统

<!-- MANUAL: -->
