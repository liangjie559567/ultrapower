<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/magic-keywords/

## Purpose
魔法关键词定义模块。维护触发特定执行模式的关键词列表和冲突解决规则，是关键词检测系统的数据源。

## For AI Agents

### 关键词分类
| 类别 | 关键词示例 | 触发模式 |
|------|-----------|---------|
| 自主执行 | "autopilot"、"build me" | autopilot |
| 持续执行 | "ralph"、"don't stop" | ralph |
| 并行执行 | "ulw"、"ultrawork" | ultrawork |
| 规划 | "plan this"、"plan the" | plan |

### 修改此目录时
- 新增关键词需更新 `docs/REFERENCE.md` 的魔法关键词部分
- 关键词冲突解决规则：显式 > 通用 > 默认配置

## Dependencies

### Internal
- `src/hooks/keyword-detector/` — 关键词检测 hook
- `scripts/keyword-detector.mjs` — 脚本层检测

<!-- MANUAL: -->
