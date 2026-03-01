# Comprehensive Documentation Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fully update all ultrapower documentation to reflect v5.5.5 — rewrite three main docs, fill CHANGELOG gaps, fix version drift in standards/, and remove stale files.

**Architecture:** Parallel execution — Tasks 2/3/4/5/6/7 are fully independent and can be dispatched in parallel; Tasks 8/9/10 are serial cleanup steps that run after all parallel tasks complete.

**Tech Stack:** Markdown, Node.js 20+, git, gh CLI, npm

---

## Pre-flight: Key Numbers (v5.5.5)

- **Agents:** 49 (50 .md files, 1 is templates/base-agent.md)
- **Skills:** 71 (72 directories, 1 is superpowers/ parent)
- **Hooks:** 35 (36 index.ts files counting index of index)
- **Custom Tools:** 35 (8 categories: LSP×12, AST×2, Python×1, Notepad×6, State×5, ProjectMemory×4, Trace×2, Skills×3)
- **Version:** 5.5.5

---

## Task 1: Create feature branch

**Files:**
- No file changes

**Step 1: Create branch from dev**

```bash
git checkout dev
git pull origin dev
git checkout -b docs/v5.5.5-comprehensive-update
```

Expected: switched to new branch `docs/v5.5.5-comprehensive-update`

**Step 2: Verify clean state**

```bash
git status
```

Expected: nothing to commit

---

## Task 2: Rewrite docs/REFERENCE.md

**Files:**
- Modify: `docs/REFERENCE.md` (full rewrite)
- Read first: `src/agents/definitions.ts`, `agents/*.md`, `skills/*/SKILL.md`, `src/tools/index.ts`, `src/mcp/omc-tools-server.ts`

**Step 1: Read current file and key sources**

Read `docs/REFERENCE.md` (current), `src/agents/definitions.ts`, `AGENTS.md` (root), `src/tools/index.ts`.

**Step 2: Rewrite REFERENCE.md**

Write the full file following this structure. All counts must match actual code:

```markdown
<!-- version: 5.5.5, updated: 2026-03-02 -->
# ultrapower Reference Manual — v5.5.5

## Table of Contents
1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Execution Modes](#execution-modes)
4. [Agents (49)](#agents)
5. [Skills (71)](#skills)
6. [Custom Tools (35)](#custom-tools)
7. [Hooks System (35)](#hooks-system)
8. [MCP Integration](#mcp-integration)
9. [Security Rules](#security-rules)

---

## Installation

### As Claude Code Plugin (recommended)
Add to `.mcp.json`:
\`\`\`json
{
  "mcpServers": {
    "ultrapower": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@liangjie559567/ultrapower"]
    }
  }
}
\`\`\`

### Global npm install
\`\`\`bash
npm install -g @liangjie559567/ultrapower
ultrapower install
\`\`\`

---

## Configuration

Config file: `~/.claude/.omc-config.json`

\`\`\`json
{
  "defaultExecutionMode": "ultrawork",
  "hudEnabled": true,
  "mcpServers": {
    "context7": { "enabled": true },
    "exa": { "enabled": true, "apiKey": "..." }
  }
}
\`\`\`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `defaultExecutionMode` | string | `"ultrawork"` | Default execution mode when "fast"/"parallel" detected |
| `hudEnabled` | boolean | `true` | Enable/disable HUD status line |

---

## Execution Modes

| Mode | Trigger Keywords | Description |
|------|-----------------|-------------|
| `autopilot` | "autopilot", "build me", "I want a" | Fully autonomous execution from idea to running code |
| `ultrawork` | "ulw", "ultrawork" | Maximum parallel agent orchestration |
| `ralph` | "ralph", "don't stop", "must complete" | Self-referential loop with verifier validation |
| `ultrapilot` | "ultrapilot", "parallel build" | Team compatibility shim with file ownership |
| `swarm` | "swarm" | Team compatibility shim preserving /swarm syntax |
| `pipeline` | "pipeline", "chain agents" | Sequential agent chain with data passing |

---

## Agents

Total: **49 agents** across 6 lanes. Use `ultrapower:` prefix in Task subagent_type.

### Build/Analysis Lane (8)

| Agent | Model | Purpose |
|-------|-------|---------|
| `explore` | haiku | Codebase discovery, symbol/file mapping |
| `analyst` | opus | Requirements clarification, acceptance criteria |
| `planner` | opus | Task ordering, execution plans, risk flagging |
| `architect` | opus | System design, boundaries, interfaces, trade-offs |
| `debugger` | sonnet | Root cause analysis, regression isolation |
| `executor` | sonnet | Code implementation, refactoring, feature dev |
| `deep-executor` | opus | Complex autonomous goal-directed tasks |
| `verifier` | sonnet | Completion evidence, claim verification |

### Review Lane (6)

| Agent | Model | Purpose |
|-------|-------|---------|
| `style-reviewer` | haiku | Formatting, naming, idioms, lint rules |
| `quality-reviewer` | sonnet | Logic defects, maintainability, anti-patterns |
| `api-reviewer` | sonnet | API contracts, versioning, backward compat |
| `security-reviewer` | sonnet | Vulnerabilities, trust boundaries, auth/authz |
| `performance-reviewer` | sonnet | Hotspots, complexity, memory/latency |
| `code-reviewer` | opus | Cross-cutting comprehensive review |

### Domain Specialists (16)

| Agent | Model | Purpose |
|-------|-------|---------|
| `dependency-expert` | sonnet | External SDK/API/package evaluation |
| `test-engineer` | sonnet | Test strategy, coverage, flaky test hardening |
| `quality-strategist` | sonnet | Quality strategy, release readiness, risk |
| `build-fixer` | sonnet | Build/toolchain/type failure fixes |
| `designer` | sonnet | UX/UI architecture, interaction design |
| `writer` | haiku | Docs, migration notes, user guides |
| `qa-tester` | sonnet | Interactive CLI/service runtime validation |
| `scientist` | sonnet | Data/statistical analysis |
| `document-specialist` | sonnet | External docs and reference lookup |
| `git-master` | sonnet | Commit strategy, history management |
| `vision` | sonnet | Image/screenshot/diagram analysis |
| `database-expert` | sonnet | DB design, query optimization, migrations |
| `devops-engineer` | sonnet | CI/CD, containerization, IaC |
| `i18n-specialist` | sonnet | Internationalization and localization |
| `accessibility-auditor` | sonnet | Web accessibility, WCAG compliance |
| `api-designer` | sonnet | REST/GraphQL API design and contracts |

### Product Lane (4)

| Agent | Model | Purpose |
|-------|-------|---------|
| `product-manager` | sonnet | Problem framing, user personas/JTBD, PRD |
| `ux-researcher` | sonnet | Heuristic audits, usability, accessibility |
| `information-architect` | sonnet | Taxonomy, navigation, discoverability |
| `product-analyst` | sonnet | Product metrics, funnel analysis, experiments |

### Axiom Lane (14)

| Agent | Model | Purpose |
|-------|-------|---------|
| `axiom-requirement-analyst` | sonnet | Three-state gate: PASS/CLARIFY/REJECT |
| `axiom-product-designer` | sonnet | Draft PRD + Mermaid flow diagram |
| `axiom-review-aggregator` | sonnet | 5-expert parallel review + conflict arbitration |
| `axiom-prd-crafter` | sonnet | Engineering-grade PRD with gate validation |
| `axiom-system-architect` | sonnet | Atomic task DAG + Manifest generation |
| `axiom-evolution-engine` | sonnet | Knowledge harvesting, pattern detection |
| `axiom-context-manager` | sonnet | 7-operation memory system |
| `axiom-worker` | sonnet | PM→Worker protocol, 3-state output |
| `axiom-ux-director` | sonnet | UX/experience expert review |
| `axiom-product-director` | sonnet | Product strategy expert review |
| `axiom-domain-expert` | sonnet | Domain knowledge expert review |
| `axiom-tech-lead` | sonnet | Technical feasibility review |
| `axiom-critic` | sonnet | Security/quality/logic review |
| `axiom-sub-prd-writer` | sonnet | Decompose Manifest tasks into executable Sub-PRDs |

### Coordination (1)

| Agent | Model | Purpose |
|-------|-------|---------|
| `critic` | opus | Critical challenge of plans/designs |

### Deprecated Aliases

| Alias | Maps To |
|-------|---------|
| `researcher` | `document-specialist` |
| `tdd-guide` | `test-engineer` |

---

## Skills

Total: **71 skills**. Invoke with `/ultrapower:<name>` or via Skill tool.

### Workflow Skills

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `autopilot` | "autopilot", "build me", "I want a" | Full autonomous execution |
| `ralph` | "ralph", "don't stop", "must complete" | Persistent loop with verifier |
| `ultrawork` | "ulw", "ultrawork" | Max parallel agent orchestration |
| `team` | "team", "coordinated team" | N coordinated agents, phase-aware routing |
| `swarm` | "swarm" | Team compatibility shim |
| `ultrapilot` | "ultrapilot", "parallel build" | Team compatibility shim |
| `pipeline` | "pipeline", "chain agents" | Sequential agent chain |
| `ultraqa` | (activated by autopilot) | QA loop: test, verify, fix, repeat |
| `plan` | "plan this", "plan the" | Strategic planning with --consensus/--review |
| `ralplan` | "ralplan", "consensus plan" | Alias for /plan --consensus |
| `sciomc` | "sciomc" | Parallel scientist agents |
| `external-context` | — | Parallel document-specialist web search |
| `deepinit` | "deepinit" | Deep codebase init with layered AGENTS.md |
| `next-step-router` | — | Recommend optimal next skill/agent at decision points |

### Axiom Skills

| Skill | Command | Purpose |
|-------|---------|---------|
| `ax-draft` | `/ax-draft` | Requirements → Draft PRD → user confirmation |
| `ax-review` | `/ax-review` | 5-expert review → aggregation → Rough PRD |
| `ax-decompose` | `/ax-decompose` | Rough PRD → atomic task DAG |
| `ax-implement` | `/ax-implement` | Execute Manifest tasks with CI gates |
| `ax-analyze-error` | `/ax-analyze-error` | Root cause diagnosis → auto-fix |
| `ax-reflect` | `/ax-reflect` | Session reflection → knowledge harvesting |
| `ax-evolve` | `/ax-evolve` | Process learning queue → update knowledge base |
| `ax-status` | `/ax-status` | Full system status dashboard |
| `ax-rollback` | `/ax-rollback` | Roll back to last checkpoint |
| `ax-suspend` | `/ax-suspend` | Save state, safe exit |
| `ax-context` | `/ax-context` | Direct Axiom memory operations |
| `ax-evolution` | `/ax-evolution` | Evolution engine unified entry |
| `ax-knowledge` | `/ax-knowledge` | Query knowledge base |
| `ax-export` | `/ax-export` | Export Axiom workflow artifacts |

### Agent Shortcut Skills

| Skill | Maps To | Auto-trigger |
|-------|---------|-------------|
| `analyze` | `debugger` | "analyze", "debug", "investigate" |
| `deepsearch` | `explore` | "search", "find in codebase" |
| `tdd` | `test-engineer` | "tdd", "test first", "red green" |
| `build-fix` | `build-fixer` | "fix build", "type errors" |
| `code-review` | `code-reviewer` | "review code" |
| `security-review` | `security-reviewer` | "security review" |
| `frontend-ui-ux` | `designer` | UI/component/styling work (auto) |
| `git-master` | `git-master` | git/commit work (auto) |
| `review` | `plan --review` | "review plan", "critique plan" |

### Utility Skills

`cancel`, `note`, `learner`, `omc-setup`, `mcp-setup`, `hud`, `omc-doctor`, `omc-help`, `trace`, `release`, `project-session-manager` (psm), `skill`, `writer-memory`, `ralph-init`, `learn-about-omc`, `brainstorm`, `wizard`

### Superpowers Skills

`brainstorming`, `systematic-debugging`, `test-driven-development`, `writing-plans`, `writing-skills`, `using-superpowers`, `using-git-worktrees`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `dispatching-parallel-agents`, `executing-plans`, `finishing-a-development-branch`, `subagent-driven-development`, `next-step-router`

---

## Custom Tools

Total: **35 tools** exposed via `mcp__plugin_ultrapower_t__` prefix.

### LSP Tools (12)

```
lsp_hover                  — Type info and docs at position
lsp_goto_definition        — Jump to definition
lsp_find_references        — Find all usages
lsp_document_symbols       — File outline
lsp_workspace_symbols      — Cross-workspace symbol search
lsp_diagnostics            — Per-file errors/warnings
lsp_diagnostics_directory  — Project-level type check
lsp_servers                — List available language servers
lsp_prepare_rename         — Check if rename is valid
lsp_rename                 — Preview multi-file rename
lsp_code_actions           — Available refactors/fixes
lsp_code_action_resolve    — Get action details
```

Supported languages: TypeScript, Python, Rust, Go, C/C++, Java, JSON, HTML, CSS, YAML

### AST Tools (2)

```
ast_grep_search   — Pattern match with meta-variables ($NAME, $$$ARGS)
ast_grep_replace  — AST-aware code transformation (dry-run by default)
```

Supported: JS, TS, TSX, Python, Ruby, Go, Rust, Java, Kotlin, Swift, C, C++, C#, HTML, CSS, JSON, YAML

### Python REPL (1)

```
python_repl — Persistent Python REPL with pandas/numpy/matplotlib
```

### Notepad Tools (6) — Session Memory

```
notepad_read              — Read notepad (sections: all/priority/working/manual)
notepad_write_priority    — Write priority context (≤500 chars, auto-loaded at session start)
notepad_write_working     — Write working memory (timestamped, auto-pruned after 7 days)
notepad_write_manual      — Write manual notes (permanent)
notepad_prune             — Clean working memory older than N days
notepad_stats             — Get notepad statistics
```

Storage: `{worktree}/.omc/notepad.md`

### State Tools (5) — Execution Mode State

```
state_read          — Read state for a mode
state_write         — Write/update mode state
state_clear         — Clear mode state file
state_list_active   — List all active modes
state_get_status    — Get detailed status for mode(s)
```

Supported modes: `autopilot`, `ultrapilot`, `team`, `pipeline`, `ralph`, `ultrawork`, `ultraqa`, `ralplan`

### Project Memory Tools (4)

```
project_memory_read          — Read project memory (sections: techStack/build/conventions/structure/notes/directives)
project_memory_write         — Write/update project memory (merge-aware)
project_memory_add_note      — Add categorized note
project_memory_add_directive — Add user directive (persistent across sessions)
```

Storage: `{worktree}/.omc/project-memory.json`

### Trace Tools (2)

```
trace_timeline  — Chronological agent flow trace
trace_summary   — Session aggregate stats
```

### Skills Tools (3)

```
load_omc_skills_local   — Load OMC skills from project local
load_omc_skills_global  — Load OMC skills from global install
list_omc_skills         — List all available skills
```

### Disabling Tools

```bash
OMC_DISABLE_TOOLS=lsp,python-repl,project-memory
```

Groups: `lsp`, `ast`, `python`/`python-repl`, `trace`, `state`, `notepad`, `memory`/`project-memory`, `skills`

---

## Hooks System

Total: **35 hooks** in `src/hooks/`.

### Core Hooks

| Hook | Event | Purpose |
|------|-------|---------|
| `bridge-normalize` | all | Normalize snake_case input, whitelist filtering for SENSITIVE_HOOKS |
| `keyword-detector` | PreToolUse | Magic keyword detection → skill activation |
| `pre-tool-use` | PreToolUse | Path safety, delegation enforcement |
| `post-tool-use` | PostToolUse | Subagent tracking, result processing |
| `session-start` | SessionStart | Bootstrap memory, inject context |
| `session-end` | SessionEnd | Cleanup, state archiving |

### Mode Hooks

| Hook | Purpose |
|------|---------|
| `autopilot/` | Full autonomous execution loop |
| `ralph/` | Persistent execution with verifier |
| `ultrawork/` | Parallel agent orchestration |
| `ultrapilot/` | Team-based parallel with ownership |
| `learner/` | Skill extraction from patterns |
| `recovery/` | Error recovery (session-recovery.ts returns false — not yet implemented) |
| `rules-injector/` | Rule file injection with MAX_TRAVERSAL_DEPTH=5 guard |
| `think-mode/` | Enhanced reasoning injection |
| `axiom-boot/` | Session-start: inject Axiom memory context |
| `axiom-guards/` | Gate rule enforcement |

### Security Guarantees

- Hook inputs use snake_case: `tool_name`, `tool_input`, `tool_response`, `session_id`, `cwd`, `hook_event_name`
- Kill switch: `DISABLE_OMC` (all hooks), `OMC_SKIP_HOOKS` (comma-separated names)
- `SENSITIVE_HOOKS` types (permission-request, setup, session-end) bypass fast path in bridge-normalize
- Required key validation per hook event type

---

## MCP Integration

### Available Providers

| Provider | Tool | Best For |
|----------|------|---------|
| Codex | `mcp__x__ask_codex` | Architecture review, planning, code review |
| Gemini | `mcp__g__ask_gemini` | UI/UX design, large-context (1M tokens) |
| sequential-thinking | `mcp__sequential-thinking__*` | Step-by-step reasoning |
| software-planning-tool | `mcp__software-planning-tool__*` | Task planning and decomposition |

### Tool Discovery

MCP tools are lazy-loaded. Before first use:
```
ToolSearch("mcp")  — discover all MCP tools
```

### Usage Pattern

```typescript
mcp__x__ask_codex({
  agent_role: "architect",
  prompt: "Review this module boundary",
  context_files: ["src/hooks/bridge.ts"]
})
```

---

## Security Rules

### 1. Path Traversal Protection

`mode` parameter must pass `assertValidMode()` before path concatenation:

```typescript
import { assertValidMode } from './src/lib/validateMode';
const validMode = assertValidMode(mode);
const path = `.omc/state/${validMode}-state.json`;
```

### 2. Hook Input Sanitization

All hook inputs pass through `bridge-normalize.ts` whitelist filter. Unknown fields are discarded. SENSITIVE_HOOKS types (permission-request, setup, session-end) never use the fast path.

### 3. SubagentStop Inference

```typescript
// WRONG:
if (input.success) { ... }

// CORRECT:
if (input.success !== false) { ... }
```

### 4. Shell Injection Prevention

LSP servers.ts uses `execFileSync` (not `execSync`) for all command execution. No user input is interpolated into shell strings.

### 5. Write Path Restrictions

`src/hooks/guards/pre-tool.ts` blocks writes to:
- `path.resolve(filePath).startsWith(path.join(os.homedir(), '.claude'))`
- Paths containing `node_modules`
```

**Step 3: Verify counts match code**

```bash
# Verify agent count
ls agents/*.md | grep -v templates | wc -l
# Expected: 49 (50 total - 1 template)

# Verify skills count
ls skills/ | grep -v superpowers | wc -l
# Expected: 71 (72 - 1 superpowers parent)
```

**Step 4: Commit**

```bash
git add docs/REFERENCE.md
git commit -m "docs: rewrite REFERENCE.md for v5.5.5 (49 agents, 71 skills, 35 tools)"
```

---

## Task 3: Rewrite docs/ARCHITECTURE.md

**Files:**
- Modify: `docs/ARCHITECTURE.md` (full rewrite)
- Read first: `src/hooks/bridge.ts`, `src/hooks/bridge-normalize.ts`, `src/features/delegation-enforcer.ts`, `src/tools/state-tools.ts`, `src/lib/validateMode.ts`

**Step 1: Read current file and key sources**

Read `docs/ARCHITECTURE.md` (current) and the source files listed above.

**Step 2: Rewrite ARCHITECTURE.md**

```markdown
<!-- version: 5.5.5, updated: 2026-03-02 -->
# ultrapower Architecture — v5.5.5

## System Overview

ultrapower sits as an orchestration layer between the user and Claude Code, injecting specialized agent workflows, safety guards, and persistent memory through the Claude Code hooks system.

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code CLI                          │
├─────────────────────────────────────────────────────────────┤
│                  ultrapower                                 │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │   Skills    │   Agents    │    Tools    │   Hooks     │  │
│  │ (71 skills) │ (49 agents) │(LSP/AST/REPL)│ (35 hooks)  │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Features Layer                             ││
│  │ model-routing | boulder-state | verification | notepad  ││
│  │ delegation-enforcer | task-decomposer | state-manager   ││
│  │ rate-limit-wait | python-repl | rules-injector          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## Core Pipeline

### 1. Hook Bridge (`src/hooks/bridge.ts`)

Entry point for all Claude Code hook events. Flow:

\`\`\`
Hook Event → bridge-normalize → keyword-detector → pre-tool-use guards
                                                 → mode-specific hooks
                                                 → delegation-enforcer
                                                 → post-processing
\`\`\`

**bridge-normalize** (`src/hooks/bridge-normalize.ts`):
- Converts all hook input fields to camelCase
- Applies field whitelist per hook type
- **Security (v5.5.0):** `SENSITIVE_HOOKS` types (permission-request, setup, session-end) bypass the `isAlreadyCamelCase()` fast path, forcing full Zod validation. This prevents malicious camelCase inputs from bypassing whitelist checks.

```typescript
const SENSITIVE_HOOKS = new Set(['permission-request', 'setup', 'session-end']);
if (!SENSITIVE_HOOKS.has(hookType) && isAlreadyCamelCase(input)) {
  return input; // fast path — only for non-sensitive hooks
}
```

### 2. Delegation Enforcer (`src/features/delegation-enforcer.ts`)

**Added in v5.5.2.** Intercepts `pre-tool-use` for `Task`/`Agent` tool calls. When no `model` parameter is specified, automatically injects the appropriate default:

| Agent Type | Auto-injected Model |
|-----------|-------------------|
| `explore`, `style-reviewer`, `writer` | `haiku` |
| `executor`, `debugger`, `verifier`, and most others | `sonnet` |
| `architect`, `analyst`, `planner`, `deep-executor`, `critic`, `code-reviewer` | `opus` |

Explicit `model` parameters are never overridden.

### 3. State Manager (`src/tools/state-tools.ts`)

Manages execution mode state files at `{worktree}/.omc/state/{mode}-state.json`.

**Security (v5.5.0):** `assertValidMode()` validates the `mode` parameter against a strict whitelist before any path construction:

```typescript
// src/lib/validateMode.ts
const VALID_MODES = new Set([
  'autopilot', 'ultrapilot', 'team', 'pipeline',
  'ralph', 'ultrawork', 'ultraqa', 'ralplan'
]);

export function assertValidMode(mode: string): string {
  if (!VALID_MODES.has(mode)) {
    throw new Error(`Invalid mode: ${mode}. Valid modes: ${[...VALID_MODES].join(', ')}`);
  }
  return mode;
}
```

---

## Feature Layer

### rate-limit-wait (`src/features/rate-limit-wait/daemon.ts`)

Background daemon for rate limit management.

**v5.5.0 fixes:**
- **Windows ESM import:** `pathToFileURL(modulePath).href` replaces raw Windows path in `import()` calls
- **Config injection:** Config is written to a UUID-named tmpfile via `os.tmpdir()` and passed via env var, replacing the previous `JSON.stringify` code injection pattern

### python-repl (`src/tools/python-repl/tool.ts`)

Persistent Python REPL with pandas/numpy/matplotlib.

**v5.5.1 fix:** `handleReset` and `killBridgeWithEscalation` now call `executionCounters.delete(sessionId)` after success, preventing memory leak in long-running sessions.

### LSP Client (`src/tools/lsp/client.ts`)

**v5.5.0 fixes:**
- `disconnect()` iterates all pending timers with `clearTimeout` before `Map.clear()`
- Buffer has a 64MB hard cap; exceeding it disconnects the client with a warning

### rules-injector (`src/hooks/rules-injector/finder.ts`)

Recursively finds rule files to inject into agent context.

**v5.5.4 fix:** `MAX_TRAVERSAL_DEPTH = 5` prevents infinite recursion on symlink loops.

---

## Axiom System

### State Machine

```
IDLE → PLANNING → CONFIRMING → EXECUTING → AUTO_FIX → BLOCKED → ARCHIVING → IDLE
```

| State | Trigger | Action |
|-------|---------|--------|
| IDLE | User request | Load context, route to workflow |
| PLANNING | /ax-draft or /ax-decompose | Requirements clarification loop |
| CONFIRMING | PRD complete | User gate: "Confirm execution?" |
| EXECUTING | User confirms | ax-implement: run Manifest tasks |
| AUTO_FIX | CI Gate fails | Up to 3 self-repair attempts |
| BLOCKED | 3 failures | Halt, request human intervention |
| ARCHIVING | All tasks done | Trigger ax-reflect, update knowledge |

### Memory Architecture

```
{worktree}/.omc/axiom/
├── active_context.md       — Current task state (short-term)
├── project_decisions.md    — Architecture decision records (long-term)
├── user_preferences.md     — User preferences
├── state_machine.md        — State machine definition
├── reflection_log.md       — Reflection journal
└── evolution/
    ├── knowledge_base.md   — Knowledge graph (confidence system)
    ├── pattern_library.md  — Code patterns (promoted at ≥3 occurrences)
    ├── learning_queue.md   — Pending learning items (P0–P3 priority)
    └── workflow_metrics.md — Execution metrics
```

---

## MCP Integration Layer

```
Claude Code
    │
    ├── mcp__plugin_ultrapower_t__*  (35 custom tools)
    │       ├── LSP tools (12)
    │       ├── AST tools (2)
    │       ├── Python REPL (1)
    │       ├── Notepad tools (6)
    │       ├── State tools (5)
    │       ├── Project Memory tools (4)
    │       ├── Trace tools (2)
    │       └── Skills tools (3)
    │
    ├── mcp__x__ask_codex           (OpenAI Codex — code analysis)
    ├── mcp__g__ask_gemini          (Google Gemini — large context)
    ├── mcp__context7__*            (Library documentation)
    ├── mcp__sequential-thinking__* (Step-by-step reasoning)
    └── mcp__software-planning-tool__* (Task planning)
```

---

## Security Boundaries (v5.5.5)

| Boundary | Mechanism | File |
|----------|-----------|------|
| Path traversal | `assertValidMode()` whitelist | `src/lib/validateMode.ts` |
| Hook input injection | Zod schema + field whitelist | `src/hooks/bridge-normalize.ts` |
| Shell injection | `execFileSync` (not `execSync`) | `src/tools/lsp/servers.ts` |
| Write path restriction | `path.resolve()` + homedir check | `src/hooks/guards/pre-tool.ts` |
| Config injection | tmpfile + env var | `src/features/rate-limit-wait/daemon.ts` |
| Atomics.wait crash | `isMainThread` check → setTimeout | `src/hooks/subagent-tracker/index.ts`, `src/notifications/session-registry.ts` |
| SENSITIVE_HOOKS bypass | Disable fast path for critical types | `src/hooks/bridge-normalize.ts` |
```

**Step 3: Commit**

```bash
git add docs/ARCHITECTURE.md
git commit -m "docs: rewrite ARCHITECTURE.md for v5.5.5 (security boundaries, delegation-enforcer, Axiom)"
```

---

## Task 4: Rewrite docs/FEATURES.md

**Files:**
- Modify: `docs/FEATURES.md` (full rewrite)
- Read first: `src/tools/state-tools.ts`, `src/tools/python-repl/tool.ts`, `src/features/delegation-enforcer.ts`, `src/mcp/omc-tools-server.ts`

**Step 1: Read current file**

Read `docs/FEATURES.md` (current).

**Step 2: Rewrite FEATURES.md**

```markdown
<!-- version: 5.5.5, updated: 2026-03-02 -->
# ultrapower Features — v5.5.5

Developer reference for all ultrapower feature systems.

---

## Notepad System

Session memory for the current conversation. Stored at `{worktree}/.omc/notepad.md`.

### Tools (6)

| Tool | Purpose |
|------|---------|
| `notepad_read(section)` | Read all/priority/working/manual sections |
| `notepad_write_priority(content)` | Write priority context (≤500 chars, auto-loaded at session start) |
| `notepad_write_working(content)` | Write timestamped working memory (auto-pruned after 7 days) |
| `notepad_write_manual(content)` | Write permanent notes (never auto-cleaned) |
| `notepad_prune(days)` | Remove working memory older than N days |
| `notepad_stats()` | Get size/age statistics |

### Priority Section

The `priority` section (≤500 characters) is automatically injected into every session start via the `axiom-boot` hook. Use it for critical project state that must survive context compression.

---

## State Management

Execution mode state files at `{worktree}/.omc/state/{mode}-state.json`.

### Tools (5)

| Tool | Purpose |
|------|---------|
| `state_read(mode)` | Read state JSON for a mode |
| `state_write(mode, data)` | Write/merge state data |
| `state_clear(mode)` | Delete state file |
| `state_list_active()` | List all modes with active state files |
| `state_get_status(mode?)` | Detailed status including phase, timestamps |

### Security (v5.5.0)

The `mode` parameter is validated through `assertValidMode()` before any path construction, preventing path traversal attacks:

```typescript
import { assertValidMode } from '../lib/validateMode';

// In state_read handler:
const safeMode = assertValidMode(input.mode); // throws on invalid
const statePath = `.omc/state/${safeMode}-state.json`;
```

Valid modes: `autopilot`, `ultrapilot`, `team`, `pipeline`, `ralph`, `ultrawork`, `ultraqa`, `ralplan`

---

## Project Memory

Persistent cross-session project knowledge at `{worktree}/.omc/project-memory.json`.

### Tools (4)

| Tool | Section Keys | Purpose |
|------|-------------|---------|
| `project_memory_read(section?)` | techStack, build, conventions, structure, notes, directives | Read project knowledge |
| `project_memory_write(section, data)` | same | Write/merge section data |
| `project_memory_add_note(category, content)` | — | Append categorized note |
| `project_memory_add_directive(content)` | — | Add permanent user directive (survives compression) |

### Directives

Directives are the highest-priority memory: they survive context compression and are injected into every session. Use for user preferences that must always be respected.

---

## LSP / AST / Python REPL

### LSP Tools (12)

Require a running language server. Use `lsp_servers()` to check availability.

```typescript
// Type info at cursor position
lsp_hover({ file: "src/hooks/bridge.ts", line: 42, character: 15 })

// Find all usages
lsp_find_references({ file: "src/lib/validateMode.ts", symbol: "assertValidMode" })

// Project-wide diagnostics
lsp_diagnostics_directory({ directory: "src/", includeWarnings: false })
```

### AST Tools (2)

Structural pattern matching using ast-grep meta-variables:

```typescript
// Find all execSync calls
ast_grep_search({ pattern: "execSync($$$ARGS)", language: "typescript" })

// Replace pattern (dry-run by default)
ast_grep_replace({
  pattern: "execSync($CMD, $OPTS)",
  replacement: "execFileSync($CMD, [], $OPTS)",
  language: "typescript",
  dryRun: true
})
```

### Python REPL

Persistent REPL session with pandas/numpy/matplotlib pre-available:

```python
python_repl("import pandas as pd; df = pd.read_csv('data.csv'); print(df.describe())")
```

Session state persists between calls within a conversation.

---

## Delegation Enforcer

**Added in v5.5.2.** Automatically injects the appropriate model tier into Task/Agent calls when no `model` is specified.

### Model Routing Table

| Agent Pattern | Auto-injected Model |
|--------------|-------------------|
| `explore`, `style-reviewer`, `writer` | `haiku` |
| `executor`, `debugger`, `verifier`, `test-engineer`, `build-fixer`, `designer`, `qa-tester`, `scientist`, `git-master`, `document-specialist`, `dependency-expert`, all Axiom agents | `sonnet` |
| `architect`, `analyst`, `planner`, `deep-executor`, `critic`, `code-reviewer` | `opus` |

### Behavior

- Explicit `model` parameter is **never** overridden
- Only `Task` and `Agent` tool calls are intercepted
- Injection happens in `processPreToolUse` via `bridge.ts`

---

## Axiom Integration

Complete requirements-to-delivery-to-evolution workflow.

### Workflow

```
/ax-draft → /ax-review → /ax-decompose → /ax-implement → /ax-reflect → /ax-evolve
   PRD         Review       Task DAG        Execution       Learning      Knowledge
```

### 14 Axiom Agents

See [Agents section in REFERENCE.md](./REFERENCE.md#axiom-lane-14) for full list.

### 14 Axiom Skills

| Skill | Purpose |
|-------|---------|
| `ax-draft` | Requirements clarification → Draft PRD → user confirmation gate |
| `ax-review` | 5-expert parallel review → Rough PRD with arbitrated decisions |
| `ax-decompose` | Rough PRD → atomic task DAG → Manifest.md |
| `ax-implement` | Execute Manifest tasks with CI gates and auto-fix (3 attempts) |
| `ax-analyze-error` | Root cause diagnosis → fix → learning queue entry |
| `ax-reflect` | Session reflection → experience extraction → action items |
| `ax-evolve` | Process learning queue → update knowledge base → pattern detection |
| `ax-status` | Full system status dashboard |
| `ax-rollback` | Roll back to last checkpoint (requires user confirmation) |
| `ax-suspend` | Save session state, safe exit |
| `ax-context` | Direct Axiom memory operations |
| `ax-evolution` | Evolution engine unified entry (evolve/reflect/knowledge/patterns) |
| `ax-knowledge` | Query knowledge base and pattern library |
| `ax-export` | Export Axiom workflow artifacts as portable archive |

### 2 Axiom Hooks

| Hook | Event | Purpose |
|------|-------|---------|
| `axiom-boot` | SessionStart | Inject memory context from active_context.md |
| `axiom-guards` | PreToolUse | Enforce gate rules (Expert/User/CI Gate/Scope Gate) |

### Gate Rules

| Gate | Trigger | Action |
|------|---------|--------|
| Expert Gate | New feature request | Must go through /ax-draft → /ax-review |
| User Gate | PRD finalized | Show confirmation: "Confirm execution? (Yes/No)" |
| CI Gate | Code modified | Run `tsc --noEmit && npm run build && npm test` |
| Scope Gate | File modified | Check against Manifest Impact Scope; warn on out-of-scope |

---

## Execution Modes Deep Dive

### Team Pipeline (default multi-agent orchestrator)

```
team-plan → team-prd → team-exec → team-verify → team-fix (loop)
```

Phase routing:
- **team-plan:** `explore` (haiku) + `planner` (opus)
- **team-prd:** `analyst` (opus)
- **team-exec:** `executor` (sonnet) + domain specialists
- **team-verify:** `verifier` (sonnet) + optional reviewers
- **team-fix:** `executor`/`build-fixer`/`debugger` based on defect type

State: `state_write(mode="team")` tracks `current_phase`, `fix_loop_count`, `linked_ralph`.

### Ralph Loop

Persistent execution until `verifier` confirms completion:

```
Execute → Verify → [pass] → Done
              ↓
         [fail] → Fix → Execute (loop)
```

Self-terminates when all acceptance criteria are met. Combine with `team` for team-ralph.

---

## Hook System

### Input Contract

All hooks receive snake_case fields:
- `tool_name` — name of the tool being called
- `tool_input` — tool input parameters
- `tool_response` — tool output (post-tool-use only)
- `session_id` — current session identifier
- `cwd` — current working directory
- `hook_event_name` — hook type

### Security: SENSITIVE_HOOKS (v5.5.0)

For `permission-request`, `setup`, and `session-end` hook types, the fast path in `bridge-normalize.ts` is disabled. All input goes through full Zod schema validation and field whitelist filtering:

```typescript
// SENSITIVE_HOOKS bypass fast path → full validation always runs
if (SENSITIVE_HOOKS.has(hookEventName)) {
  return zodValidate(input); // never fast-path
}
```

### Kill Switch

- `DISABLE_OMC=1` — disable all hooks
- `OMC_SKIP_HOOKS=keyword-detector,pre-tool-use` — skip specific hooks by name

---

## Windows Support (v5.5.x)

All Windows-specific fixes shipped in v5.5.0–v5.5.1:

| Issue | Fix | File |
|-------|-----|------|
| Windows paths fail in ESM `import()` | `pathToFileURL(path).href` | `src/features/rate-limit-wait/daemon.ts` |
| `which` not available on Windows | Use `where` when `process.platform === 'win32'` | `src/features/auto-update.ts` |
| Backslash paths in path comparisons | `path.relative()` + `path.resolve()` normalization | `src/hooks/subagent-tracker/index.ts`, `src/hooks/guards/pre-tool.ts` |
| LSP server detection on Windows | `where` command with `.trim()` | `src/tools/lsp/servers.ts` |

---

## MCP Routing

### Provider Selection Guide

| Task Type | Preferred Provider |
|-----------|------------------|
| Architecture review, planning validation | Codex (`mcp__x__ask_codex`, role: `architect`) |
| Code review, security analysis | Codex (role: `code-reviewer`, `security-reviewer`) |
| UI/UX design review, large context | Gemini (`mcp__g__ask_gemini`, role: `designer`) |
| Documentation writing | Gemini (role: `writer`) |
| Step-by-step reasoning | sequential-thinking |
| Task planning and decomposition | software-planning-tool |

### Tool Discovery

MCP tools are lazy-loaded. Run `ToolSearch("mcp")` before first use.

### Background Mode

```typescript
mcp__x__ask_codex({
  agent_role: "architect",
  prompt: "Review the delegation-enforcer integration",
  background: true  // returns job_id
})
// Later:
check_job_status({ job_id })
wait_for_job({ job_id, timeout: 3600 })
```
```

**Step 3: Commit**

```bash
git add docs/FEATURES.md
git commit -m "docs: rewrite FEATURES.md for v5.5.5 (delegation-enforcer, Axiom, Windows support)"
```

---

## Task 5: Update CHANGELOG.md

**Files:**
- Modify: `CHANGELOG.md` (prepend v5.5.0–v5.5.4 entries before existing v5.5.5 entry)
- Read first: `CHANGELOG.md` (find the `## [5.5.5]` line)

**Step 1: Read current CHANGELOG**

Read `CHANGELOG.md` to find the exact line of `## [5.5.5]`.

**Step 2: Insert new entries above the v5.5.5 block**

Insert the following block immediately before the `## [5.5.5]` line:

```markdown
## [5.5.4] - 2026-03-02
### Code Quality
- Expand `generatePromptId` entropy from 4 to 8 bytes
- Add 4MB prompt size limit to `executeGemini` in gemini-core.ts
- Unify catch blocks across notepads-tools.ts to return `isError: true`
- Replace hardcoded `ALLOWED_BOUNDARIES` with dynamic calculation in skills-tools

## [5.5.3] - 2026-03-02
### Documentation & Namespace
- Replace all `superpowers:` prefix residuals with `ultrapower:` across commands/skills/docs
- Add deprecation notice for legacy namespace with user migration hints
- Sync AGENTS.md version number and agent count with package.json
- Fix `$` anchor in bump-version.mjs version regex to prevent false matches
- Fix ax-status SKILL.md path reference to .omc/axiom/active_context.md
- Add GitHub Actions windows-latest CI matrix for Windows regression validation

## [5.5.2] - 2026-03-02
### Feature
- Add delegation-enforcer: auto-inject model tier for Task/Agent calls when unspecified
- explore/style-reviewer/writer → haiku; most agents → sonnet; architect/planner → opus
- Explicit model parameters are never overridden

## [5.5.1] - 2026-03-02
### Fix (Windows & Features)
- Fix `which`/`where` platform branch in auto-update.ts for Windows compatibility
- Fix path comparisons: use `path.relative()` in subagent-tracker, `path.resolve()` in pre-tool guards
- Add 60-second timeout cap to `handleWaitForJob` to prevent event loop blocking
- Fix `handleKillJob` operation order: kill process before writing status file

## [5.5.0] - 2026-03-02
### Security
- Add `assertValidMode()` path traversal guard at state_read/state_write handler entry
- Replace `execSync` string interpolation with `execFileSync` in LSP servers.ts
- Disable `isAlreadyCamelCase()` fast path for SENSITIVE_HOOKS in bridge-normalize.ts
- Fix `Atomics.wait()` TypeError on main thread: fall back to setTimeout in subagent-tracker and session-registry
- Fix Windows ESM import: use `pathToFileURL(modulePath).href` in daemon.ts
- Replace `JSON.stringify` config injection with UUID tmpfile + env-var pattern in daemon.ts
- Add 64MB buffer cap and `clearTimeout` on disconnect in LSP client.ts

```

**Step 3: Verify insertion is correct**

```bash
grep -n "## \[5\.5\." CHANGELOG.md | head -10
```

Expected: lines for 5.5.0, 5.5.1, 5.5.2, 5.5.3, 5.5.4, 5.5.5 in order

**Step 4: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs(changelog): add v5.5.0-v5.5.4 entries (Batch 1-4 fixes)"
```

---

## Task 6: Update docs/standards/ version numbers

**Files:**
- Modify: `docs/standards/README.md` (5.0.22 → 5.5.5)
- Modify: `docs/standards/runtime-protection.md` (5.0.21 → 5.5.5)
- Modify: `docs/standards/hook-execution-order.md` (5.0.21 → 5.5.5)
- Modify: `docs/standards/state-machine.md` (5.0.21 → 5.5.5)
- Modify: `docs/standards/agent-lifecycle.md` (5.0.21 → 5.5.5)
- Modify: `docs/standards/user-guide.md` (5.0.21 → 5.5.5)
- Modify: `docs/standards/anti-patterns.md` (5.0.21 → 5.5.5)
- Modify: `docs/standards/contribution-guide.md` (5.0.21 → 5.5.5)
- Modify: `docs/standards/audit-report.md` (5.0.22 → 5.5.5)

**Step 1: Batch replace version strings**

```bash
cd docs/standards
# Replace 5.0.21 with 5.5.5 in all files
sed -i 's/version: 5\.0\.21/version: 5.5.5/g' runtime-protection.md hook-execution-order.md state-machine.md agent-lifecycle.md user-guide.md anti-patterns.md contribution-guide.md
# Replace 5.0.22 with 5.5.5
sed -i 's/version: 5\.0\.22/version: 5.5.5/g' README.md audit-report.md
# Update 'updated' dates
sed -i 's/updated: 2026-02-[0-9]*/updated: 2026-03-02/g' *.md
```

**Step 2: Verify**

```bash
grep -r "version: 5\.0\." docs/standards/
```

Expected: no output (zero matches)

```bash
grep -r "version: 5\.5\.5" docs/standards/ | wc -l
```

Expected: 9

**Step 3: Also add note to audit-report.md that standards were updated for v5.5.5**

Append to `docs/standards/audit-report.md`:

```markdown

---

## v5.5.5 Update Note (2026-03-02)

Standards version updated from 5.0.21/5.0.22 to 5.5.5 to align with package version.
Key changes reflected in this version:
- `runtime-protection.md`: `assertValidMode()` whitelist documented for state_read/state_write
- `hook-execution-order.md`: SENSITIVE_HOOKS fast-path bypass documented
- `state-machine.md`: delegation-enforcer model injection added to pre-tool-use flow
- `agent-lifecycle.md`: Atomics.wait main-thread fix documented
- `contribution-guide.md`: Windows CI matrix requirement added
```

**Step 4: Commit**

```bash
git add docs/standards/
git commit -m "docs(standards): update version numbers 5.0.21/5.0.22 → 5.5.5"
```

---

## Task 7: Clean up outdated files

**Files:**
- Delete: `docs/reviews/ultrapower-full-bugfix-plan/` (entire directory)
- Delete: `docs/reviews/draft-prd-ultrapower-pain-fix/` (entire directory)
- Delete: `docs/reviews/draft_prd_pain_points/` (entire directory)
- Delete: `docs/prd/ultrapower-standards-draft.md`
- Delete: `docs/prd/ultrapower-standards-rough.md`
- Keep: `docs/reviews/ultrapower-pain-points/` (original pain points, historical value)
- Keep: `docs/reviews/ultrapower-standards/` (standards review, active reference)

**Step 1: Confirm files exist before deletion**

```bash
ls docs/reviews/
ls docs/prd/
```

**Step 2: Delete stale directories and files**

```bash
rm -rf docs/reviews/ultrapower-full-bugfix-plan
rm -rf docs/reviews/draft-prd-ultrapower-pain-fix
rm -rf docs/reviews/draft_prd_pain_points
rm -f docs/prd/ultrapower-standards-draft.md
rm -f docs/prd/ultrapower-standards-rough.md
```

**Step 3: Verify remaining docs/reviews/ content**

```bash
ls docs/reviews/
```

Expected: `AGENTS.md  ultrapower-pain-points/  ultrapower-standards/`

**Step 4: Commit**

```bash
git add -A docs/reviews/ docs/prd/
git commit -m "docs: remove stale review drafts and outdated PRD files"
```

---

## Task 8: Merge docs/shared/ into docs/partials/

**Files:**
- `docs/shared/` contains: `AGENTS.md`, `agent-tiers.md`, `features.md`, `mode-hierarchy.md`, `mode-selection-guide.md`, `verification-tiers.md`
- `docs/partials/` contains identical files (confirmed by pre-flight scan)

**Step 1: Diff to confirm they are identical**

```bash
diff docs/shared/agent-tiers.md docs/partials/agent-tiers.md
diff docs/shared/features.md docs/partials/features.md
diff docs/shared/mode-hierarchy.md docs/partials/mode-hierarchy.md
diff docs/shared/mode-selection-guide.md docs/partials/mode-selection-guide.md
diff docs/shared/verification-tiers.md docs/partials/verification-tiers.md
```

Expected: no differences

**Step 2: If any diff found, copy newer content to partials/**

```bash
# Only if diff showed differences — copy shared/ files to partials/
cp docs/shared/*.md docs/partials/
```

**Step 3: Remove docs/shared/**

```bash
rm -rf docs/shared/
```

**Step 4: Search for any references to docs/shared/**

```bash
grep -r "docs/shared" docs/ skills/ commands/ --include="*.md"
```

Expected: no output (or update any found references to point to `docs/partials/`)

**Step 5: Commit**

```bash
git add -A docs/shared/ docs/partials/
git commit -m "docs: merge docs/shared/ into docs/partials/ (remove duplicate)"
```

---

## Task 9: Add version headers to main docs + CI verify

**Files:**
- Verify: `docs/REFERENCE.md` (should already have header from Task 2)
- Verify: `docs/ARCHITECTURE.md` (should already have header from Task 3)
- Verify: `docs/FEATURES.md` (should already have header from Task 4)
- Verify: `docs/MIGRATION.md` (add header if missing)

**Step 1: Check MIGRATION.md header**

```bash
head -3 docs/MIGRATION.md
```

If missing `<!-- version: ... -->`, insert:

```bash
# Prepend version header
sed -i '1s/^/<!-- version: 5.5.5, updated: 2026-03-02 -->\n/' docs/MIGRATION.md
```

**Step 2: Run CI verification**

```bash
npm run build
```

Expected: Build completes with no errors

```bash
npm test 2>&1 | tail -5
```

Expected: `X tests passed, 0 failed`

**Step 3: Commit if MIGRATION.md was updated**

```bash
git add docs/MIGRATION.md
git commit -m "docs: add version header to MIGRATION.md"
```

---

## Task 10: Create PR to dev

**Step 1: Push branch**

```bash
git push origin docs/v5.5.5-comprehensive-update
```

**Step 2: Create PR**

```bash
gh pr create --base dev \
  --title "docs: comprehensive documentation update for v5.5.5" \
  --body "$(cat <<'EOF'
## Summary

- Rewrite REFERENCE.md (49 agents, 71 skills, 35 tools, 35 hooks)
- Rewrite ARCHITECTURE.md (delegation-enforcer, bridge-normalize security, Axiom state machine)
- Rewrite FEATURES.md (all feature systems, Windows support, Axiom integration)
- Add CHANGELOG entries for v5.5.0–v5.5.4 (Batch 1–4 fixes)
- Update docs/standards/ version numbers: 5.0.21/5.0.22 → 5.5.5
- Remove stale review drafts and outdated PRD files
- Merge docs/shared/ into docs/partials/

## Test plan
- [ ] `npm run build` passes with no errors
- [ ] `npm test` passes with 0 failures
- [ ] All version numbers in docs/ match 5.5.5
- [ ] `grep -r "5\.0\.2[12]" docs/` returns no results
- [ ] `grep -r "docs/shared" docs/ skills/ commands/` returns no results

🤖 Generated with Claude Code
EOF
)"
```

**Step 3: Verify PR created**

```bash
gh pr view --web
```

---

## Execution Notes

### Parallel Tasks

Tasks 2, 3, 4, 5, 6, 7 are fully independent — dispatch them in parallel using `superpowers:dispatching-parallel-agents`.

### Serial Tasks

Task 1 (branch) → Tasks 2–7 (parallel) → Task 8 (merge shared/) → Task 9 (verify) → Task 10 (PR)

### Verification Commands

```bash
# After all tasks:
grep -r "5\.0\.2[12]" docs/            # Expected: 0 results
grep -r "docs/shared" . --include="*.md"  # Expected: 0 results
npm run build                              # Expected: 0 errors
npm test 2>&1 | tail -3                   # Expected: 0 failures
```
