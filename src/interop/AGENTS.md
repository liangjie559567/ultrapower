<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/interop/

## Purpose
互操作性模块。处理 ultrapower 与其他 AI 工具（Cursor、Kiro、Gemini CLI、OpenCode 等）的集成和适配器配置。

## For AI Agents

### 支持的适配器
| 工具 | 配置文件 |
|------|---------|
| Kiro | `.kiro/steering/axiom.md` |
| Cursor | `.cursorrules` |
| Gemini | `.gemini/GEMINI.md` |
| OpenCode | `.opencode/OPENCODE.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |

### 修改此目录时
- 新增适配器需在根目录 `AGENTS.md` 的适配器文件表中记录
- 适配器内容应与 `docs/CLAUDE.md` 保持功能一致

## Dependencies

### Internal
- `docs/CLAUDE.md` — 主要编排说明（适配器内容来源）

<!-- MANUAL: -->
