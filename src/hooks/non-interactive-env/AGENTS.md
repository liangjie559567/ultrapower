<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/non-interactive-env/

## Purpose
非交互式环境检测 hook。检测当前运行环境是否为非交互式（如 CI/CD、脚本自动化），并相应调整 OMC 行为，禁用需要用户输入的功能。

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Hook 入口，检测环境并设置非交互标志 |
| `constants.ts` | 环境检测条件常量 |
| `detector.ts` | 非交互式环境检测逻辑 |
| `types.ts` | 类型定义 |

## For AI Agents

### 修改此目录时
- 环境检测逻辑变更需在 CI 环境中测试

## Dependencies

### Internal
- `src/platform/` — 平台抽象层

<!-- MANUAL: -->
