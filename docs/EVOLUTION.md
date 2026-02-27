# Axiom 自我进化系统

ultrapower v5.2.2 深度集成的自我进化引擎，让 AI 工作流随使用不断优化。

---

## 目录

- [概述](#概述)
- [安装与初始化](#安装与初始化)
- [核心组件](#核心组件)
- [记忆系统](#记忆系统)
- [进化工作流](#进化工作流)
- [Skills 使用指南](#skills-使用指南)
- [自动触发机制](#自动触发机制)
- [知识库管理](#知识库管理)
- [状态机](#状态机)
- [门禁系统](#门禁系统)
- [HUD 集成](#hud-集成)
- [故障排除](#故障排除)

---

## 概述

Axiom 自我进化系统是 ultrapower 的核心差异化功能。它通过以下机制让 AI 工作流持续改进：

1. **知识收割**：每次任务完成后自动提取经验教训
2. **模式检测**：识别重复出现的代码模式，达到阈值后自动提升为最佳实践
3. **工作流优化**：分析执行指标，发现瓶颈并生成优化建议
4. **跨会话记忆**：知识库和模式库跨会话持久化，越用越聪明

### 系统架构

```
用户操作
    ↓
Axiom 工作流（ax-draft → ax-review → ax-decompose → ax-implement）
    ↓
任务完成 → ax-reflect（反思）→ 学习队列
    ↓
ax-evolve（进化）→ 知识库 + 模式库
    ↓
下次会话自动加载（axiom-boot hook）
```

---

## 安装与初始化

### 前提条件

ultrapower 插件已安装：

```bash
# 添加插件市场
/plugin marketplace add https://github.com/liangjie559567/ultrapower

# 安装插件
/plugin install ultrapower
```

### 初始化 Axiom 系统

在项目目录中运行：

```bash
/ultrapower:ax-context init
```

这会创建以下目录结构：

```
.omc/axiom/
├── active_context.md       # 当前任务状态
├── project_decisions.md    # 架构决策记录
├── user_preferences.md     # 用户偏好
├── state_machine.md        # 状态机定义
├── reflection_log.md       # 反思日志
└── evolution/
    ├── knowledge_base.md   # 知识图谱索引
    ├── pattern_library.md  # 代码模式库
    ├── learning_queue.md   # 待处理学习素材
    └── workflow_metrics.md # 工作流执行指标
```

### 验证安装

```bash
/ultrapower:ax-status
```

输出示例：
```
Axiom 系统状态
状态: IDLE
知识库: 46 条目
模式库: 5 个模式
学习队列: 0 待处理
工作流成功率: 94%
```

---

## 核心组件

### 1. axiom-evolution-engine（进化引擎）

负责处理学习队列、更新知识库、检测代码模式。

| 属性 | 值 |
|------|-----|
| 模型 | sonnet |
| 触发方式 | `/ax-evolve` 或自动（IDLE 状态） |
| 输入 | `learning_queue.md` |
| 输出 | 更新后的 `knowledge_base.md`、`pattern_library.md` |

### 2. axiom-context-manager（上下文管理器）

管理 7 种记忆操作：读取、写入、状态更新、检查点创建/恢复、合并、清理。

```bash
# 读取当前上下文
/ultrapower:ax-context read

# 创建检查点
/ultrapower:ax-context checkpoint

# 恢复到检查点
/ultrapower:ax-context restore
```

### 3. axiom-boot hook（启动钩子）

每次会话启动时自动注入记忆上下文，无需手动加载。

**注入内容：**
- `active_context.md` 中的当前状态
- `project_decisions.md` 中的架构约束
- `user_preferences.md` 中的用户偏好

### 4. axiom-guards hook（门禁钩子）

执行三层门禁规则，防止未经验证的代码进入生产。

---

## 记忆系统

### active_context.md（短期记忆）

存储当前会话的任务状态：

```markdown
## 当前状态
状态: EXECUTING
目标: 实现用户认证模块
进度: 3/7 任务完成

## 任务队列
- [x] 设计数据库 schema
- [x] 实现 JWT 工具函数
- [x] 创建登录 API
- [ ] 实现注册 API
- [ ] 添加中间件
- [ ] 编写测试
- [ ] 更新文档
```

### project_decisions.md（长期记忆）

存储架构决策，跨会话持久化：

```markdown
## 架构决策记录

### ADR-001: 使用 JWT 认证
- 决策日期: 2026-02-15
- 原因: 无状态、易于水平扩展
- 影响: 所有 API 端点需要验证 token
```

### knowledge_base.md（知识图谱）

中央知识索引，每条知识包含：
- **ID**：唯一标识符（k-001 格式）
- **置信度**：0.0-1.0，基于验证次数动态更新
- **分类**：architecture / debugging / workflow / pattern / security / tooling
- **状态**：active / deprecated

### pattern_library.md（模式库）

存储从代码中识别的可复用模式：

```markdown
| ID | Name | Occurrences | Confidence | Status |
|----|------|-------------|------------|--------|
| P-001 | Markdown Workflow Pattern | 5 | 0.9 | active |
| P-002 | assertValidMode() Guard | 1 | 0.95 | pending |
```

**提升规则**：`occurrences >= 3 AND confidence >= 0.7` → status 变为 `active`

### learning_queue.md（学习队列）

待处理的学习素材，按优先级排序：

| 优先级 | 触发条件 | 示例 |
|--------|---------|------|
| P0 | 安全漏洞修复 | 路径遍历防护 |
| P1 | 错误修复成功 | 修复 bug 的模式 |
| P2 | 代码变更 | 新功能实现 |
| P3 | 工作流运行 | 执行指标 |

---

## 进化工作流

### 完整生命周期

```
需求 → ax-draft → ax-review → ax-decompose → ax-implement
                                                    ↓
                                              任务完成
                                                    ↓
                                              ax-reflect（反思）
                                                    ↓
                                         学习素材入队（learning_queue）
                                                    ↓
                                              ax-evolve（进化）
                                                    ↓
                                    知识库更新 + 模式库更新 + 指标更新
```

### ax-reflect 反思流程

任务完成后自动触发（或手动 `/ax-reflect`）：

1. 读取会话数据（完成率、自动修复次数、耗时）
2. 调用 `analyst` agent 生成反思报告
3. 报告维度：What Went Well / What Could Improve / Learnings / Action Items
4. 持久化到 `reflection_log.md`
5. 高价值 Learnings 入队等待进化

### ax-evolve 进化流程

处理学习队列（手动 `/ax-evolve` 或 IDLE 状态自动触发）：

1. 读取 `learning_queue.md`，按 P0→P1→P2→P3 排序
2. 调用 `axiom-evolution-engine` 处理每条素材
3. 更新 `knowledge_base.md`（新增或提升置信度）
4. 检测模式，满足阈值则提升为 active
5. 更新 `workflow_metrics.md`
6. 生成进化报告
7. 清理已处理队列（保留 7 天记录）

---

## Skills 使用指南

### 开发工作流 Skills

#### `/ax-draft` — 需求起草

```
用途: 将模糊需求转化为结构化 Draft PRD
触发: 提出新功能需求时
流程: 需求澄清 → 三态门（PASS/CLARIFY/REJECT）→ Draft PRD → 用户确认
```

**示例：**
```
/ax-draft 我想添加用户认证功能
```

#### `/ax-review` — 专家评审

```
用途: 5 位专家并行评审 Draft PRD
触发: Draft PRD 生成后
专家: UX Director / Product Director / Domain Expert / Tech Lead / Critic
输出: 聚合评审报告 + 冲突仲裁 → Rough PRD
```

#### `/ax-decompose` — 任务分解

```
用途: 将 Rough PRD 分解为原子任务 DAG
触发: PRD 确认后
输出: manifest.md（任务清单 + 依赖图 + 影响范围）
```

#### `/ax-implement` — 执行实现

```
用途: 按 manifest.md 执行任务，含 CI 门禁和自动修复
触发: manifest.md 生成后
自修复: 最多 3 次，每次运行 tsc --noEmit && npm run build && npm test
```

### 进化系统 Skills

#### `/ax-reflect` — 会话反思

```
用途: 任务完成后提取经验教训
触发: 手动 或 状态→ARCHIVING 时自动
输出: reflection_log.md 新增条目 + 学习素材入队
```

#### `/ax-evolve` — 知识进化

```
用途: 处理学习队列，更新知识库和模式库
触发: 手动 或 状态→IDLE 且队列不为空时自动
输出: 进化报告（知识更新统计 + 新增模式 + 工作流洞察）
```

#### `/ax-knowledge` — 知识查询

```
用途: 搜索知识库和模式库
用法:
  /ax-knowledge [关键词]        # 搜索知识条目
  /ax-knowledge pattern [关键词] # 搜索代码模式
```

**示例：**
```
/ax-knowledge JWT 认证
/ax-knowledge pattern 路径遍历
```

#### `/ax-evolution` — 进化引擎入口

```
用途: 进化引擎的统一入口
子命令:
  /ax-evolution evolve    # 触发进化（等同 ax-evolve）
  /ax-evolution reflect   # 触发反思（等同 ax-reflect）
  /ax-evolution knowledge # 查询知识库
  /ax-evolution patterns  # 查询模式库
```

### 状态管理 Skills

#### `/ax-status` — 系统状态

```
用途: 查看完整系统状态仪表盘
输出:
  - 当前状态（IDLE/EXECUTING/BLOCKED 等）
  - 当前目标和任务进度
  - 学习队列条数及优先级
  - 知识库条数
  - 工作流成功率
```

#### `/ax-suspend` — 挂起保存

```
用途: 保存当前会话状态，安全退出
触发: 需要中断工作时
输出: 检查点文件 + 恢复指令
```

#### `/ax-rollback` — 回滚

```
用途: 回滚到最近检查点（需用户确认）
触发: 出现严重错误时
注意: 不可逆操作，执行前会显示确认提示
```

#### `/ax-context` — 上下文操作

```
用途: 直接操作 Axiom 记忆系统
子命令:
  /ax-context init        # 初始化 Axiom 目录结构
  /ax-context read        # 读取当前上下文
  /ax-context checkpoint  # 创建检查点
  /ax-context restore     # 恢复到检查点
```

#### `/ax-export` — 导出产物

```
用途: 导出 Axiom 工作流产物为可移植 zip
内容: PRD / manifest / 知识库 / 反思日志 / 工作流指标
```

---

## 自动触发机制

进化系统的大部分操作是自动触发的，无需手动干预：

| 触发事件 | 自动行为 |
|---------|---------|
| 任务完成 | 将代码变更加入 `learning_queue.md`（P2） |
| 错误修复成功 | 将修复模式加入学习队列（P1） |
| 安全漏洞修复 | 加入学习队列（P0，最高优先级） |
| 工作流完成 | 更新 `workflow_metrics.md` |
| 状态 → ARCHIVING | 自动触发 `/ax-reflect` |
| 状态 → IDLE + 队列不为空 | 自动处理 P0/P1 优先级队列 |
| 会话启动 | axiom-boot hook 注入记忆上下文 |

---

## 知识库管理

### 知识条目结构

每条知识包含：

```markdown
## k-001: Global Configuration Pattern

**分类**: architecture
**置信度**: 0.9
**创建日期**: 2026-02-08
**状态**: active

### 核心洞见
全局配置应集中在 `~/.claude/.omc-config.json`，避免分散配置。

### 适用场景
- 需要跨项目共享配置时
- 配置项影响多个模块时

### 验证记录
- 2026-02-08: 首次提取（置信度 0.8）
- 2026-02-15: 第二次验证（置信度 0.9）
```

### 置信度系统

| 置信度范围 | 含义 | 操作 |
|-----------|------|------|
| 0.0 - 0.5 | 低置信，待验证 | 仅记录，不推荐 |
| 0.5 - 0.7 | 中置信，有参考价值 | 推荐参考 |
| 0.7 - 0.9 | 高置信，可信赖 | 主动推荐 |
| 0.9 - 1.0 | 极高置信，最佳实践 | 写入 project_memory |

### 手动添加知识

```bash
# 通过 learner skill 从当前会话提取
/ultrapower:learner

# 通过 ax-knowledge 查询现有知识
/ax-knowledge [关键词]
```

---

## 状态机

Axiom 系统有 7 个状态：

```
IDLE → PLANNING → CONFIRMING → EXECUTING → AUTO_FIX → BLOCKED → ARCHIVING → IDLE
```

| 状态 | 描述 | 允许操作 |
|------|------|---------|
| IDLE | 系统就绪，等待指令 | ax-draft, ax-knowledge, ax-evolve |
| PLANNING | 正在规划任务 | ax-status, ax-suspend |
| CONFIRMING | 等待用户确认 PRD | 确认/拒绝 |
| EXECUTING | 正在执行任务 | ax-status, ax-suspend |
| AUTO_FIX | 自动修复中（最多 3 次） | ax-status |
| BLOCKED | 任务被阻塞，需人工介入 | ax-analyze-error, ax-rollback |
| ARCHIVING | 任务完成，归档中 | 自动触发 ax-reflect |

### 状态恢复

会话启动时，axiom-boot hook 自动检测状态：

- **IDLE**: 系统就绪，等待指令
- **EXECUTING**: 检测到中断任务，询问是否继续
- **BLOCKED**: 上次任务遇到问题，需要人工介入

---

## 门禁系统

### Expert Gate（专家评审门禁）

- **触发**：所有新功能需求
- **流程**：必须经过 `/ax-draft` → `/ax-review`
- **绕过**：不允许

### User Gate（PRD 确认门禁）

- **触发**：PRD 终稿生成完成
- **流程**：显示确认提示，用户输入 Yes 后才能进入开发
- **绕过**：不允许

### CI Gate（编译提交门禁）

- **触发**：代码修改完成
- **命令**：`tsc --noEmit && npm run build && npm test`
- **通过条件**：零错误
- **失败处理**：最多自动修复 3 次，3 次后输出 BLOCKED

### Scope Gate（范围门禁）

- **触发**：修改文件时
- **检查**：是否在 `manifest.md` 定义的 Impact Scope 内
- **越界处理**：触发警告，需用户确认后才能继续

---

## HUD 集成

安装 HUD 后，Axiom 状态实时显示在状态栏：

```bash
/ultrapower:hud
```

HUD 显示内容：

| 元素 | 内容 |
|------|------|
| axiom | 当前状态 / 目标 / 任务进度 / 学习队列 / 知识库条数 / 成功率 |
| suggestions | 基于 Axiom 状态的智能下一步建议 |

**智能建议示例：**

| 条件 | 建议 |
|------|------|
| 状态 BLOCKED | `/ax-analyze-error` |
| IDLE + 学习队列不为空 | `/ax-evolve` |
| EXECUTING + 无 Agent | `/ax-status` |
| IDLE + 待办任务 | `/ax-implement` |
| 任务完成 | `/ax-reflect` |
| 会话超 120 分钟 | `/ax-suspend` |

---

## 故障排除

### 问题：ax-context init 无限循环

**症状**：`/ax-context init` 反复执行，无法完成

**原因**：init 命令缺少可执行指令，导致 agent 反复重试

**解决**：升级到 ultrapower v5.0.25+，已修复此问题

### 问题：学习队列不断增长

**症状**：`learning_queue.md` 条目越来越多，从未被处理

**原因**：系统未进入 IDLE 状态，或 ax-evolve 未被触发

**解决**：
```bash
# 手动触发进化
/ax-evolve

# 或检查系统状态
/ax-status
```

### 问题：知识库条目置信度不提升

**症状**：同一知识条目多次验证后置信度仍然很低

**原因**：验证记录未正确写入

**解决**：
```bash
# 查看知识条目详情
/ax-knowledge [条目关键词]

# 手动触发进化以重新计算
/ax-evolve
```

### 问题：会话启动时未加载记忆

**症状**：新会话中 Axiom 状态为空，未恢复上次状态

**原因**：axiom-boot hook 未正确安装，或 `.omc/axiom/` 目录不存在

**解决**：
```bash
# 重新初始化
/ultrapower:ax-context init

# 重新安装 hooks
/ultrapower:omc-setup
```

---

## 相关文档

- [REFERENCE.md](./REFERENCE.md) — 完整 API 参考
- [ARCHITECTURE.md](./ARCHITECTURE.md) — 系统架构设计
- [CLAUDE.md](./CLAUDE.md) — 编排规则和工作流路由表
- [standards/agent-lifecycle.md](./standards/agent-lifecycle.md) — Agent 生命周期规范
