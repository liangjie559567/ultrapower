<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/thinking-block-validator/

## Purpose
思考块验证 hook。验证 agent 的思考过程（thinking block）格式是否符合规范，过滤无效或格式错误的思考块，确保推理过程的质量。

## Key Files

| File | Description |
|------|-------------|
| `constants.ts` | 思考块验证规则和格式常量 |

## For AI Agents

### 修改此目录时
- 验证规则变更需测试各类 agent 的思考块输出

## Dependencies

### Internal
- `src/hooks/think-mode/` — 增强推理模式 hook

<!-- MANUAL: -->
