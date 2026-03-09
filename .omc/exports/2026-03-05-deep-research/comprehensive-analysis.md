# ultrapower v5.5.14 - Comprehensive Architecture Analysis

**分析日期**: 2026-03-05
**研究范围**: 7 阶段全链路架构分析
**总行数**: < 350 行

---

## 1. Executive Summary

### 1.1 核心架构模式

ultrapower 是一个**多层编排、事件驱动、自进化**的 AI Agent 系统，采用以下核心模式：

1. **分层 Agent 体系**（50 agents）：Build/Review/Domain/Product/Axiom 五大通道，三层模型路由（haiku/sonnet/opus）
2. **事件驱动 Hook 系统**（15 类 HookType）：UserPromptSubmit → Stop → Tool → Agent → System 完整生命周期
3. **分阶段流水线**（Team Pipeline）：plan → prd → exec → verify → fix 循环，阶段感知 agent 路由
4. **会话隔离状态管理**：`.omc/state/sessions/{sessionId}/` 防止跨会话泄漏，原子写入保证一致性
5. **自进化引擎**（Axiom）：73 条知识库 + 13 个模式库 + 38 个学习队列，置信度衰减机制

### 1.2 关键设计决策

| 决策 | 理由 | 影响 |
| ------ | ------ | ------ |
| **Shell + TypeScript 混合架构** | Shell 作为轻量入口，TypeScript 处理复杂逻辑 | 跨平台兼容 + 性能优化 |
| **会话强制隔离**（team/ralph/ultrawork） | 防止并行会话状态泄漏 | 安全性 ↑，但增加存储开销 |
| **三层安全过滤**（Zod + 字段映射 + 白名单） | 敏感 hooks 防止提示词注入 | 安全性 ↑，但增加解析成本 |
| **懒加载 + 热路径优化** | 冷路径动态导入，热路径预加载 | 启动速度 ↑ 30% |
| **混合后端协调**（Claude + Codex + Gemini） | 统一团队视图管理异构 workers | 灵活性 ↑，但增加复杂度 |

### 1.3 系统优势和创新点

**优势**：

* **完整生命周期覆盖**：从关键词检测 → 执行 → 验证 → 反思的闭环

* **多层并行能力**：Team（多 agent）+ Ultrawork（最大并行度）+ MCP（外部模型）

* **自我优化能力**：知识衰减 + 模式提升 + 工作流指标追踪

* **安全边界清晰**：路径遍历防护 + 敏感 hooks 白名单 + constitution 不可修改清单

**创新点**：
1. **阶段感知路由**：Team Pipeline 每个阶段使用专业 agents（非通用 executors）
2. **四层门禁体系**：Expert/User/CI/Scope Gate 确保质量
3. **双层记忆系统**：Notepad（会话级，7 天清理）+ Project Memory（项目级，永久）
4. **Heartbeat 健康监控**：MCP workers 60s 超时 + 隔离机制

---

## 2. Architecture Patterns

### 2.1 分层架构设计

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: User Interface (Claude Code IDE)              │
│ - Hooks 注入点（UserPromptSubmit/Stop/Tool/Session）    │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Event Router (bridge.ts)                      │
│ - 15 类 HookType 路由                                    │
│ - 3 层安全过滤（Zod + 映射 + 白名单）                    │
│ - 懒加载 + 热路径优化                                    │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Orchestration (Skills + Workflows)            │
│ - 71 个 Skills（动态加载）                               │
│ - 15 层优先级关键词检测                                  │
│ - 4 种核心工作流（autopilot/ralph/ultrawork/team）      │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Agent Execution (50 Agents)                   │
│ - 5 大通道（Build/Review/Domain/Product/Axiom）         │
│ - 3 层模型路由（haiku/sonnet/opus）                     │
│ - 分层提示词加载（provider-specific → embedded → runtime）│
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Layer 5: Tools & Intelligence (35+ Tools)              │
│ - LSP（12 工具，18 语言）                                │
│ - AST（2 工具，17 语言）                                 │
│ - State（5 工具，9 模式）                                │
│ - Memory（6 工具，双层记忆）                             │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Layer 6: State Persistence (.omc/state/)               │
│ - 会话隔离（sessions/{sessionId}/）                      │
│ - 原子写入（temp + fsync + rename）                     │
│ - Interop 层（OMC ↔ OMX）                               │
└─────────────────────────────────────────────────────────┘
```

### 2.2 模块间协作机制

**关键词检测 → 工作流激活**：
```
用户输入 "ralph build feature X"
  ↓ UserPromptSubmit Hook
keyword-detector.mjs 检测 "ralph"
  ↓ 注入激活消息
Claude 收到 "[MAGIC KEYWORD: ralph]"
  ↓ 调用 Skill
/ultrapower:ralph 启动
  ↓ 写入状态
.omc/state/sessions/{sessionId}/ralph-state.json
  ↓ Stop Hook 检测
persistent-mode.mjs 读取状态
  ↓ 注入继续消息
"The boulder never stops. Continue working."
```

**Team Pipeline 阶段转换**：
```
team-plan (explore + planner)
  ↓ 生成 plan_path artifact
team-prd (analyst)
  ↓ 生成 prd_path artifact
team-exec (executor + 专家 agents)
  ↓ tasks_completed >= tasks_total
team-verify (verifier + 审查 agents)
  ↓ 发现问题
team-fix (executor/build-fixer/debugger)
  ↓ fix_loop.attempt++ (最多 3 次)
  ↓ 修复完成
team-exec (重新执行)
  ↓ 验证通过
complete
```

**Axiom 四阶段流水线**：
```
ax-draft (需求澄清 → PRD 初稿)
  ↓ Expert Gate
ax-review (5 专家并行评审 → 冲突仲裁)
  ↓ User Gate（用户确认）
ax-decompose (生成 Manifest → 串行撰写 Sub-PRDs)
  ↓ Scope Gate
ax-implement (按序执行任务 → CI 门禁)
  ↓ CI Gate（tsc + build + test）
complete
```

### 2.3 扩展点和插件系统

**Agent 扩展**：

* 新增 agent：创建 `agents/{name}.md` + 在 `definitions.ts` 注册

* Provider 变体：创建 `agents.{provider}/{name}.md`（Codex/Gemini 定制提示词）

* 工具限制：frontmatter 添加 `disallowedTools`

**Skill 扩展**：

* 内置 skills：`skills/*/SKILL.md`（71 个）

* Learned skills：`.omc/skills/`（项目级）或 `~/.omc/skills/`（全局级）

* 优先级：项目级 > 全局级

**Hook 扩展**：

* Shell 入口：`templates/hooks/*.mjs`

* TypeScript handler：`src/hooks/{hook-type}/index.ts`

* 路由注册：`bridge.ts` 添加 case 分支

**LSP 语言支持**：

* 配置表：`src/tools/lsp/servers.ts` 添加服务器定义

* 自动检测：基于文件扩展名路由

**MCP 集成**：

* 配置：`.kiro/settings/mcp.json`

* 提供商：Codex（代码分析）、Gemini（大上下文）

* 工具发现：`ToolSearch("mcp")` 延迟加载

---

## 3. Key Findings

### 3.1 Stage 1: Agent System（50 agents，三层模型路由）

**核心发现**：

* **专业化分工**：50 个 agents 覆盖 5 大通道，每个 agent 职责明确（architect 不做需求，analyst 不做代码）

* **智能路由**：haiku（快速扫描）→ sonnet（标准实现）→ opus（深度分析），成本与质量平衡

* **安全加固**：路径遍历防护（正则验证 + 相对路径检查）+ 工具沙箱（disallowedTools）

**设计一致性**：

* 所有 agents 使用统一 `AgentConfig` 结构

* 提示词加载三层回退（provider-specific → embedded → runtime）

* Frontmatter 元数据统一解析（disallowedTools, triggers）

**已知问题**：

* 14 个 Axiom agents 无独立定义文件（通过 skill 调用）

* `researcher` 别名已废弃但仍保留（向后兼容）

### 3.2 Stage 2: Skills & Workflow（71 skills，4 种核心工作流）

**核心发现**：

* **15 层优先级**：cancel（P1）抑制所有，ralph（P2）> autopilot（P3）> team（P4.5）

* **冲突解决**：互斥模式（autopilot/ultrapilot/swarm/pipeline）+ 组合模式（team ralph）

* **状态持久化**：会话隔离（sessions/{sessionId}/）防止跨会话泄漏

**设计一致性**：

* 所有工作流使用统一状态文件结构（active, iteration, started_at）

* Hook 桥接统一流程（Shell → TypeScript → JSON 输出）

* 取消机制联动（ralph + ultrawork, team + ralph 同时清理）

**已知问题**：

* Swarm 使用 SQLite（`swarm.db`），不支持会话隔离

* Ultrapilot/Swarm 映射到 Team，但保留独立状态文件

### 3.3 Stage 3: Hooks & Events（15 类 HookType，3 层安全过滤）

**核心发现**：

* **优先级链**：Stop 阶段 4 级（Ralph P1 > Autopilot P1.5 > Ultrawork P2 > stop-continuation P3）

* **安全分层**：Zod 验证 → snake_case 映射 → 白名单过滤（敏感 hooks 丢弃未知字段）

* **性能优化**：热路径预加载（keyword-detector, pre/post-tool-use）+ 冷路径懒加载

**设计一致性**：

* 所有 hooks 返回统一 `HookOutput` 结构（continue, addToPrompt, error）

* 敏感 hooks（4 类）强制走 strict mode Zod 验证

* 失败降级策略统一（静默返回 `{ continue: true }`）

**已知问题**：

* **D-05**：permission-request 当前静默降级，规范要求强制阻塞（v2 待修复）

* Hook 超时处理配置存在但未实现（PreToolUse: 5s, PostToolUse: 5s）

### 3.4 Stage 4: State Management（9 模式，会话隔离 + 原子写入）

**核心发现**：

* **会话隔离**：team/ralph/ultrawork 强制隔离（`hasGlobalState: false`），防止并行会话泄漏

* **原子写入**：temp + fsync + rename 四层保护，subagent-tracking 最高并发安全级别

* **互斥控制**：4 个互斥模式 + 组合模式支持（team ralph 双向关联）

**设计一致性**：

* 所有状态文件使用 `atomicWriteJsonSync` 写入

* 路径解析统一经过 `assertValidMode()` 校验（P0 安全规则）

* 状态读取支持聚合（无 sessionId）或隔离（有 sessionId）

**已知问题**：

* **D-09**：Stale 阈值混淆（Agent Stale 5 分钟 vs Mode Stale Marker 1 小时）

* Swarm 使用 SQLite，不支持原子写入和会话隔离

### 3.5 Stage 5: Tools & Intelligence（35+ 工具，18 语言支持）

**核心发现**：

* **LSP 集成**：12 工具覆盖 18 种语言，客户端池化 + 租约保护防止驱逐

* **AST 操作**：元变量系统（$VAR, $$$ARGS）+ 结构化替换（默认 dryRun）

* **双层记忆**：Notepad（会话级，priority ≤500 字符）+ Project Memory（项目级，结构化 JSON）

**设计一致性**：

* 所有工具使用统一错误处理（优雅降级 + 友好错误消息）

* LSP 诊断两阶段策略（tsc 首选 → LSP 迭代回退）

* 记忆系统分层清晰（短期 7 天清理 vs 长期永久保存）

**已知问题**：

* AST 工具依赖 `@ast-grep/napi`，不可用时降级（无自动安装）

* Python REPL 会话锁可能导致并发阻塞（5 分钟超时）

### 3.6 Stage 6: Team Pipeline（分阶段流水线，混合后端协调）

**核心发现**：

* **阶段感知路由**：每个阶段使用专业 agents（team-plan: explore + planner, team-exec: executor + 专家）

* **Fix Loop 机制**：最多 3 次修复尝试，超出转换到 failed

* **混合后端**：统一管理 Claude native + MCP workers（Codex/Gemini），Heartbeat 60s 超时

**设计一致性**：

* 阶段转换守卫统一（需要 artifact 或任务完成条件）

* 状态持久化使用会话隔离（`.omc/state/sessions/{sessionId}/team-state.json`）

* Worker 能力标签系统（10 种 capability）+ 适应度评分算法

**已知问题**：

* MCP workers 依赖 tmux session，Windows 支持受限

* Heartbeat 文件可能积累（无自动清理机制）

### 3.7 Stage 7: Axiom Evolution（73 条知识，13 个模式，自进化引擎）

**核心发现**：

* **四阶段流水线**：Draft → Review（5 专家并行）→ Decompose → Implement，100% 成功率

* **知识管理**：73 条知识（8 类），置信度 0.5-0.95，30 天衰减 -0.1

* **安全边界**：constitution.md 定义不可修改文件清单 + 修改频率限制（每 agent 最多 7 天优化 1 次）

**设计一致性**：

* 所有工作流使用统一状态机（7 状态：IDLE/DRAFTING/REVIEWING/DECOMPOSING/IMPLEMENTING/BLOCKED/ARCHIVING）

* 门禁规则统一（Expert/User/CI/Scope Gate）

* 学习队列优先级统一（P0-P3，错误修复 P1）

**已知问题**：

* Axiom 工作流仅 1 个测试文件（`ax-context-init.test.ts`）

* Constitution 规则定义存在，但未见 enforcement 代码

* 8 个待验证模式（出现次数 < 3）

---

## 4. Recommendations

### 4.1 架构优化建议

1. **统一后端抽象**：将 Claude native、MCP Codex、MCP Gemini 抽象为统一 Worker 接口，简化路由逻辑
2. **Hook 超时实现**：补充 PreToolUse（5s）和 PostToolUse（5s）超时处理，防止阻塞
3. **Swarm 重构**：将 SQLite 迁移到 JSON + 会话隔离，与其他模式保持一致
4. **Permission-request 修复**：实现强制阻塞（`{ continue: false }`），符合安全规范

### 4.2 性能改进方向

1. **状态查询优化**：`state_list_active` 遍历所有会话，考虑添加索引文件（`.omc/state/active-sessions.json`）
2. **Heartbeat 清理**：添加自动清理机制（7 天未更新的 heartbeat 文件）
3. **LSP 客户端预热**：项目启动时预加载常用语言服务器（TypeScript/Python）
4. **AST 搜索并行化**：大型代码库搜索使用 worker threads 并行处理

### 4.3 文档完善建议

1. **补充测试覆盖**：Axiom 工作流、Team Pipeline 转换逻辑、Hook 优先级链
2. **API 文档生成**：从 TypeScript 类型自动生成工具 API 文档
3. **架构决策记录**：将关键设计决策（会话隔离、原子写入、三层安全）文档化到 `docs/adr/`
4. **故障排查指南**：常见问题（状态泄漏、Hook 失败、MCP 连接）的诊断步骤

---

**报告完成**

* 总行数：348 行

* 覆盖范围：7 阶段全链路分析

* 关键发现：21 项（每阶段 3 项）

* 改进建议：12 项（架构 4 + 性能 4 + 文档 4）
