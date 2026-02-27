<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# skills/writer-memory/lib/

## Purpose
Writer Memory 核心库目录。包含面向作家的智能记忆系统的 TypeScript 实现，提供角色追踪、关系图谱、场景组织和故事梗概构建功能。

## Key Files

| File | Description |
|------|-------------|
| `character-tracker.ts` | 角色信息追踪，管理角色属性、弧线和出场记录 |
| `memory-manager.ts` | 记忆系统核心，协调各模块的读写操作 |
| `relationship-graph.ts` | 角色关系图谱，追踪人物间的关系网络 |
| `scene-organizer.ts` | 场景组织器，管理场景列表和时间线 |
| `synopsis-builder.ts` | 故事梗概构建器，自动生成章节摘要 |

## For AI Agents

### 修改此目录时
- 参见 `skills/writer-memory/SKILL.md` 了解整体工作流
- 参见 `templates/` 了解数据模板格式

## Dependencies

### Internal
- `skills/writer-memory/` — 父级 writer-memory skill

<!-- MANUAL: -->
