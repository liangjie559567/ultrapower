<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/__tests__/

## Purpose
主测试目录。包含 ultrapower 核心功能的 TypeScript 单元测试和集成测试，覆盖 agent 注册、hooks、HUD、安装器、权限、插件等模块。

## Key Files

| File | Description |
|------|-------------|
| `*.test.ts` | 各模块单元测试文件 |
| `post-tool-verifier.test.mjs` | 工具后处理验证器测试 |

## Subdirectories

| Directory | Purpose |
|-----------|----------|
| `analytics/` | 分析模块测试 |
| `fixtures/` | 测试固定数据 |
| `helpers/` | 测试辅助工具 |
| `hooks/` | Hook 模块测试 |
| `hud/` | HUD 模块测试 |
| `learner/` | 学习器模块测试 |
| `mnemosyne/` | 记忆系统测试 |
| `providers/` | Provider 模块测试 |
| `rate-limit-wait/` | 速率限制等待测试 |
| `tools/` | 工具模块测试 |

## For AI Agents

### 修改此目录时
- 运行测试：`npm test`
- 参见父级目录了解被测模块实现

## Dependencies

### Internal
- `src/` — 相关模块
- `src/hooks/` — 相关模块
- `src/features/` — 相关模块

<!-- MANUAL: -->
