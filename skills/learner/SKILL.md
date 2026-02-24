---
name: learner
description: 从当前对话中提取已学到的 skill
---

# Learner Skill

## 核心洞见

可复用的 skill 不是用来复制粘贴的代码片段，而是**原则和决策启发式方法**，教会 Claude 如何思考一类问题。

**区别所在：**
- 差（模仿）："遇到 ConnectionResetError 时，添加这个 try/except 块"
- 好（可复用 skill）："在异步网络代码中，任何 I/O 操作都可能因客户端/服务端生命周期不匹配而独立失败。原则：分别包装每个 I/O 操作，因为操作之间的失败是常见情况，而非例外。"

好的 skill 改变的是 Claude 解决问题的方式，而不仅仅是它产出的代码。

## 为何重要

提取 skill 之前，先问自己：
- "有人能在 5 分钟内 Google 到这个吗？" → 如果是，停止。不要提取。
- "这是否特定于这个代码库？" → 如果否，停止。不要提取。
- "这是否经过了真正的调试努力才发现的？" → 如果否，停止。不要提取。

如果一个潜在 skill 在任何一个问题上失败，就不值得保存。

## 识别模式

仅在以下情况后使用 /ultrapower:learner：
- 解决了需要深入调查的棘手 bug
- 发现了特定于此代码库的非显而易见的解决方法
- 找到了遗忘后会浪费时间的隐藏陷阱
- 揭露了影响此项目的未记录行为

## 方法

### 提取流程

**步骤 1：收集必要信息**

- **问题描述**：发生的具体错误、症状或困惑
  - 包含实际错误信息、文件路径、行号
  - 示例："TypeError in src/hooks/session.ts:45 when sessionId is undefined after restart"

- **解决方案**：确切的修复方法，而非泛泛建议
  - 包含代码片段、文件路径、配置变更
  - 示例："Add null check before accessing session.user, regenerate session on 401"

- **触发词**：再次遇到此问题时会出现的关键词
  - 使用错误信息片段、文件名、症状描述
  - 示例：["sessionId undefined", "session.ts TypeError", "401 session"]

- **范围**：几乎总是项目级别，除非是真正通用的洞见

**步骤 2：质量验证**

系统会拒绝以下 skill：
- 过于泛泛（没有文件路径、行号或具体错误信息）
- 容易 Google 到（标准模式、库的用法）
- 解决方案模糊（没有代码片段或精确说明）
- 触发词质量差（匹配所有内容的通用词汇）

**步骤 3：保存位置**

- **用户级别**：~/.claude/skills/omc-learned/ —— 少用。仅用于真正可移植的洞见。
- **项目级别**：.omc/skills/ —— 默认。随仓库进行版本控制。

### 什么是有用的 Skill

**重要**：并非每个解决方案都值得保存。好的 skill 应具备：

1. **无法 Google 到**：通过搜索不容易找到的内容
   - 差："How to read files in TypeScript" ❌
   - 好："This codebase uses custom path resolution in ESM that requires fileURLToPath + specific relative paths" ✓

2. **上下文相关**：引用了此代码库中的实际文件、错误信息或模式
   - 差："Use try/catch for error handling" ❌
   - 好："The aiohttp proxy in server.py:42 crashes on ClientDisconnectedError - wrap StreamResponse in try/except" ✓

3. **精确可操作**：明确告诉你做什么以及在哪里做
   - 差："Handle edge cases" ❌
   - 好："When seeing 'Cannot find module' in dist/, check tsconfig.json moduleResolution matches package.json type field" ✓

4. **来之不易**：需要大量调试努力才能发现
   - 差：通用编程模式 ❌
   - 好："Race condition in worker.ts - the Promise.all at line 89 needs await before the map callback returns" ✓

### 反模式（不要提取）

- 通用编程模式（改用文档）
- 重构技巧（这些是通用的）
- 库的使用示例（改用库文档）
- 类型定义或样板代码
- 任何初级开发者能在 5 分钟内 Google 到的内容

## Skill 格式

Skill 以 markdown 格式保存，结构如下：

### YAML Frontmatter

标准元数据字段：
- id, name, description, source, triggers, quality

### 正文结构（必填）

```markdown
# [Skill Name]

## 核心洞见
你发现的底层原则是什么？不是代码，而是思维模型。
示例："Async I/O operations are independently failable. Client lifecycle != server lifecycle."

## 为何重要
不知道这个会出什么问题？是什么症状引导你来到这里？
示例："Proxy server crashes on client disconnect, taking down other requests."

## 识别模式
你怎么知道这个 skill 适用？有哪些迹象？
示例："Building any long-lived connection handler (proxy, websocket, SSE)"

## 方法
决策启发式方法，而不仅仅是代码。Claude 应该如何思考这个问题？
示例："For each I/O operation, ask: what if this fails right now? Handle it locally."

## 示例（可选）
如果代码有帮助，展示它——但作为原则的说明，而非复制粘贴的素材。
```

**关键**：如果 Claude 能将 skill 应用于新情况（而不仅仅是相同情况），它才是可复用的。

## 相关命令

- /ultrapower:note —— 保存能在 compaction 后存活的快速笔记（比 skill 更非正式）
- /ultrapower:ralph —— 启动带有学习捕获的开发循环

## Axiom 进化引擎触发逻辑（增强）

当检测到以下条件时，自动触发学习队列处理：

### 触发条件

- 完成 3 个以上任务后
- 遇到并解决了重复出现的错误模式（出现次数 ≥ 3）
- 用户显式调用 `/ultrapower:learner`

### 学习队列处理流程

1. **收集学习条目**：从当前会话提取值得记录的洞见
2. **模式检测**：检查 `.omc/axiom/project_decisions.md` 中的 Known Issues
   - 若同类错误出现 ≥ 3 次 → 升级为正式模式记录
3. **知识库更新**：将新模式写入 `.omc/knowledge/`
4. **工作流指标**：记录任务完成率、平均修复次数、阻塞频率

### 进化报告格式

输出到 `.omc/axiom/evolution_report_[date].md`：

```markdown
## Evolution Report [Date]

### 新增模式
| 模式名称 | 触发条件 | 解决方案 | 出现次数 |
|---------|---------|---------|---------|

### 工作流指标
- 任务完成率：X%
- 平均修复次数：X
- 最常见阻塞原因：[列表]

### 反思日志
[本次迭代的关键学习点]
```

### 知识库条目格式

写入 `.omc/knowledge/[pattern-name].md`：
```markdown
---
pattern: [模式名称]
occurrences: [出现次数]
last_seen: [日期]
---

## 触发条件
## 根因
## 解决方案
## 预防措施
```
