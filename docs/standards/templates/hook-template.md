# Hook 模板

> 复制此模板创建新 hook。删除所有 `<!-- 注释 -->` 后提交。

---

## 目录结构

```
src/hooks/hook-name/
├── index.ts        # Hook 主逻辑
└── README.md       # Hook 说明（可选）
```

## index.ts 模板

```typescript
/**
 * hook-name hook
 *
 * 触发事件：HookEventName
 * 职责：一句话描述此 hook 的职责
 */

import type { HookInput } from '../types';

// Hook 输入类型（根据事件类型定义）
export interface HookNameInput {
  session_id: string;
  cwd: string;
  hook_event_name: 'HookEventName';
  // 添加其他字段
}

/**
 * Hook 主处理函数
 */
export async function processHookName(input: HookNameInput): Promise<void> {
  // 1. 验证输入
  if (!input.session_id) {
    throw new Error('Missing required field: session_id');
  }

  // 2. 核心逻辑
  // ...

  // 3. 输出结果（如需要）
}
```

---

## 填写说明

| 字段 | 要求 |
|------|------|
| 触发事件 | 对应 Claude Code SDK 的 hook 事件名 |
| 输入类型 | 使用 snake_case 字段名（SDK 规范） |
| 必需字段验证 | 在函数入口验证所有必需字段 |

## Hook 事件类型参考

| 事件 | 触发时机 | 必需字段 |
|------|---------|---------|
| `PreToolUse` | 工具调用前 | `tool_name`, `tool_input` |
| `PostToolUse` | 工具调用后 | `tool_name`, `tool_response` |
| `SubagentStop` | Subagent 停止 | `agent_id`, `agent_type` |
| `SessionEnd` | 会话结束 | `session_id`, `directory` |

## 安全注意事项

- 敏感 hook 字段通过 bridge-normalize 白名单过滤，未知字段被丢弃
- 不在白名单中的字段不可依赖
- `SubagentStop` 事件的 `success` 字段已废弃，使用 `input.success !== false` 推断
