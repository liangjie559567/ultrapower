---
name: skill
description: 管理本地 skill——列出、添加、删除、搜索、编辑、设置向导
argument-hint: "<command> [args]"
---

# Skill 管理 CLI

通过类 CLI 命令管理 ultrapower skill 的元 skill。

## 子命令

### /skill list

显示按范围组织的所有本地 skill。

**行为：**
1. 扫描 `~/.claude/skills/omc-learned/` 中的用户 skill
2. 扫描 `.omc/skills/` 中的项目 skill
3. 解析 YAML frontmatter 获取元数据
4. 以有组织的表格格式显示：

```
USER SKILLS (~/.claude/skills/omc-learned/):
| Name              | Triggers           | Quality | Usage | Scope |
|-------------------|--------------------|---------|-------|-------|
| error-handler     | fix, error         | 95%     | 42    | user  |
| api-builder       | api, endpoint      | 88%     | 23    | user  |

PROJECT SKILLS (.omc/skills/):
| Name              | Triggers           | Quality | Usage | Scope   |
|-------------------|--------------------|---------|-------|---------|
| test-runner       | test, run          | 92%     | 15    | project |
```

**降级：** 如果质量/使用统计不可用，显示"N/A"

---

### /skill add [name]

创建新 skill 的交互式向导。

**行为：**
1. **询问 skill 名称**（如果命令中未提供）
   - 验证：小写，仅连字符，无空格
2. **询问描述**
   - 清晰、简洁的一行说明
3. **询问触发词**（逗号分隔）
   - 示例："error, fix, debug"
4. **询问参数提示**（可选）
   - 示例："<file> [options]"
5. **询问范围：**
   - `user` → `~/.claude/skills/omc-learned/<name>/SKILL.md`
   - `project` → `.omc/skills/<name>/SKILL.md`
6. **创建 skill 文件**，使用模板：

```yaml
---
name: <name>
description: <description>
triggers:
  - <trigger1>
  - <trigger2>
argument-hint: "<args>"
---

# <Name> Skill

## Purpose

[Describe what this skill does]

## When to Activate

[Describe triggers and conditions]

## Workflow

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Examples

```
/ultrapower:<name> example-arg
```

## Notes

[Additional context, edge cases, gotchas]
```

7. **报告成功**，附文件路径
8. **建议：** "Edit `/skill edit <name>` to customize content"

**示例：**
```
User: /skill add custom-logger
Assistant: Creating new skill 'custom-logger'...

Description: Enhanced logging with structured output
Triggers (comma-separated): log, logger, logging
Argument hint (optional): <level> [message]
Scope (user/project): user

✓ Created skill at ~/.claude/skills/omc-learned/custom-logger/SKILL.md
→ Edit with: /skill edit custom-logger
```

---

### /skill remove <name>

按名称删除 skill。

**行为：**
1. **在两个范围中搜索 skill：**
   - `~/.claude/skills/omc-learned/<name>/SKILL.md`
   - `.omc/skills/<name>/SKILL.md`
2. **如果找到：**
   - 显示 skill 信息（名称、描述、范围）
   - **请求确认：** "Delete '<name>' skill from <scope>? (yes/no)"
3. **如果确认：**
   - 删除整个 skill 目录（如 `~/.claude/skills/omc-learned/<name>/`）
   - 报告："✓ Removed skill '<name>' from <scope>"
4. **如果未找到：**
   - 报告："✗ Skill '<name>' not found in user or project scope"

**安全：** 未经用户明确确认绝不删除。

**示例：**
```
User: /skill remove old-logger
Assistant: Found skill 'old-logger' in user scope:
  Description: Legacy logging utility
  Scope: user (~/.claude/skills/omc-learned/)

Delete 'old-logger' skill? (yes/no)

User: yes
Assistant: ✓ Removed skill 'old-logger' from user scope
```

---

### /skill edit <name>

交互式编辑现有 skill。

**行为：**
1. **按名称查找 skill**（搜索两个范围）
2. **通过 Read 工具读取当前内容**
3. **显示当前值：**
   ```
   Current skill 'custom-logger':
   - Description: Enhanced logging with structured output
   - Triggers: log, logger, logging
   - Argument hint: <level> [message]
   - Scope: user
   ```
4. **询问要修改什么：**
   - `description` - 更新描述
   - `triggers` - 更新触发关键词
   - `argument-hint` - 更新参数提示
   - `content` - 编辑完整 markdown 内容
   - `rename` - 重命名 skill（移动文件）
   - `cancel` - 不做更改退出
5. **对选定字段：**
   - 显示当前值
   - 询问新值
   - 更新 YAML frontmatter 或内容
   - 写回文件
6. **报告成功**，附更改摘要

**示例：**
```
User: /skill edit custom-logger
Assistant: Current skill 'custom-logger':
  - Description: Enhanced logging with structured output
  - Triggers: log, logger, logging
  - Argument hint: <level> [message]

What would you like to edit? (description/triggers/argument-hint/content/rename/cancel)

User: triggers
Assistant: Current triggers: log, logger, logging
New triggers (comma-separated): log, logger, logging, trace

✓ Updated triggers for 'custom-logger'
```

---

### /skill search <query>

按内容、触发词、名称或描述搜索 skill。

**行为：**
1. **扫描两个范围中的所有 skill**
2. **匹配查询**（不区分大小写）：
   - Skill 名称
   - 描述
   - 触发词
   - 完整 markdown 内容
3. **显示匹配项**及上下文：

```
Found 3 skills matching "typescript error":

1. typescript-fixer (user)
   Description: Fix common TypeScript errors
   Match: "typescript error handling patterns"

2. error-handler (user)
   Description: Generic error handling utilities
   Match: "Supports TypeScript and JavaScript errors"

3. lint-fix (project)
   Description: Auto-fix linting errors
   Match: "TypeScript ESLint error resolution"
```

**排名：** 名称/触发词中的匹配优先于内容匹配

---

### /skill info <name>

显示 skill 的详细信息。

**行为：**
1. **按名称查找 skill**（搜索两个范围）
2. **解析 YAML frontmatter** 和内容
3. **显示完整详情：**

```
Skill: custom-logger
Scope: user (~/.claude/skills/omc-learned/custom-logger/)
Description: Enhanced logging with structured output
Triggers: log, logger, logging
Argument Hint: <level> [message]
Quality: 95% (if available)
Usage Count: 42 times (if available)
File Path: /home/user/.claude/skills/omc-learned/custom-logger/SKILL.md

--- FULL CONTENT ---
[entire markdown content]
```

**如果未找到：** 报告错误并建议使用 `/skill search`

---

### /skill sync

在用户和项目范围间同步 skill。

**行为：**
1. **扫描两个范围：**
   - 用户 skill：`~/.claude/skills/omc-learned/`
   - 项目 skill：`.omc/skills/`
2. **比较并分类：**
   - 仅用户 skill（不在项目中）
   - 仅项目 skill（不在用户中）
   - 公共 skill（两者都有）
3. **显示同步机会：**

```
SYNC REPORT:

User-only skills (5):
  - error-handler
  - api-builder
  - custom-logger
  - test-generator
  - deploy-helper

Project-only skills (2):
  - test-runner
  - backend-scaffold

Common skills (3):
  - frontend-ui-ux
  - git-master
  - planner

Options:
  [1] Copy user skill to project
  [2] Copy project skill to user
  [3] View differences
  [4] Cancel
```

4. **处理用户选择：**
   - 选项 1：选择要复制到项目的 skill
   - 选项 2：选择要复制到用户的 skill
   - 选项 3：显示公共 skill 的并排差异
   - 选项 4：退出

**安全：** 未经确认绝不覆盖

---

### /skill setup

设置和管理本地 skill 的交互式向导（原 local-skills-setup）。

**行为：**

#### 第一步：目录检查和设置

首先检查 skill 目录是否存在，如需要则创建：

```bash
# Check and create user-level skills directory
USER_SKILLS_DIR="$HOME/.claude/skills/omc-learned"
if [ -d "$USER_SKILLS_DIR" ]; then
  echo "User skills directory exists: $USER_SKILLS_DIR"
else
  mkdir -p "$USER_SKILLS_DIR"
  echo "Created user skills directory: $USER_SKILLS_DIR"
fi

# Check and create project-level skills directory
PROJECT_SKILLS_DIR=".omc/skills"
if [ -d "$PROJECT_SKILLS_DIR" ]; then
  echo "Project skills directory exists: $PROJECT_SKILLS_DIR"
else
  mkdir -p "$PROJECT_SKILLS_DIR"
  echo "Created project skills directory: $PROJECT_SKILLS_DIR"
fi
```

#### 第二步：Skill 扫描和清单

扫描两个目录并显示综合清单：

```bash
# Scan user-level skills
echo "=== USER-LEVEL SKILLS (~/.claude/skills/omc-learned/) ==="
if [ -d "$HOME/.claude/skills/omc-learned" ]; then
  USER_COUNT=$(find "$HOME/.claude/skills/omc-learned" -name "*.md" 2>/dev/null | wc -l)
  echo "Total skills: $USER_COUNT"
  # ... (scan and display each skill)
fi

echo ""
echo "=== PROJECT-LEVEL SKILLS (.omc/skills/) ==="
# ... (similar scan)

TOTAL=$((USER_COUNT + PROJECT_COUNT))
echo "=== SUMMARY ==="
echo "Total skills across all directories: $TOTAL"
```

#### 第三步：快速操作菜单

扫描后，使用 AskUserQuestion 工具提供以下选项：

**问题：** "What would you like to do with your local skills?"

**选项：**
1. **添加新 skill** - 启动 skill 创建向导（调用 `/skill add`）
2. **列出所有 skill 及详情** - 显示综合 skill 清单（调用 `/skill list`）
3. **扫描对话中的模式** - 分析当前对话中值得提取为 skill 的模式
4. **导入 skill** - 从 URL 导入或粘贴内容
5. **完成** - 退出向导

**选项 3：扫描对话中的模式**

分析当前对话上下文以识别潜在的值得提取为 skill 的模式。查找：
- 有非显而易见解决方案的近期调试 session
- 需要调查的棘手 bug
- 发现的代码库特定变通方法
- 花费时间解决的错误模式

报告发现并询问用户是否要将其提取为 skill（如果是则调用 `/learner`）。

**选项 4：导入 Skill**

询问用户提供：
- **URL**：从 URL 下载 skill（如 GitHub gist）
- **粘贴内容**：直接粘贴 skill markdown 内容

然后询问范围：
- **用户级**（~/.claude/skills/omc-learned/）- 跨所有项目可用
- **项目级**（.omc/skills/）- 仅用于此项目

验证 skill 格式并保存到选定位置。

---

### /skill scan

快速扫描两个 skill 目录（`/skill setup` 的子集）。

**行为：**
运行 `/skill setup` 第二步的扫描，不带交互式向导。

---

## Skill 模板

通过 `/skill add` 或 `/skill setup` 创建 skill 时，提供常见 skill 类型的快速模板：

### 错误解决方案模板

```markdown
---
id: error-[unique-id]
name: [Error Name]
description: Solution for [specific error in specific context]
source: conversation
triggers: ["error message fragment", "file path", "symptom"]
quality: high
---

# [Error Name]

## The Insight
What is the underlying cause of this error? What principle did you discover?

## Why This Matters
What goes wrong if you don't know this? What symptom led here?

## Recognition Pattern
- Error message: "[exact error]"
- File: [specific file path]
- Context: [when does this occur]

## The Approach
1. [Specific action with file/line reference]
2. [Specific action with file/line reference]
3. [Verification step]
```

### 工作流 Skill 模板

```markdown
---
id: workflow-[unique-id]
name: [Workflow Name]
description: Process for [specific task in this codebase]
source: conversation
triggers: ["task description", "file pattern", "goal keyword"]
quality: high
---

# [Workflow Name]

## The Insight
What makes this workflow different from the obvious approach?

## Recognition Pattern
- Task type: [specific task]
- Files involved: [specific patterns]

## The Approach
1. [Step with specific commands/files]
2. [Step with specific commands/files]
3. [Verification]

## Gotchas
- [Common mistake and how to avoid it]
```

---

## 错误处理

**所有命令必须处理：**
- 文件/目录不存在
- 权限错误
- 无效的 YAML frontmatter
- 重复的 skill 名称
- 无效的 skill 名称（空格、特殊字符）

**错误格式：**
```
✗ Error: <clear message>
→ Suggestion: <helpful next step>
```

---

## 用法示例

```bash
# 列出所有 skill
/skill list

# 创建新 skill
/skill add my-custom-skill

# 删除 skill
/skill remove old-skill

# 编辑现有 skill
/skill edit error-handler

# 搜索 skill
/skill search typescript error

# 获取详细信息
/skill info my-custom-skill

# 在范围间同步
/skill sync

# 运行设置向导
/skill setup

# 快速扫描
/skill scan
```

## 使用模式

### 直接命令模式

带参数调用时，跳过交互式向导：

- `/ultrapower:skill list` - 显示详细 skill 清单
- `/ultrapower:skill add` - 开始 skill 创建（调用 learner）
- `/ultrapower:skill scan` - 扫描两个 skill 目录

### 交互模式

不带参数调用时，运行完整引导向导。

---

## 本地 Skill 的优势

**自动应用**：Claude 检测触发词并自动应用 skill——无需记忆或搜索解决方案。

**版本控制**：项目级 skill（.omc/skills/）随代码提交，整个团队受益。

**知识演进**：随着发现更好方法和完善触发词，skill 随时间改进。

**减少 token 使用**：无需重复解决相同问题，Claude 高效应用已知模式。

**代码库记忆**：保存否则会在对话历史中丢失的机构知识。

---

## Skill 质量指南

好的 skill 具备：

1. **不可 Google** - 无法通过搜索轻易找到
   - 差：「如何在 TypeScript 中读取文件」
   - 好：「此代码库使用需要 fileURLToPath 的自定义路径解析」

2. **上下文特定** - 引用此代码库的实际文件/错误
   - 差：「使用 try/catch 进行错误处理」
   - 好：「server.py:42 中的 aiohttp 代理在 ClientDisconnectedError 时崩溃」

3. **精确可操作** - 准确告知做什么和在哪里做
   - 差：「处理边界情况」
   - 好：「在 dist/ 中看到 'Cannot find module' 时，检查 tsconfig.json moduleResolution」

4. **来之不易** - 需要大量调试工作
   - 差：通用编程模式
   - 好：「worker.ts 中的竞态条件——第 89 行的 Promise.all 需要 await」

---

## 相关 Skill

- `/ultrapower:learner` - 从当前对话提取 skill
- `/ultrapower:note` - 保存快速笔记（比 skill 更非正式）
- `/ultrapower:deepinit` - 生成 AGENTS.md 代码库层次结构
