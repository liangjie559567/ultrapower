# Stage 2: Skills & Workflow Orchestration

## 1. Skills 系统架构

### 1.1 核心机制
- **加载方式**: 从 `skills/*/SKILL.md` 目录动态加载，支持 frontmatter 元数据
- **注册数量**: 71 个内置 skills（通过 Glob 扫描确认）
- **缓存策略**: 首次加载后缓存，避免重复文件读取
- **命名冲突**: CC 原生命令（review/plan/security-review 等）自动添加 `omc-` 前缀

### 1.2 Skill 结构
```typescript
interface BuiltinSkill {
  name: string;              // skill 名称
  description: string;       // 描述
  template: string;          // 提示词模板（markdown body）
  model?: string;            // 可选模型指定
  agent?: string;            // 可选 agent 类型
  argumentHint?: string;     // 参数提示
}
```

### 1.3 Learned Skills
- **存储位置**: `.omc/skills/` (项目级) 和 `~/.omc/skills/` (全局)
- **优先级**: 项目级 > 全局级
- **安全机制**:
  - 路径遍历防护（拒绝 `..`）
  - 内容截断（MAX_SKILL_CONTENT_LENGTH）
  - 角色边界标签过滤（防止提示词注入）

---

## 2. 关键词检测与路由

### 2.1 优先级体系（15 层）
```
P1:  cancel       (最高优先级，抑制所有其他模式)
P2:  ralph        (持久循环)
P3:  autopilot    (全自主执行)
P4:  ultrapilot   (并行构建，映射到 team)
P4.5: team        (多 agent 协调)
P5:  ultrawork    (最大并行度)
P6:  swarm        (兼容性外观，路由到 team)
P7:  pipeline     (顺序链式)
P8:  ralplan      (共识规划)
P8.5: ccg         (Claude-Codex-Gemini 编排)
P9:  plan         (战略规划)
P10: tdd          (测试驱动)
P11: ultrathink   (深度思考)
P12: deepsearch   (代码库搜索)
P13: analyze      (深度分析)
P14: codex        (委派 Codex)
P15: gemini       (委派 Gemini)
```

### 2.2 冲突解决规则
- **互斥**: `cancel` 抑制所有；`team` 覆盖 `autopilot`
- **映射**: `ultrapilot`/`swarm` → `team`（检测时自动添加 team 类型）
- **清洗**: 移除代码块、XML 标签、URL、文件路径后再检测

---

## 3. 工作流编排模式

### 3.1 Autopilot（全自主执行）
**阶段流转**:
```
expansion → planning → execution → qa → validation → complete/failed
```

**状态管理**:
- 文件: `.omc/state/autopilot-state.json`
- 关键字段: `phase`, `agent_count`, `expansion`, `planning`, `execution`, `qa`, `validation`
- 转换函数: `transitionPhase()`, `transitionRalphToUltraQA()`, `transitionToComplete()`

**信号检测**:
- 每个阶段期望特定信号（`[AUTOPILOT:EXPANSION_COMPLETE]` 等）
- `enforcement.ts` 检测信号并强制阶段转换

### 3.2 Ralph（持久循环）
**核心特性**:
- 自引用工作循环，直到所有任务完成
- 支持 PRD（产品需求文档）模式
- 可与 ultrawork/team 联动

**状态结构**:
```typescript
interface RalphLoopState {
  active: boolean;
  iteration: number;
  original_prompt: string;
  started_at: string;
  linked_to_ultrawork?: boolean;
  linked_team?: string;
  prd_mode?: boolean;
  current_story?: string;
}
```

**PRD 集成**:
- 文件: `PRD.md` 或 `.omc/PRD.md`
- 用户故事跟踪: `markStoryComplete()`, `getNextStory()`
- 进度持久化: `PROGRESS.md` 记录完成的故事和模式

### 3.3 Ultrawork（最大并行度）
**机制**:
- 持久化状态: `.omc/state/ultrawork-state.json`
- 会话隔离: 支持 `session_id` 避免跨会话泄漏
- Ralph 联动: `linked_to_ralph` 标志同步取消

**状态字段**:
```typescript
interface UltraworkState {
  active: boolean;
  started_at: string;
  original_prompt: string;
  session_id?: string;
  reinforcement_count: number;
  last_checked_at: string;
  linked_to_ralph?: boolean;
}
```

### 3.4 Team（分阶段流水线）
**阶段转换矩阵**:
```
team-plan → team-prd → team-exec → team-verify → team-fix/complete/failed
                                      ↑______________|
```

**转换守卫**:
- `team-exec`: 需要 `plan_path` 或 `prd_path` artifact
- `team-verify`: 需要 `tasks_completed >= tasks_total > 0`
- `cancelled → *`: 需要 `preserve_for_resume` 标志

**Agent 路由**:
- `team-plan`: `explore` (haiku) + `planner` (opus)
- `team-prd`: `analyst` (opus)
- `team-exec`: `executor` (sonnet) + 任务适配专家
- `team-verify`: `verifier` (sonnet) + 审查 agents
- `team-fix`: 根据缺陷类型选择 agent

**统一视图**:
- 合并 Claude 原生成员和 MCP workers
- 后端类型: `claude-native` | `mcp-codex` | `mcp-gemini`
- 心跳检测: 60s 超时判定为 dead

---

## 4. Hook 桥接与路由

### 4.1 Hook 类型（15 种）
```typescript
type HookType =
  | 'keyword-detector'      // 关键词检测
  | 'pre-tool-use'          // 工具调用前
  | 'post-tool-use'         // 工具调用后
  | 'subagent-start'        // Subagent 启动
  | 'subagent-stop'         // Subagent 停止
  | 'pre-compact'           // 压缩前
  | 'setup'                 // 设置
  | 'permission-request'    // 权限请求
  | 'session-end'           // 会话结束
  | 'stop-event'            // 停止事件
  | ...
```

### 4.2 桥接流程
1. Shell hook 读取 stdin
2. 调用 `hook-bridge.mjs --hook=<type>`
3. TypeScript 处理逻辑
4. 返回 JSON 到 stdout
5. Shell 注入到 Claude 上下文

### 4.3 输入规范化
- **字段名**: 强制 snake_case（`tool_name`, `tool_input`, `tool_response`）
- **白名单过滤**: 敏感 hook（permission-request/setup/session-end）丢弃未知字段
- **必需键验证**: 每种 hook 类型验证必需字段

---

## 5. Skill 依赖与组合

### 5.1 典型工作流
```
功能开发:
  analyst → planner → executor → test-engineer → quality-reviewer → verifier

Bug 调查:
  explore + debugger + executor + test-engineer + verifier

代码审查:
  style-reviewer + quality-reviewer + api-reviewer + security-reviewer

产品探索:
  product-manager + ux-researcher + product-analyst + designer
```

### 5.2 Skill 快捷方式
- `analyze` → `debugger` agent
- `deepsearch` → `explore` agent
- `tdd` → `test-engineer` agent
- `build-fix` → `build-fixer` agent
- `code-review` → `code-reviewer` agent
- `frontend-ui-ux` → `designer` agent（自动检测）
- `git-master` → `git-master` agent（自动检测）

### 5.3 MCP 委派检测
- 意图短语触发: "ask codex", "use gemini", "delegate to gpt"
- 自动路由到 `ask_codex` 或 `ask_gemini` MCP 工具
- 裸关键词不触发（避免误判）

---

## 6. Axiom Skills（10 个）

### 6.1 核心 Skills
```
ax-draft          需求起草
ax-review         专家评审
ax-decompose      任务拆解
ax-implement      交付流水线
ax-analyze-error  错误分析
ax-reflect        反思总结
ax-status         状态查询
ax-suspend        保存退出
ax-rollback       回滚
ax-evolution      知识库管理
```

### 6.2 门禁规则
- **Expert Gate**: 所有新功能需求必须经过 draft → review
- **User Gate**: PRD 终稿需用户确认后才能执行
- **CI Gate**: 代码修改必须通过 `tsc && build && test`
- **Scope Gate**: 修改文件需在 `manifest.md` 定义的范围内

### 6.3 进化引擎
- **触发事件**: 任务完成 → 加入 `learning_queue.md`
- **优先级**: 错误修复 P1，常规变更 P0
- **自动行为**: 状态 → ARCHIVING 时触发 `/ax-reflect`

---

## 7. 状态持久化

### 7.1 文件布局
```
{worktree}/.omc/state/
  ├── autopilot-state.json
  ├── ralph-state.json
  ├── ultrawork-state.json
  ├── team-state.json
  └── sessions/{sessionId}/
      ├── autopilot-state.json
      ├── ralph-state.json
      ├── ultrawork-state.json
      └── team-state.json
```

### 7.2 会话隔离
- 当提供 `sessionId` 时，仅读取会话级文件（无回退）
- 防止跨会话状态泄漏
- 支持并行会话独立运行

### 7.3 取消机制
- `/ultrapower:cancel` 调用清除状态
- `--force` 标志清除所有状态文件
- 联动取消: ralph + ultrawork, team + ralph

---

## 8. 关键设计模式

### 8.1 延迟加载
- MCP 工具通过 `ToolSearch` 发现后才可用
- Hook 模块按需导入（type-only imports）
- Skills 首次访问时加载并缓存

### 8.2 防御性编程
- 路径遍历防护: `assertValidMode()`, `validateProjectRoot()`
- 提示词注入防护: 过滤角色边界标签
- 优雅降级: 配置文件缺失时返回空数组

### 8.3 可观测性
- 审计日志: `auditLogger` 记录关键操作
- 使用追踪: `recordUsage()` 记录 agent/skill 调用
- 心跳检测: MCP workers 60s 超时判定

---

## 9. 性能优化

### 9.1 热路径优化
- 关键词检测、pre/post-tool-use 模块预加载
- 其他模块延迟导入（type-only imports）
- Skills 缓存避免重复文件读取

### 9.2 并行化策略
- Team 模式: 多 agent 并行执行任务
- Ultrawork: 最大并行度编排
- 后台任务: `run_in_background: true` 支持最多 20 个并发

---

## 10. 安全边界

### 10.1 输入验证
- Hook 输入白名单过滤
- 路径参数长度限制（500 字符）
- 模式名称严格校验

### 10.2 权限控制
- 状态文件权限检查
- 敏感 hook 字段过滤
- 终止开关: `DISABLE_OMC`, `OMC_SKIP_HOOKS`

### 10.3 资源限制
- Ralph 最大迭代次数限制
- Team fix 循环次数限制
- Skill 内容长度截断

---

## 总结

ultrapower 的 Skills 系统通过以下机制实现灵活的工作流编排：

1. **71 个 Skills** 动态加载，支持项目级和全局级扩展
2. **15 层优先级** 关键词检测，自动路由到合适的工作流
3. **4 种核心工作流**（autopilot/ralph/ultrawork/team）覆盖不同场景
4. **分阶段流水线**（team-plan → prd → exec → verify → fix）确保质量
5. **Hook 桥接** 实现 Shell 与 TypeScript 的无缝集成
6. **状态持久化** 支持会话隔离和跨会话恢复
7. **安全防护** 覆盖路径遍历、提示词注入、资源限制

核心设计哲学：**声明式编排 + 防御性编程 + 可观测性**。
