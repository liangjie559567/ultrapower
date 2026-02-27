<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hud/

## Purpose
HUD（Heads-Up Display）实现层。提供 Claude Code 终端界面的状态显示、进度指示和实时反馈功能。

## For AI Agents

### 修改此目录时
- HUD 修改需同步更新 `commands/hud.md` 和 `skills/hud/SKILL.md`
- 测试时需验证 CJK 字符的显示宽度对齐
- 参见 `src/utils/string-width.ts` 处理字符宽度

## Dependencies

### Internal
- `src/utils/string-width.ts` — 字符宽度计算
- `commands/hud.md` — HUD 命令定义
- `skills/hud/SKILL.md` — HUD skill 实现

<!-- MANUAL: -->
