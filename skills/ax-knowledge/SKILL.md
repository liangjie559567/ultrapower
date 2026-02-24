---
name: ax-knowledge
description: "/ax-knowledge — Axiom 知识查询：搜索知识库和模式库，返回相关条目"
triggers: ["ax-knowledge", "knowledge query", "pattern query", "知识查询", "模式查询"]
---

# Axiom 知识查询

本 skill 提供对 Axiom 知识库和模式库的统一查询接口。

**开始时宣告：** "I'm using the ax-knowledge skill to query the knowledge base."

## 查询类型

### 知识条目查询（k-xxx）

搜索 `.omc/knowledge/knowledge_base.md` 索引，返回匹配的知识条目。

**触发词：** `ax-knowledge [关键词]`

### 模式库查询

搜索 `.omc/knowledge/pattern_library.md`，返回匹配的代码模式。

**触发词：** `ax-pattern [关键词]`

## 执行步骤

### Step 1: 解析查询意图

判断用户查询类型：
- 包含 "pattern"、"模式"、"代码模式" → 模式库查询
- 其他 → 知识条目查询
- 两者都包含 → 并行查询两个库

### Step 2: 搜索索引

**知识库查询：**
读取 `.omc/knowledge/knowledge_base.md`，按关键词匹配：
- 标题匹配（权重高）
- 标签匹配（权重中）
- 描述匹配（权重低）

**模式库查询：**
读取 `.omc/knowledge/pattern_library.md`，按关键词匹配：
- 模式名称
- 触发条件
- 适用场景

### Step 3: 读取匹配条目

对每个匹配结果，读取完整内容：
- 知识条目：`.omc/knowledge/k-[slug].md`
- 模式条目：`.omc/knowledge/patterns/[name].md`

### Step 4: 格式化输出

```markdown
## 知识查询结果：[关键词]

### 知识条目（X 条）

#### [条目标题]
- **ID**: k-[slug]
- **标签**: [标签列表]
- **核心洞见**: [一句话摘要]
- **适用场景**: [触发条件]
[查看完整内容: .omc/knowledge/k-[slug].md]

### 代码模式（X 条）

#### [模式名称]
- **触发条件**: [何时使用]
- **解决方案**: [简要描述]
[查看完整内容: .omc/knowledge/patterns/[name].md]
```

### Step 5: 无结果处理

若无匹配结果：
```
未找到与 "[关键词]" 相关的知识条目。

建议：
- 尝试更宽泛的关键词
- 运行 /ultrapower:learner 提取当前会话的知识
- 查看完整知识库：.omc/knowledge/knowledge_base.md
```

## 知识库文件结构

```
.omc/knowledge/
├── knowledge_base.md      # 索引文件
├── pattern_library.md     # 模式索引
├── k-[slug].md            # 知识条目
└── patterns/
    └── [name].md          # 模式条目
```

## 与 learner skill 的关系

- `ax-knowledge`：查询已有知识
- `/ultrapower:learner`：从当前会话提取新知识并写入知识库
