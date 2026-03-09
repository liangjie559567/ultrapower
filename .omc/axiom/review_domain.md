# Domain Expert Review - Draft PRD 领域知识评审

**评审人**: Domain Expert (axiom-domain-expert)
**评审时间**: 2026-03-05
**评审对象**: `.omc/axiom/draft_prd_user_guide.md`
**评审结果**: REVISE

---

## 评审摘要

Draft PRD 整体方向正确，但存在多处领域知识不准确的问题，主要集中在：
1. 功能数量统计错误
2. 安装步骤不完整
3. 技术术语使用不当
4. 遗漏关键功能

**建议**: 需要修订后重新评审。

---

## 详细评审

### ✅ 准确的部分

1. **问题陈述清晰** (第 1 节)
   - 核心问题定义准确
   - 目标用户画像正确
   - 影响范围合理

1. **文档结构合理** (第 3.1 节)
   - README.md 更新方向正确
   - 独立用户手册定位准确
   - 交互式教程是好的补充

1. **验收标准可执行** (第 5 节)
   - 标准明确可测量
   - 分阶段验收合理

---

## ❌ 需要修正的问题

### 问题 1: 功能数量统计错误 (严重)

**位置**: 第 3.1.2 节、第 3.3 节

**错误内容**:
```markdown

* 功能详解（50 agents + 71 skills + 35 hooks + 35 tools）
```

**实际数据** (根据 README.md):

* **Agents**: 50 个 ✓ (正确)
  - 构建/分析通道: 8 个
  - 审查通道: 6 个
  - 领域专家: 15 个 (不是 16 个)
  - 产品通道: 4 个
  - Axiom Agents: 14 个
  - 协调: 2 个 (critic + vision)

* **Skills**: 70 个 (不是 71 个)
  - 工作流 Skills: 10 个
  - 开发工作流 Skills: 12 个
  - Axiom Skills: 13 个
  - 增强 Skills: 11 个
  - 工具类 Skills: 24 个

* **Hooks**: 35 个 ✓ (正确，根据 REFERENCE.md)

* **Tools**: 35 个 ✓ (正确)
  - LSP: 12 个
  - AST: 2 个
  - Python REPL: 1 个
  - Notepad: 6 个
  - State: 5 个
  - Project Memory: 4 个
  - Trace: 2 个
  - Skills: 3 个

**修正建议**:
```markdown

* 功能详解（50 agents + 70 skills + 35 hooks + 35 tools）
```

并在第 3.3 节修正 agents 分类：
```markdown
**agents 分类**:

* 构建/分析通道（8 个）

* 审查通道（6 个）

* 领域专家（15 个）  ← 修正

* 产品通道（4 个）

* Axiom 通道（14 个）

* 协调（2 个）  ← 新增
```

---

### 问题 2: 安装步骤不完整且顺序错误 (严重)

**位置**: 第 3.2 节

**错误内容**:
```markdown

### 1. 安装 ultrapower

npm install -g @liangjie559567/ultrapower

### 2. 配置 Claude Code 插件

/plugin marketplace add <<https://github.com/liangjie559567/ultrapower>>
/plugin install omc@ultrapower

### 3. 初始化配置

/ultrapower:omc-setup
```

**问题分析**:
1. **方式混淆**: npm 全局安装和 Claude Code 插件安装是两种不同的方式，不应混用
2. **插件命令错误**: 根据 README.md，正确命令是 `/plugin install ultrapower`，不是 `omc@ultrapower`
3. **缺少验证步骤**: 没有告诉用户如何验证安装成功

**修正建议** (根据 README.md 第 12-36 行):

```markdown

## 快速开始

### 方式一：Claude Code 插件（推荐）

```bash

# 1. 添加 marketplace 并安装

/plugin marketplace add <<https://github.com/liangjie559567/ultrapower>>
/plugin install ultrapower

# 2. 运行安装向导

/omc-setup
```

### 方式二：npm 全局安装

```bash
npm install -g @liangjie559567/ultrapower
```

### 验证安装

启动新会话，说 "help me plan this feature"，agent 应自动调用相关 skill。
```

---

### 问题 3: 示例命令不符合实际使用方式 (中等)

**位置**: 第 3.2 节

**错误内容**:
```bash

# 使用 autopilot 模式构建一个简单功能

autopilot "创建一个 hello world 函数"
```

**问题分析**:
1. **触发方式错误**: 根据 CLAUDE.md，autopilot 是通过自然语言触发的，不是命令
2. **示例不够实用**: "hello world" 太简单，无法展示 ultrapower 的价值

**修正建议**:
```markdown

### 4. 运行第一个示例

在 Claude Code 会话中说：

```
help me plan this feature: 添加用户登录功能
```

系统会自动调用 `planner` agent 生成执行计划。

或使用 autopilot 模式：

```
build me a REST API endpoint for user authentication
```

autopilot 会自动完成从设计到实现的全流程。
```

---

### 问题 4: 遗漏关键功能 (中等)

**位置**: 第 3.3 节

**遗漏内容**:
1. **MCP 集成**: Draft PRD 完全没有提到 MCP 服务器功能，这是 ultrapower 的重要特性
2. **Axiom 自我进化系统**: README.md 第 268-309 行详细介绍了进化引擎，但 Draft PRD 未提及
3. **Team 流水线**: 作为默认多 agent 编排器，应该在功能概览中突出

**修正建议**:

在第 3.3 节添加：

```markdown

### 3.3 功能概览（优先级 P1）

#### 核心执行模式

* **Team 流水线**: 默认多 agent 编排器（team-plan → team-prd → team-exec → team-verify → team-fix）

* **autopilot**: 全自主执行

* **ralph**: 带验证的自引用循环

* **ultrawork**: 最大并行度编排

#### MCP 服务器

* 35 个自定义工具

* 支持 Claude Desktop 和 Cursor

* LSP/AST/Python REPL 集成

#### Axiom 自我进化系统

* 知识收割：自动提取经验教训

* 模式检测：识别重复模式（≥3 次）

* 工作流优化：分析执行指标

* 跨会话记忆：越用越聪明

#### agents 分类

...（保持原有内容）
```

---

### 问题 5: 技术术语使用不当 (轻微)

**位置**: 第 3.1.3 节

**错误内容**:
```markdown
**位置**: `skills/tutorial/SKILL.md`
```

**问题分析**:

* 根据项目结构，skills 目录下每个 skill 都有独立目录，文件名应该是大写 `SKILL.md`

* 但更重要的是，应该说明这是一个 skill 定义文件，不是普通 markdown

**修正建议**:
```markdown
**位置**: `skills/tutorial/SKILL.md` (skill 定义文件)
```

---

### 问题 6: 配置指南不完整 (中等)

**位置**: 第 3.1.2 节

**错误内容**:
```markdown

* 配置指南（MCP/hooks/steering）
```

**问题分析**:

* 提到了 MCP/hooks/steering 配置，但在后续章节中没有展开

* 缺少具体的配置示例和说明

**修正建议**:

在第 3.1.2 节添加详细说明：

```markdown

#### 3.1.2 独立用户手册

**内容**:

* 完整安装指南（Claude Code + ultrapower）

* 功能详解（50 agents + 70 skills + 35 hooks + 35 tools）

* 配置指南：
  - **MCP 服务器配置**: Claude Desktop 和 Cursor 集成
  - **Hooks 系统**: 事件驱动自动化工作流
  - **Steering 规则**: 项目级上下文和指令
  - **Axiom 框架**: LSP/AST/记忆系统配置

* 常见问题（FAQ）

* 版本更新指南

**位置**: `docs/USER_GUIDE.md`
```

---

## 📋 修正清单

### 必须修正 (P0)

* [ ] 修正 agents 数量：领域专家改为 15 个，添加协调 2 个

* [ ] 修正 skills 数量：改为 70 个

* [ ] 修正安装步骤：分离两种安装方式，修正插件命令

* [ ] 添加安装验证步骤

### 强烈建议修正 (P1)

* [ ] 修正示例命令：使用自然语言触发方式

* [ ] 添加 MCP 服务器功能说明

* [ ] 添加 Axiom 自我进化系统说明

* [ ] 添加 Team 流水线说明

* [ ] 完善配置指南内容

### 可选修正 (P2)

* [ ] 标注 skill 定义文件类型

* [ ] 添加更多实用示例

---

## 🎯 总体评价

**准确性**: 60/100

* 核心概念理解正确

* 但关键数据和技术细节存在多处错误

**完整性**: 65/100

* 遗漏了 MCP 服务器、Axiom 进化系统等重要功能

* 配置指南不够详细

**可用性**: 70/100

* 文档结构合理

* 但安装步骤错误会导致用户无法成功安装

---

## 建议下一步

1. **立即修正 P0 问题**：数量统计和安装步骤
2. **补充 P1 内容**：MCP 服务器、Axiom 进化系统
3. **重新提交评审**：修正后进入下一轮专家评审

---

**评审状态**: REVISE
**需要重新评审**: 是
**阻塞问题数**: 4 个 (P0)
