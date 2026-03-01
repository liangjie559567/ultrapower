<!-- ultrapower v5.5.5 | updated: 2026-03-02 -->

# ultrapower Architecture — v5.5.5

> This document describes the internal architecture of ultrapower, the multi-agent orchestration layer for Claude Code. It reflects the system as implemented in v5.5.5.

---

## Overview

ultrapower transforms Claude Code into an intelligent orchestrator of specialized AI agents. Rather than handling all work directly, the orchestrator detects intent, routes to appropriate agents, enforces security boundaries, and tracks execution state across sessions.

```
┌──────────────────────────────────────────────────────────────────┐
│                        Claude Code CLI                           │
└────────────────────────────┬─────────────────────────────────────┘
                             │  hook events / tool calls
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    ultrapower v5.5.5                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 SECURITY LAYER (new v5.5.5)                 │ │
│  │  bridge-normalize  │  assertValidMode  │  SENSITIVE_HOOKS   │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │                     CORE PIPELINE                           │ │
│  │  Hook Bridge  │  Delegation Enforcer  │  State Manager      │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │                    FEATURE LAYER                            │ │
│  │  model-routing │ boulder-state │ verification │ notepad     │ │
│  │  task-decomposer │ magic-keywords │ context-injector        │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────┬───────────────▼─────────┬──────────┬────────────┐ │
│  │ Skills   │       Agents (49)       │  Tools   │   Hooks    │ │
│  │ (71)     │  haiku / sonnet / opus  │  (35)    │   (47)     │ │
│  └──────────┴─────────────────────────┴──────────┴────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              AXIOM SYSTEM (integrated)                      │ │
│  │  State machine: IDLE→PLANNING→CONFIRMING→EXECUTING→         │ │
│  │                 AUTO_FIX→BLOCKED→ARCHIVING                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              MCP INTEGRATION LAYER                          │ │
│  │  codex-server (gpt) │ gemini-server (gemini) │ team-bridge  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Key numbers (v5.5.5):**
- 49 specialized agents across 6 lanes (Build, Review, Domain, Product, Coordination, Axiom)
- 71 skills for workflow automation
- 47 hooks for event-driven lifecycle control
- 35 custom tools (LSP x12, AST x2, REPL x1, Notepad x6, State x5, Memory x4, Trace x2, Skills x3)
- 8 validated execution modes (autopilot, ultrapilot, team, pipeline, ralph, ultrawork, ultraqa, swarm)

---

## Core Pipeline

The core pipeline processes every hook event through three subsystems in order: Hook Bridge (normalization + security filtering), Delegation Enforcer (model injection), and State Manager (persistence + path safety).

### Hook Bridge (`bridge-normalize`, SENSITIVE_HOOKS security fix — v5.5.0)

**Location:** `src/hooks/bridge-normalize.ts`

The Hook Bridge is the entry point for all Claude Code hook events. It normalizes the raw snake_case input from Claude Code into the camelCase `HookInput` interface used internally, then applies sensitivity-based field filtering.

#### Normalization Flow

Claude Code sends hook inputs with snake_case field names:
- `tool_name`, `tool_input`, `tool_response`, `session_id`, `cwd`, `hook_event_name`

`normalizeHookInput()` maps these to camelCase:
- `toolName`, `toolInput`, `toolOutput`, `sessionId`, `directory`, `hookEventName`

A **fast-path** optimization skips Zod parsing when the input is already camelCase (detected by presence of `sessionId`, `toolName`, or `directory` keys and absence of any underscore keys). This reduces overhead for internally-generated hook calls.

For snake_case input, Zod `safeParse` validates the structure. Validation failures emit a console warning but do not throw — the system falls through to best-effort field mapping rather than blocking execution.

#### SENSITIVE_HOOKS Security (new in v5.5.0)

Four hook types are designated as **sensitive** and receive strict allowlist filtering:

```typescript
const SENSITIVE_HOOKS = new Set([
  'permission-request',   // tool permission decisions — must not be tampered
  'setup-init',           // first-run initialization
  'setup-maintenance',    // ongoing maintenance ops
  'session-end',          // session teardown — requires sessionId + directory
]);
```

For sensitive hooks, the `filterPassthrough()` function drops **all unknown fields** — only fields present in `KNOWN_FIELDS` are passed through. This prevents injection of attacker-controlled fields into security-critical hook handlers.

For non-sensitive hooks, unknown fields are passed through with a `debug` console warning (design choice, not an oversight). This allows forward compatibility when Claude Code adds new hook fields.

The fast-path **does not apply** to sensitive hooks. Even if an input appears camelCase-normalized, sensitive hook types always go through `filterPassthrough()` with the strict allowlist.

#### Hook Type Classification (15 types)

| Hook Type | Sensitivity | Unknown Fields |
|---|---|---|
| `permission-request` | SENSITIVE (non-degradable) | Dropped |
| `setup-init` | SENSITIVE | Dropped |
| `setup-maintenance` | SENSITIVE | Dropped |
| `session-end` | SENSITIVE | Dropped |
| `keyword-detector`, `ralph`, `persistent-mode` | Normal | Passed through (debug warn) |
| `stop-continuation`, `session-start` | Normal | Passed through |
| `pre-tool-use`, `post-tool-use`, `autopilot` | Normal | Passed through |
| `subagent-start`, `subagent-stop`, `pre-compact` | Normal | Passed through |

### Delegation Enforcer (auto model injection — new in v5.5.2)

**Location:** `src/features/delegation-enforcer/`

**Dependencies:** `src/features/delegation-categories/`, `src/features/delegation-routing/`

The Delegation Enforcer ensures that substantial code changes are routed to specialized agents rather than handled directly by the orchestrator. It intercepts `Task` and agent invocations and auto-injects the appropriate model when none is specified.

#### Auto Model Injection Rules (added v5.5.2)

When a Task call specifies `subagent_type` but omits `model`, the Delegation Enforcer injects the canonical default:

| Agent / Category | Injected Model |
|---|---|
| `explore`, `style-reviewer`, `writer` | `haiku` |
| `executor`, `debugger`, `verifier`, `build-fixer` | `sonnet` |
| `designer`, `test-engineer`, `security-reviewer` | `sonnet` |
| `analyst`, `planner`, `architect`, `critic`, `deep-executor` | `opus` |
| `code-reviewer` | `opus` |

This prevents agents from defaulting to an unintended model when callers omit the `model` parameter, which was a common source of quality regressions in v5.4.x.

#### Delegation Rules

The enforcer applies these rules to determine whether direct handling or delegation is required:

- **Multi-file implementation** → must delegate to `executor` (or `deep-executor` for complex autonomous tasks)
- **Complex refactoring** → must delegate to `deep-executor`
- **Architecture decisions** → must delegate to `architect`
- **Single-line or trivial changes** → may be handled directly

Violations emit a warning to stderr; the enforcer does not hard-block (to avoid interrupting valid edge cases).

### State Manager (`assertValidMode` path traversal guard — new in v5.5.0)

**Location:** `src/features/state-manager/`, `src/lib/validateMode.ts`

The State Manager provides a unified read/write interface for all 8 execution mode state files. It enforces a strict path safety boundary introduced in v5.5.0 to prevent path traversal attacks.

#### Path Traversal Guard

State file paths are constructed from the `mode` parameter:

```
.omc/state/${mode}-state.json
```

Before v5.5.0, `mode` was interpolated directly from user input, enabling attacks like `mode = "../../etc/passwd"`. The fix introduces `assertValidMode()` in `src/lib/validateMode.ts`:

```typescript
export function assertValidMode(mode: unknown): ValidMode {
  if (!validateMode(mode)) {
    const raw = typeof mode === 'string' ? mode : String(mode);
    const display = raw.length > 50 ? `${raw.slice(0, 50)}...(truncated)` : raw;
    throw new Error(
      `Invalid mode: "${display}". Valid modes are: ${VALID_MODES.join(', ')}`
    );
  }
  return mode;
}
```

The input is truncated to 50 characters in error messages to prevent DoS via memory amplification with large attacker-controlled payloads.

#### Valid Modes (8 total)

```typescript
export const VALID_MODES = [
  'autopilot', 'ultrapilot', 'team', 'pipeline',
  'ralph', 'ultrawork', 'ultraqa', 'swarm',
] as const;
```

Note (D-03): The original PRD listed 7 modes; `swarm` was added in a subsequent release, bringing the total to 8.

#### State File Paths

| Scope | Path |
|---|---|
| Global mode state | `{worktree}/.omc/state/{mode}-state.json` |
| Session-scoped state | `{worktree}/.omc/state/sessions/{sessionId}/{mode}-state.json` |
| Swarm (SQLite) | `{worktree}/.omc/state/swarm-state.db` |

All state access must go through the `state_read` / `state_write` MCP tools, not direct file I/O.

---

## Feature Layer

The Feature Layer sits above the Core Pipeline and provides cross-cutting capabilities consumed by skills, agents, and hooks.

| Module | Location | Purpose |
|---|---|---|
| `model-routing` | `src/features/model-routing/` | Task complexity → model tier mapping (Haiku/Sonnet/Opus) |
| `boulder-state` | `src/features/boulder-state/` | Ralph/ultrawork "boulder never stops" persistence |
| `verification` | `src/features/verification/` | Evidence-based completion checks (BUILD/TEST/LINT/TODO) |
| `notepad-wisdom` | `src/features/notepad-wisdom/` | Session memory read/write (7-day working + permanent manual) |
| `task-decomposer` | `src/features/task-decomposer/` | Breaks large goals into atomic agent tasks |
| `magic-keywords` | `src/features/magic-keywords/` | Keyword detection → skill/mode activation |
| `context-injector` | `src/features/context-injector/` | Injects AGENTS.md / rules files at hook time |
| `delegation-routing` | `src/features/delegation-routing/` | Routes delegation calls to the correct agent type |
| `rate-limit-wait` | `src/features/rate-limit-wait/` | Exponential backoff daemon for API rate limits |
| `continuation-enforcement` | `src/features/continuation-enforcement/` | Prevents premature task termination |
| `error-log` | `src/features/error-log/` | Structured error capture for recovery hooks |

---

## Axiom System

The Axiom System is an integrated requirement-to-delivery workflow engine. It provides a disciplined path from raw requirements through expert review, task decomposition, implementation, and knowledge evolution.

### State Machine

The Axiom state machine governs the lifecycle of every development task:

```
IDLE
  │  new requirement detected
  ▼
PLANNING  (/ax-draft → Draft PRD)
  │  user confirms PRD
  ▼
CONFIRMING  (User Gate: display PRD, await Yes/No)
  │  user confirms
  ▼
EXECUTING  (/ax-implement → run atomic tasks per Manifest)
  │  CI fails
  ▼
AUTO_FIX  (up to 3 retry attempts with tsc + build + test)
  │  3 failures or unrecoverable error
  ▼
BLOCKED  (output BLOCKED report, await human intervention)
  │  all tasks complete or manual resolution
  ▼
ARCHIVING  (/ax-reflect → harvest knowledge, update evolution engine)
  │  archiving complete
  ▼
IDLE
```

State transitions are persisted in `.omc/axiom/active_context.md`. The system reads this file at session startup to detect interrupted tasks and offer resume.

### Axiom Gate System

Three mandatory gates prevent low-quality work from advancing:

| Gate | Trigger | Condition |
|---|---|---|
| **Expert Gate** | All new feature requirements | Must pass `/ax-draft` → `/ax-review` (5 parallel expert reviews) |
| **User Gate** | PRD finalized | Display "PRD generated, confirm? (Yes/No)" — blocks until confirmed |
| **CI Gate** | Code changes complete | Must run `tsc --noEmit && npm run build && npm test` with zero errors |

### Memory Architecture

Axiom uses a layered file-based memory system under `.omc/axiom/`:

```
.omc/axiom/
├── active_context.md        Short-term: current task state, active mode
├── project_decisions.md     Long-term: architecture decisions (ADRs)
├── user_preferences.md      Persistent: user coding style and tool preferences
├── state_machine.md         State machine definition reference
├── reflection_log.md        Session reflection journal (ax-reflect output)
└── evolution/
    ├── knowledge_base.md    Knowledge graph with confidence scoring
    ├── pattern_library.md   Code patterns (promoted when occurrence >= 3)
    ├── learning_queue.md    Pending learning items (P0-P3 priority)
    └── workflow_metrics.md  Execution metrics per workflow run
```

### Axiom Agents (14)

| Agent | Purpose |
|---|---|
| `axiom-requirement-analyst` | Three-gate requirement screening (PASS/CLARIFY/REJECT) |
| `axiom-product-designer` | Draft PRD generation with Mermaid flow diagrams |
| `axiom-review-aggregator` | 5-expert parallel review aggregation and conflict arbitration |
| `axiom-prd-crafter` | Engineering-grade PRD with gate validation |
| `axiom-system-architect` | Atomic task DAG and Manifest generation |
| `axiom-evolution-engine` | Knowledge harvesting, pattern detection, workflow optimization |
| `axiom-context-manager` | 7-operation memory system (read/write/status/checkpoint) |
| `axiom-worker` | PM→Worker protocol with three-state output (QUESTION/COMPLETE/BLOCKED) |
| `axiom-ux-director` | UX/experience expert review (→ `review_ux.md`) |
| `axiom-product-director` | Product strategy expert review (→ `review_product.md`) |
| `axiom-domain-expert` | Domain knowledge expert review (→ `review_domain.md`) |
| `axiom-tech-lead` | Technical feasibility review (→ `review_tech.md`) |
| `axiom-critic` | Security/quality/logic review (→ `review_critic.md`) |
| `axiom-sub-prd-writer` | Decomposes Manifest tasks into executable Sub-PRDs |

### Axiom Skills (14)

| Skill | Command | Purpose |
|---|---|---|
| `ax-draft` | `/ax-draft` | Requirement clarification → Draft PRD → user confirm |
| `ax-review` | `/ax-review` | 5-expert parallel review → aggregate → Rough PRD |
| `ax-decompose` | `/ax-decompose` | Rough PRD → system architecture → atomic task DAG |
| `ax-implement` | `/ax-implement` | Execute tasks per Manifest with CI gate and auto-fix |
| `ax-analyze-error` | `/ax-analyze-error` | Root cause diagnosis → auto-fix → learning queue |
| `ax-reflect` | `/ax-reflect` | Post-session reflection → knowledge harvest → action items |
| `ax-evolve` | `/ax-evolve` | Process learning queue → update knowledge base → detect patterns |
| `ax-status` | `/ax-status` | Full system status dashboard |
| `ax-rollback` | `/ax-rollback` | Roll back to most recent checkpoint (requires user confirm) |
| `ax-suspend` | `/ax-suspend` | Save session state and exit safely |
| `ax-context` | `/ax-context` | Direct Axiom memory system operations |
| `ax-evolution` | `/ax-evolution` | Evolution engine unified entry (evolve/reflect/knowledge/patterns) |
| `ax-knowledge` | `/ax-knowledge` | Query Axiom knowledge base |
| `ax-export` | `/ax-export` | Export Axiom workflow artifacts |

### Axiom Hooks (2)

| Hook | Location | Purpose |
|---|---|---|
| `axiom-boot` | `src/hooks/axiom-boot/` | Session startup memory context injection |
| `axiom-guards` | `src/hooks/axiom-guards/` | Gate rule enforcement (Expert/User/CI Gate) |

---

## MCP Integration Layer

ultrapower ships four pre-packaged MCP servers under `bridge/`:

| Server | Model | Primary Use |
|---|---|---|
| `codex-server` | gpt-5.3-codex | Architecture review, planning validation, code analysis |
| `gemini-server` | gemini-3-pro-preview | Large-context tasks (1M tokens), UI/UX design review |
| `mcp-server` | — | General MCP tool service (tool discovery, skill loading) |
| `team-bridge` | — | Team coordination bridging for native Claude Code teams |

### MCP Tool Discovery

MCP tools are **lazily loaded** — they are not in the tool list at session start. Before first use, the orchestrator must call `ToolSearch("mcp")` to discover available tools.

If discovery returns no results, the MCP server is not configured. The system falls back to equivalent Claude agents rather than blocking.

### Provider Selection Guide

| Task Type | Preferred Provider | Agent Role |
|---|---|---|
| Architecture review, planning validation | Codex | `architect`, `planner`, `critic` |
| Security review, code review | Codex | `security-reviewer`, `code-reviewer` |
| Test strategy | Codex | `test-engineer` |
| UI/UX design review | Gemini | `designer` |
| Large file analysis (>100KB) | Gemini | Any (1M context) |
| Documentation generation | Gemini | `writer` |

### Tool Invocation

```typescript
// Codex
mcp__x__ask_codex({ agent_role: "architect", prompt: "...", context_files: [...] })

// Gemini
mcp__g__ask_gemini({ agent_role: "designer", prompt: "...", files: [...] })
```

MCP output is wrapped as untrusted content. Validation (type checks, tests) must come from Claude agents using native tools, not from MCP output alone.

---

## Security Boundaries (new in v5.5.5)

v5.5.0 through v5.5.5 introduced seven security fixes that form the current security boundary model:

### Fix 1: Path Traversal Guard (`assertValidMode`)

**Risk:** `mode` parameter interpolated directly into file paths allowed `../../etc/passwd`-style traversal.

**Fix:** `src/lib/validateMode.ts` exports `assertValidMode()` which validates against an 8-item whitelist before any path construction. Invalid inputs throw with a truncated error message (50 char limit on displayed input) to prevent DoS.

```typescript
// Safe pattern — required in all path construction
const validMode = assertValidMode(mode);
const path = `.omc/state/${validMode}-state.json`;

// Unsafe — never do this
const path = `.omc/state/${mode}-state.json`;  // path traversal risk
```

### Fix 2: SENSITIVE_HOOKS Strict Allowlist

**Risk:** Attacker-controlled fields could be injected into security-critical hook handlers (permission-request, setup, session-end).

**Fix:** `SENSITIVE_HOOKS` set in `bridge-normalize.ts` identifies four hook types. For these, `filterPassthrough()` drops all fields not in `KNOWN_FIELDS`. Unknown fields are silently discarded (no error, to avoid leaking information about the allowlist).

### Fix 3: Zod Schema Validation on Hook Inputs

**Risk:** Malformed hook inputs (wrong types, null values) caused uncaught exceptions in hook handlers.

**Fix:** `HookInputSchema` (Zod) validates all incoming hook inputs via `safeParse`. Failures emit a warning but do not throw, ensuring hook execution continues with best-effort field mapping.

### Fix 4: Error Message Truncation (DoS Prevention)

**Risk:** Attacker-controlled strings reflected in error messages could cause memory amplification.

**Fix:** All error messages that include user-supplied input truncate at 50 characters with `...(truncated)` suffix. Applied in `assertValidMode()` and related validation functions.

### Fix 5: SubagentStop Success Inference

**Risk:** Directly reading `input.success` returned `undefined` for implicit success (when Claude Code omits the field), causing incorrect failure detection.

**Fix:** All SubagentStop handlers use `input.success !== false` (truthy inference) rather than `!!input.success` (falsy check). This correctly treats absent `success` as success.

### Fix 6: Session-End Required Fields Validation

**Risk:** Session-end hooks missing `sessionId` or `directory` could write state to incorrect paths or corrupt global state.

**Fix:** `bridge-normalize.ts` enforces required field presence for `session-end` hook type. Missing required fields cause the hook to abort with a structured error rather than proceeding with undefined values.

### Fix 7: Atomic State File Writes

**Risk:** Non-atomic writes (write then rename) left state files in a partial state if the process was interrupted, causing corrupted JSON on next read.

**Fix:** `src/lib/atomic-write.ts` exports `atomicWriteJsonSync()` which writes to a `.tmp` file then renames atomically. All state file writes in `state-tools.ts` use this function. On Windows (which has different rename semantics), the implementation retries with a small backoff.

---

## Agent Model Routing

The three-tier model routing maps task complexity to Claude model tier:

```
Task Complexity → Model Selection
─────────────────────────────────
LOW    → Haiku   (fast lookup, simple fixes, quick scans)
MEDIUM → Sonnet  (standard implementation, moderate reasoning)
HIGH   → Opus    (complex reasoning, architecture, deep debugging)
```

### Agent Tier Assignments

| Lane | Agent | Default Model |
|---|---|---|
| Build/Analysis | `explore` | haiku |
| Build/Analysis | `analyst`, `planner`, `architect` | opus |
| Build/Analysis | `debugger`, `executor`, `verifier` | sonnet |
| Build/Analysis | `deep-executor` | opus |
| Review | `style-reviewer` | haiku |
| Review | `quality-reviewer`, `api-reviewer`, `security-reviewer`, `performance-reviewer` | sonnet |
| Review | `code-reviewer` | opus |
| Domain | `writer` | haiku |
| Domain | all others | sonnet |
| Product | all | sonnet |
| Coordination | `critic` | opus |
| Axiom | all | sonnet |

---

## Skill Composition

Skills are behavior injectors that modify how the orchestrator runs. They compose in layers:

```
┌──────────────────────────────────────────────────────────┐
│  GUARANTEE LAYER (optional)                              │
│  ralph: "Cannot stop until verified done"                │
└───────────────────────────┬──────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│  ENHANCEMENT LAYER (0-N skills)                          │
│  ultrawork (parallel) | git-master (commits)             │
│  frontend-ui-ux (UI) | security-review                   │
└───────────────────────────┬──────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│  EXECUTION LAYER (primary skill)                         │
│  default (build) | orchestrate (coordinate)              │
│  planner (plan) | team (multi-agent)                     │
└──────────────────────────────────────────────────────────┘
```

**Formula:** `[Execution Skill] + [0-N enhancements] + [optional guarantee]`

### Execution Modes

| Mode | Trigger Keywords | Purpose |
|---|---|---|
| `autopilot` | "autopilot", "build me", "I want a" | Fully autonomous idea-to-code |
| `ultrawork` | "ulw", "ultrawork" | Maximum parallelism agent orchestration |
| `ralph` | "ralph", "don't stop" | Persistent loop until verifier confirms done |
| `ultrapilot` | "ultrapilot", "parallel build" | Team-backed parallel autopilot |
| `swarm` | "swarm" | N coordinated agents with SQLite task claiming |
| `team` | "team", "coordinated team" | Phased pipeline: plan→prd→exec→verify→fix |
| `pipeline` | "pipeline", "chain agents" | Sequential agent chain with data passing |
| `ultraqa` | (activated by autopilot) | QA loop: test→verify→fix→repeat |

---

## Hook System (47 hooks)

Hooks provide event-driven lifecycle control across 15 hook event types registered with Claude Code.

### Key Hook Modules

| Hook Module | Location | Event | Purpose |
|---|---|---|---|
| `keyword-detector` | `src/hooks/keyword-detector/` | UserPromptSubmit | Magic keyword detection → skill/mode activation |
| `autopilot` | `src/hooks/autopilot/` | UserPromptSubmit | Autopilot mode loop management |
| `ralph` | `src/hooks/ralph/` | SubagentStop | Ralph persistence loop |
| `persistent-mode` | `src/hooks/persistent-mode/` | SubagentStop | Mode state persistence |
| `subagent-tracker` | `src/hooks/subagent-tracker/` | SubagentStart/Stop | Agent lifecycle monitoring, stuck detection (>5 min) |
| `team-pipeline` | `src/hooks/team-pipeline/` | TeammateIdle | Team phase transitions |
| `session-end` | `src/hooks/session-end/` | SessionEnd | State cleanup and Axiom suspension |
| `pre-compact` | `src/hooks/pre-compact/` | PreCompact | Save Axiom state before context compaction |
| `axiom-boot` | `src/hooks/axiom-boot/` | SessionStart | Inject Axiom memory context |
| `axiom-guards` | `src/hooks/axiom-guards/` | PreToolUse | Enforce Expert/User/CI gates |
| `permission-handler` | `src/hooks/permission-handler/` | PermissionRequest | Tool permission decisions (sensitive) |
| `rules-injector` | `src/hooks/rules-injector/` | UserPromptSubmit | Inject coding-style/testing/security rules |
| `recovery` | `src/hooks/recovery/` | PostToolUse | Error recovery and retry logic |
| `think-mode` | `src/hooks/think-mode/` | UserPromptSubmit | Enhanced reasoning mode activation |

---

## State Management

### State File Layout

```
{worktree}/
└── .omc/
    ├── state/
    │   ├── autopilot-state.json
    │   ├── team-state.json
    │   ├── ralph-state.json
    │   ├── ultrawork-state.json
    │   ├── swarm-state.db          (SQLite for swarm mode)
    │   └── sessions/
    │       └── {sessionId}/        (session-scoped state)
    ├── notepad.md                   (session memory)
    ├── project-memory.json          (persistent project knowledge)
    ├── plans/                       (planning documents — read-only)
    ├── research/                    (research outputs)
    ├── logs/                        (audit logs)
    └── axiom/                       (Axiom system memory)
        ├── active_context.md
        ├── project_decisions.md
        ├── user_preferences.md
        ├── reflection_log.md
        └── evolution/
            ├── knowledge_base.md
            ├── pattern_library.md
            ├── learning_queue.md
            └── workflow_metrics.md
```

### State Tools (5)

```typescript
state_read(mode, sessionId?)        // Read state for a mode
state_write(mode, data, sessionId?) // Write/update mode state
state_clear(mode)                   // Delete the state file
state_list_active()                 // List all currently active modes
state_get_status(mode?)             // Detailed status for one or all modes
```

---

## Verification Protocol

Before claiming completion, all work must pass the verification protocol:

| Check | What is Verified |
|---|---|
| BUILD | TypeScript compiles without errors (`tsc --noEmit && npm run build`) |
| TEST | All tests pass (`npm test`) |
| LINT | No lint errors (`npm run lint`) |
| FUNCTIONALITY | Feature works as specified (runtime check) |
| TODO | All TodoWrite items marked completed |
| ERROR_FREE | No unresolved errors in modified files (LSP diagnostics) |

Evidence must be fresh (within 5 minutes) and include actual command output. The `verifier` agent collects evidence and reports with explicit pass/fail per check.

**Model selection for verification:**
- Small changes (<5 files, <100 lines): `verifier` with `model="haiku"`
- Standard changes: `verifier` with `model="sonnet"`
- Large or security/architecture changes (>20 files): `verifier` with `model="opus"`

---

## Further Reading

| Document | Content |
|---|---|
| [REFERENCE.md](./REFERENCE.md) | Complete agent, skill, hook, and tool reference |
| [FEATURES.md](./FEATURES.md) | Internal API and feature module documentation |
| [MIGRATION.md](./MIGRATION.md) | Breaking changes and migration guides |
| [TIERED_AGENTS_V2.md](./TIERED_AGENTS_V2.md) | Tiered agent design specification |
| [COMPATIBILITY.md](./COMPATIBILITY.md) | Compatibility requirements and platform notes |
| `docs/standards/runtime-protection.md` | P0: Runtime security rules (path traversal, hook input) |
| `docs/standards/hook-execution-order.md` | P0: 15 HookType routing rules and execution order |
| `docs/standards/state-machine.md` | P0: Agent state machine and Team Pipeline transition matrix |
| `docs/standards/agent-lifecycle.md` | P0: Timeout, orphan, cost-limit, deadlock edge cases |
