---
name: ax-knowledge
description: "/ax-knowledge — Axiom 知识查询：搜索知识库和模式库，返回相关条目"
---

# Axiom 知识查询

本 skill 提供对 Axiom 知识库和模式库的统一查询接口。

**开始时宣告：** "I'm using the ax-knowledge skill to query the knowledge base."

## 查询类型

### 知识条目查询（k-xxx）

搜索 `.omc/axiom/evolution/knowledge_base.md` 索引，返回匹配的知识条目。

**触发词：** `ax-knowledge [--filter <keyword>] [--category <category>] [关键词]`

**参数说明：**
- `--filter <keyword>`：按关键词过滤，Title 或 Category 包含关键词（大小写不敏感，最多 256 字符）
- `--category <category>`：按分类精确过滤，Category 字段完整匹配（大小写不敏感）
- 无参数：返回全量知识条目

### 模式库查询

搜索 `.omc/axiom/evolution/pattern_library.md`，返回匹配的代码模式。

**触发词：** `ax-pattern [关键词]`

## 执行步骤

### Step 1: 解析查询意图

判断用户查询类型：
- 包含 "pattern"、"模式"、"代码模式" → 模式库查询
- 其他 → 知识条目查询
- 两者都包含 → 并行查询两个库

解析过滤参数：
- 检查是否含 `--filter <keyword>`，提取关键词（超出 256 字符时返回错误提示）
- 检查是否含 `--category <category>`，提取分类名
- 两个参数均无时，执行全量查询

### Step 2: 搜索索引

**知识库查询（无参数 — 全量返回）：**
调用 `KnowledgeIndexManager.loadIndex()`，返回全量条目。

**知识库查询（--filter）：**
调用 `KnowledgeIndexManager.filterByKeyword(keyword)`：
- Title 或 Category 包含关键词（includes，大小写不敏感）

**知识库查询（--category）：**
调用 `KnowledgeIndexManager.filterByCategory(category)`：
- Category 字段精确匹配（大小写不敏感）

**模式库查询：**
读取 `.omc/axiom/evolution/pattern_library.md`，按关键词匹配：
- 模式名称
- 触发条件
- 适用场景

### Step 3: 读取匹配条目

对每个匹配结果，读取完整内容：
- 知识条目：`.omc/axiom/evolution/k-[slug].md`
- 模式条目：`.omc/axiom/evolution/patterns/[name].md`

### Step 4: 格式化输出

```markdown
## 知识查询结果：[关键词/参数]

### 知识条目（X 条）

#### [条目标题]
- **ID**: k-[slug]
- **标签**: [标签列表]
- **核心洞见**: [一句话摘要]
- **适用场景**: [触发条件]
[查看完整内容: .omc/axiom/evolution/k-[slug].md]

### 代码模式（X 条）

#### [模式名称]
- **触发条件**: [何时使用]
- **解决方案**: [简要描述]
[查看完整内容: .omc/axiom/evolution/patterns/[name].md]

---
显示 X/Y 条，使用无参数调用查看全部
```

### Step 5: 无结果处理

若无匹配结果：
```
未找到与 "[关键词]" 相关的知识条目。

建议：
- 尝试更宽泛的关键词
- 运行 /ultrapower:learner 提取当前会话的知识
- 查看完整知识库：.omc/axiom/evolution/knowledge_base.md
```

## 知识库文件结构

```
.omc/axiom/evolution/
├── knowledge_base.md      # 索引文件
├── pattern_library.md     # 模式索引
├── k-[slug].md            # 知识条目
└── patterns/
    └── [name].md          # 模式条目
```

## 与 learner skill 的关系

- `ax-knowledge`：查询已有知识
- `/ultrapower:learner`：从当前会话提取新知识并写入知识库
