<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/empty-message-sanitizer/

## Purpose
空消息清理 hook。检测并过滤空白或无意义的消息，防止 agent 因空输入而产生错误或无效响应，提升交互稳定性。

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Hook 入口，拦截并过滤空消息 |
| `constants.ts` | 空消息判断规则常量 |
| `types.ts` | 类型定义 |

## For AI Agents

### 修改此目录时
- 空消息判断逻辑变更需更新对应测试用例

## Dependencies

### Internal
- `src/hooks/guards/` — 通用安全守卫

<!-- MANUAL: -->
