<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/lib/

## Purpose
src 层内部共享库。包含核心工具函数，如模式验证（`validateMode`）、路径安全检查等安全关键函数。

## For AI Agents

### 安全关键函数
```typescript
import { assertValidMode } from './lib/validateMode';
// mode 参数必须通过此函数校验后才能用于路径拼接
const validMode = assertValidMode(mode);
```

### 修改此目录时
- `validateMode.ts` 是安全关键文件，修改需要安全审查
- 参见 `docs/standards/runtime-protection.md` 了解路径遍历防护规范

## Dependencies

### Internal
- 被 `src/hooks/`、`src/mcp/`、`src/tools/` 广泛引用

<!-- MANUAL: -->
