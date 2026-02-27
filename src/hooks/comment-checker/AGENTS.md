<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/comment-checker/

## Purpose
注释检查 hook。检测代码变更中的注释质量，过滤无意义注释（如 "// removed"、"// TODO: fix later"），确保提交的代码注释符合项目规范。

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Hook 入口，拦截工具调用并检查注释 |
| `constants.ts` | 禁止注释模式列表和检查规则 |
| `filters.ts` | 注释过滤逻辑 |
| `types.ts` | 类型定义 |

## For AI Agents

### 修改此目录时
- 禁止注释模式变更需更新 `docs/standards/anti-patterns.md`

## Dependencies

### Internal
- `docs/standards/anti-patterns.md` — 已知反模式参考

<!-- MANUAL: -->
