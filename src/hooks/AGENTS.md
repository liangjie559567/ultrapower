<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-28 | Updated: 2026-01-31 -->

# hooks

35 个事件驱动 hook，驱动执行模式和行为。

## 用途

Hook 拦截 Claude Code 事件以实现：
- **执行模式**：autopilot、ultrawork、ralph、ultrapilot、swarm、pipeline（mode-registry）
- **验证**：thinking block、空消息、注释
- **恢复**：编辑错误、会话恢复、上下文窗口
- **增强**：规则注入、目录 README、notepad
- **检测**：关键词、think 模式、slash 命令

## 关键文件

| 文件 | 描述 |
|------|------|
| `index.ts` | 重新导出所有 hook |
| `bridge.ts` | Shell 脚本入口 - `processHook()` 将事件路由到处理器 |

## 子目录

### 执行模式 Hook

| 目录 | 用途 | 触发条件 |
|------|------|---------|
| `autopilot/` | 完全自主执行 | "autopilot"、"build me" |
| `ultrawork/` | 最大并行执行 | "ulw"、"ultrawork" |
| `ralph/` | 持续执行直到验证通过 | "ralph"、"don't stop" |
| `ultrapilot/` | 带文件所有权的并行 autopilot | "ultrapilot" |
| `swarm/` | N 个协调 agent 带任务认领 | "swarm N agents" |
| `ultraqa/` | QA 循环直到目标达成 | 测试失败 |
| `mode-registry/` | 追踪活跃执行模式 | 内部 |
| `persistent-mode/` | 跨会话维护模式状态 | 内部 |

### 验证 Hook

| 目录 | 用途 |
|------|------|
| `thinking-block-validator/` | 验证响应中的 thinking block |
| `empty-message-sanitizer/` | 处理空/空白消息 |
| `comment-checker/` | 检查代码注释质量 |
| `permission-handler/` | 处理权限请求和验证 |

### 恢复 Hook

| 目录 | 用途 |
|------|------|
| `recovery/` | 编辑错误恢复、会话恢复 |
| `preemptive-compaction/` | 防止上下文溢出 |
| `pre-compact/` | 压缩前处理 |

### 增强 Hook

| 目录 | 用途 |
|------|------|
| `rules-injector/` | 注入匹配的规则文件 |
| `directory-readme-injector/` | 注入目录 README |
| `notepad/` | 持久化笔记以应对压缩 |
| `learner/` | 从对话中提取 skill |
| `agent-usage-reminder/` | 提醒 agent 委派 |

### 检测 Hook

| 目录 | 用途 |
|------|------|
| `keyword-detector/` | 魔法关键词检测 |
| `think-mode/` | 扩展 thinking 检测 |
| `auto-slash-command/` | Slash 命令扩展 |
| `non-interactive-env/` | 非交互式环境检测 |
| `plugin-patterns/` | 插件模式检测 |

### 协调 Hook

| 目录 | 用途 |
|------|------|
| `todo-continuation/` | 强制任务完成 |
| `omc-orchestrator/` | 编排器行为 |
| `subagent-tracker/` | 追踪已生成的子 agent |
| `session-end/` | 会话终止处理 |
| `background-notification/` | 后台任务通知 |

### 设置 Hook

| 目录 | 用途 |
|------|------|
| `setup/` | 初始设置和配置 |

## 面向 AI Agent

### 在此目录中工作

#### Hook 结构

每个 hook 遵循标准模式：
```
hook-name/
├── index.ts     # 主 hook 实现
├── types.ts     # TypeScript 接口
├── constants.ts # 配置常量
└── *.ts         # 支持模块
```

#### 添加新 Hook 时

1. 创建包含 `index.ts`、`types.ts`、`constants.ts` 的 hook 目录
2. 从 `index.ts` 导出（hook 重新导出）
3. 如需要，在 `bridge.ts` 中注册处理器
4. 更新 `docs/REFERENCE.md`（Hooks System 部分）添加新 hook 条目
5. 如果是执行模式 hook，还需创建 `skills/*/SKILL.md` 和 `commands/*.md`

#### Hook 实现

```typescript
// index.ts
export interface HookConfig {
  enabled: boolean;
  // hook 特定配置
}

export function createHook(config: HookConfig) {
  return {
    name: 'hook-name',
    event: 'UserPromptSubmit',  // 或 'Stop'、'PreToolUse'、'PostToolUse'
    handler: async (context) => {
      // Hook 逻辑
      return { modified: false };
    }
  };
}
```

#### 关键 Hook 说明

**autopilot/** - 完全自主执行：
- 验证目标并创建计划
- 管理执行状态
- 处理取消
- 强制完成

**ralph/** - 持久化机制：
- 通过 PRD 追踪进度
- 生成 architect 进行验证
- 循环直到验证完成
- 支持结构化 PRD 格式

**ultrapilot/** - 并行 autopilot：
- 将任务分解为子任务
- 为工作者分配文件所有权
- 协调并行执行
- 整合结果

**swarm/** - 协调多 agent：
- 基于 SQLite 的任务认领
- 每个任务 5 分钟超时
- 原子认领/释放
- 干净的完成检测

**learner/** - Skill 提取：
- 检测对话中的 skill 模式
- 提取到本地 skill 文件
- 自动调用匹配的 skill
- 管理 skill 生命周期

### 常见模式

#### 状态管理

```typescript
import { readState, writeState } from '../features/state-manager';

const state = readState('autopilot-state');
state.phase = 'executing';
writeState('autopilot-state', state);
```

#### 事件处理

```typescript
// UserPromptSubmit - 提示词发送前
// Stop - 会话结束前
// PreToolUse - 工具执行前
// PostToolUse - 工具执行后
```

### 测试要求

- 用 `npm test -- --grep "hook-name"` 测试特定 hook
- 通过 skill 调用端到端测试执行模式
- 验证 `.omc/state/` 中的状态持久化
- 对于安全 hook，遵循 `templates/rules/security.md` 检查清单

## 依赖

### 内部
- `features/state-manager/` 用于状态持久化
- `features/verification/` 用于验证协议
- `agents/` 用于生成子 agent

### 外部
| 包 | 用途 |
|----|------|
| `better-sqlite3` | Swarm 任务协调 |
| `fs`, `path` | 状态文件操作 |

## Hook 事件

| 事件 | 触发时机 | 常见用途 |
|------|---------|---------|
| `UserPromptSubmit` | 提示词处理前 | 关键词检测、模式激活 |
| `Stop` | 会话结束前 | 继续执行强制 |
| `PreToolUse` | 工具执行前 | 权限验证 |
| `PostToolUse` | 工具执行后 | 错误恢复、规则注入 |

### Stop Hook 输出契约

persistent-mode stop hook 使用**软强制**：

```typescript
// Stop hook 始终返回 continue: true
// 强制通过消息注入实现，而非阻塞
return {
  continue: true,
  message: result.message || undefined  // 注入到上下文中
};
```

**为何使用软强制**：硬阻塞（`continue: false`）会阻止上下文压缩，可能导致 Claude Code 死锁。

**绕过条件**（优先检查，允许停止）：
1. `context-limit` - 上下文窗口耗尽，必须允许压缩
2. `user-abort` - 用户明确请求停止

**模式优先级**（绕过检查后，可能注入继续消息）：
1. Ralph（显式持久化循环）
2. Autopilot（完全编排）
3. Ultrapilot（并行工作者）
4. Swarm（协调 agent）
5. Pipeline（顺序阶段）
6. UltraQA（测试循环）
7. Ultrawork（并行执行）

**会话隔离**：Hook 仅对匹配 `session_id` 的会话强制执行。超过 2 小时的过期状态将被忽略。

**模式完成标准**：当 `state.active === true && state.session_id === currentSession && !isStaleState()` 时 hook 阻塞。运行 `/cancel` 将 `active` 设为 `false` 并删除状态文件。

## 状态文件

| Hook | 状态文件 |
|------|---------|
| autopilot | `.omc/state/autopilot-state.json` |
| ultrapilot | `.omc/state/ultrapilot-state.json` |
| ralph | `.omc/state/ralph-state.json` |
| swarm | `.omc/state/swarm-tasks.db`（SQLite） |
| learner | `~/.claude/local-skills/` |

<!-- MANUAL: -->
