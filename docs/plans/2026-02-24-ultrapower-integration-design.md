# Ultrapower Integration Design

**Goal:** Merge ultrapower (OMC) multi-agent orchestration into superpowers, creating "ultrapower" — a unified plugin combining superpowers' disciplined workflow enforcement with OMC's multi-agent execution capabilities.

**Architecture:** superpowers as the discipline layer (hard gates, iron laws) + OMC as the capability layer (agents, execution modes, MCP tools).

---

## What Gets Merged

### From OMC → superpowers

| Category | Items | Action |
|---|---|---|
| TypeScript source | `src/`, `package.json`, `tsconfig.json`, `scripts/`, `bridge/` | Copy wholesale |
| Skills (41 unique) | autopilot, ralph, ultrawork, team, pipeline, etc. | Copy to `skills/` |
| Agents (30) | executor, architect, debugger, etc. | Copy to `agents/` |
| Hooks | `scripts/*.mjs`, hook templates | Integrate with existing hooks |
| MCP config | `.mcp.json` | Copy |
| Codex agents | `agents.codex/` | Copy |
| CLAUDE.md content | OMC orchestration instructions | Merge into session-start hook |

### Overlap Resolution (superpowers wins — stricter)

| OMC skill | superpowers equivalent | Resolution |
|---|---|---|
| `tdd` | `test-driven-development` | Keep superpowers version; OMC `tdd` becomes alias |
| `brainstorming` (none in OMC) | `brainstorming` | Keep superpowers version |

### superpowers Skills — Kept As-Is

All 14 superpowers skills remain unchanged (they are the discipline layer).

---

## Project Identity Changes

- Plugin name: `ultrapower`
- Description: "Disciplined multi-agent orchestration: workflow enforcement + parallel execution"
- Version: `5.0.0`
- Prefix: `ultrapower:` for skills

---

## Hook Integration Strategy

The session-start hook injects both:
1. `using-superpowers` content (existing — skill discovery)
2. OMC CLAUDE.md orchestration instructions (new — agent delegation rules)

Both injected as `EXTREMELY_IMPORTANT` context.
