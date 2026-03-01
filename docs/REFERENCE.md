<!-- ultrapower v5.5.5 | updated: 2026-03-02 -->

# ultrapower Reference — v5.5.5

Complete reference manual for ultrapower. For quick start see [README.md](../README.md).

---

## Table of Contents

- [Installation & Quick Start](#installation--quick-start)
- [Configuration](#configuration)
- [Execution Modes](#execution-modes)
- [Agents (49 total)](#agents-49-total)
  - [Build/Analysis Lane (8)](#buildanalysis-lane-8)
  - [Review Lane (6)](#review-lane-6)
  - [Domain Specialists (16)](#domain-specialists-16)
  - [Product Lane (4)](#product-lane-4)
  - [Axiom Lane (14)](#axiom-lane-14)
  - [Coordination (1)](#coordination-1)
- [Skills (71 total)](#skills-71-total)
  - [Workflow Skills](#workflow-skills)
  - [Axiom Skills](#axiom-skills)
  - [Superpowers Skills](#superpowers-skills)
  - [Agent Shortcuts](#agent-shortcuts)
  - [Utility Skills](#utility-skills)
- [Custom Tools (35 total)](#custom-tools-35-total)
  - [LSP Tools (12)](#lsp-tools-12)
  - [AST Tools (2)](#ast-tools-2)
  - [Python REPL (1)](#python-repl-1)
  - [Notepad Tools (6)](#notepad-tools-6)
  - [State Tools (5)](#state-tools-5)
  - [Project Memory Tools (4)](#project-memory-tools-4)
  - [Trace Tools (2)](#trace-tools-2)
  - [Skills Tools (3)](#skills-tools-3)
- [Hooks System (35 hooks)](#hooks-system-35-hooks)
- [MCP Integration](#mcp-integration)
- [Security & Safety Rules](#security--safety-rules)
- [Magic Keywords](#magic-keywords)
- [Platform Support](#platform-support)
- [Performance Monitoring](#performance-monitoring)
- [Troubleshooting](#troubleshooting)
- [Changelog](#changelog)

---

## Installation & Quick Start

**Only the Claude Code Plugin installation method is supported.** Other methods (npm, bun, curl) are deprecated and may not work correctly.

### Claude Code Plugin (Required)

```bash
# Step 1: Add the plugin marketplace
/plugin marketplace add https://github.com/liangjie559567/ultrapower

# Step 2: Install the plugin
/plugin install omc@ultrapower
```

This method integrates directly into Claude Code's plugin system using Node.js hooks.

> **Note**: Direct global installation via npm/bun is **not supported**. The plugin system handles all installation and hook configuration automatically.

### System Requirements

- [Claude Code](https://docs.anthropic.com/claude-code) installed
- One of:
  - **Claude Max/Pro subscription** (recommended for personal use)
  - **Anthropic API key** (`ANTHROPIC_API_KEY` environment variable)

### Quick Start

After installation, run the setup wizard:

```
/ultrapower:omc-setup
```

Then try your first execution mode:

```bash
# Autonomous execution
autopilot: build a REST API with authentication

# Maximum parallel agents
ultrawork: implement user authentication with OAuth

# Persistent execution loop
ralph: refactor the authentication module
```

---

## Configuration

### Project-Level Configuration (Recommended)

Configure omc for the current project only:

```
/ultrapower:omc-setup
```

- Creates `./.claude/CLAUDE.md` in the current project
- Configuration applies only to this project
- Does not affect other projects or global settings
- **Safe**: Preserves your global CLAUDE.md

### Global Configuration

Configure omc for all Claude Code sessions:

```
/ultrapower:omc-setup
```

- Creates `~/.claude/CLAUDE.md` globally
- Configuration applies to all projects
- **Warning**: Will completely overwrite existing `~/.claude/CLAUDE.md`

### Configuration Priority

When both configurations exist, **project-level overrides** global:

```
./.claude/CLAUDE.md  (project)   ->  Overrides  ->  ~/.claude/CLAUDE.md  (global)
```

### Features Enabled by Configuration

| Feature | Without Config | With omc Config |
|---------|---------------|-----------------|
| Agent delegation | Manual only | Auto-delegated by task type |
| Keyword detection | Disabled | ultrawork, search, analyze |
| Todo continuation | Basic | Forced completion |
| Model routing | Default | Smart tiered selection |
| Skill composition | None | Automatic composition |

### When to Re-run Setup

- **First time**: Run after installation (choose project or global)
- **After updates**: Re-run to get the latest configuration
- **Different machines**: Run on each machine using Claude Code
- **New projects**: Run `/ultrapower:omc-setup --local` in each project that needs omc

### Permission Configuration

omc-setup includes a permission step that automatically writes common tool permissions to `~/.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(*)",
      "Read(*)",
      "Write(*)",
      "Edit(*)",
      "Glob(*)",
      "Grep(*)",
      "Task(*)",
      "WebFetch(*)",
      "WebSearch(*)"
    ]
  }
}
```

### Agent Customization

Edit agent files in `~/.claude/agents/` to customize behavior:

```yaml
---
name: architect
description: Your custom description
tools: Read, Grep, Glob, Bash, Edit
model: opus  # or sonnet, haiku
---

Your custom system prompt here...
```

### Config File Reference

`~/.claude/.omc-config.json`:

```json
{
  "defaultExecutionMode": "ultrawork",
  "mcpServers": {
    "context7": { "enabled": true },
    "exa": { "enabled": true, "apiKey": "..." }
  }
}
```

### Stop Callback Notification Tags

Use `omc config-stop-callback` to configure tags for Telegram/Discord stop callbacks:

```bash
# Set/replace tags
omc config-stop-callback telegram --enable --token <bot_token> --chat <chat_id> --tag-list "@alice,bob"
omc config-stop-callback discord --enable --webhook <url> --tag-list "@here,123456789012345678,role:987654321098765432"

# Incremental updates
omc config-stop-callback telegram --add-tag charlie
omc config-stop-callback discord --remove-tag @here
omc config-stop-callback discord --clear-tags

# Inspect current callback config
omc config-stop-callback telegram --show
omc config-stop-callback discord --show
```

Tag behavior:
- Telegram: `alice` is normalized to `@alice`
- Discord: supports `@here`, `@everyone`, numeric user IDs (`<@id>`), and role tags (`role:<id>` -> `<@&id>`)
- `file` type callbacks ignore tag options

---

## Execution Modes

ultrapower provides 6 execution modes for different workflow needs:

| Mode | Trigger Keywords | Description |
|------|-----------------|-------------|
| `autopilot` | "autopilot", "build me", "I want a" | Fully autonomous execution from idea to working code |
| `ultrawork` | "ulw", "ultrawork" | Maximum parallel agent execution |
| `ralph` | "ralph", "don't stop", "must complete" | Self-referential loop until verified complete |
| `ultrapilot` | "ultrapilot", "parallel build" | Parallel autopilot with file ownership (Team compatibility facade) |
| `swarm` | "swarm" | N coordinated agents using Team pipeline (compatibility facade) |
| `pipeline` | "pipeline", "chain agents" | Sequential agent chain with data passing |

### Mode Details

**autopilot** — Full autonomous execution. Detects task complexity, routes to appropriate agents, executes, validates with verifier. Can escalate to ralph for persistence or ultraqa for QA loops.

**ultrawork** — Maximum parallelism. Spawns multiple agents simultaneously for independent subtasks. Ideal for large-scale refactors or multi-file implementations.

**ralph** — Persistent execution loop. Runs until the verifier confirms completion. Includes ultrawork. Suitable for complex tasks that require multiple iterations.

**ultrapilot** — Maps to Team's phased runtime. Provides parallel execution with agent ownership tracking. Mutually exclusive with autopilot.

**swarm** — Routes to Team's phased pipeline. Preserves `/swarm` syntax. N coordinated agents with task claiming.

**pipeline** — Sequential agent chain. Each stage's output becomes the next stage's input. Explicit data passing between agents.

### Team Pipeline Phases

The Team pipeline used by swarm/ultrapilot follows:

```
team-plan -> team-prd -> team-exec -> team-verify -> team-fix (loop)
```

Phase agent routing:
- `team-plan`: `explore` (haiku) + `planner` (opus), optional `analyst`/`architect`
- `team-prd`: `analyst` (opus), optional `product-manager`/`critic`
- `team-exec`: `executor` (sonnet) + domain specialists as needed
- `team-verify`: `verifier` (sonnet) + reviewers as needed
- `team-fix`: `executor`/`build-fixer`/`debugger` based on defect type

Terminal states: `complete`, `failed`, `cancelled`.

---

## Agents (49 total)

All agents are invoked via the `ultrapower:` prefix in Task calls.

### Agent Selection Guide

| Task Type | Best Agent | Model |
|-----------|-----------|-------|
| Fast code lookup | `explore` | haiku |
| Feature implementation | `executor` | sonnet |
| Complex refactor / autonomous tasks | `deep-executor` | opus |
| Debug / root cause | `debugger` | sonnet |
| Completion verification | `verifier` | sonnet |
| System design / architecture | `architect` | opus |
| Strategic planning | `planner` | opus |
| Requirements analysis | `analyst` | opus |
| Review / critique a plan | `critic` | opus |
| UI components / design | `designer` | sonnet |
| Write docs / comments | `writer` | haiku |
| Research docs / APIs | `document-specialist` | sonnet |
| Analyze images / diagrams | `vision` | sonnet |
| Interactive CLI testing | `qa-tester` | sonnet |
| Security review | `security-reviewer` | sonnet |
| Fix build errors | `build-fixer` | sonnet |
| TDD workflow | `test-engineer` | sonnet |
| Comprehensive code review | `code-reviewer` | opus |
| Data analysis / statistics | `scientist` | sonnet |
| External packages / SDKs | `dependency-expert` | sonnet |
| Git commits / history | `git-master` | sonnet |
| Product requirements / PRD | `product-manager` | sonnet |
| Usability / accessibility audit | `ux-researcher` | sonnet |
| Information architecture | `information-architect` | sonnet |
| Product metrics / experiments | `product-analyst` | sonnet |

---

### Build/Analysis Lane (8)

| Agent | Model | Description |
|-------|-------|-------------|
| `explore` | haiku | Codebase discovery, symbol/file mapping |
| `analyst` | opus | Requirements clarification, acceptance criteria, hidden constraints |
| `planner` | opus | Task ordering, execution plans, risk flagging |
| `architect` | opus | System design, boundaries, interfaces, long-term trade-offs |
| `debugger` | sonnet | Root cause analysis, regression isolation, fault diagnosis |
| `executor` | sonnet | Code implementation, refactoring, feature development |
| `deep-executor` | opus | Complex autonomous goal-directed tasks |
| `verifier` | sonnet | Completion evidence, claim verification, test adequacy |

---

### Review Lane (6)

| Agent | Model | Description |
|-------|-------|-------------|
| `style-reviewer` | haiku | Formatting, naming, idiomatic style, lint rules |
| `quality-reviewer` | sonnet | Logic defects, maintainability, anti-patterns |
| `api-reviewer` | sonnet | API contracts, versioning, backward compatibility |
| `security-reviewer` | sonnet | Vulnerabilities, trust boundaries, auth/authz |
| `performance-reviewer` | sonnet | Hotspots, complexity, memory/latency optimization |
| `code-reviewer` | opus | Cross-concern comprehensive review |

---

### Domain Specialists (16)

| Agent | Model | Description |
|-------|-------|-------------|
| `dependency-expert` | sonnet | External SDK/API/package evaluation |
| `test-engineer` | sonnet | Test strategy, coverage, flaky test hardening |
| `quality-strategist` | sonnet | Quality strategy, release readiness, risk assessment |
| `build-fixer` | sonnet | Build/toolchain/type error repair |
| `designer` | sonnet | UX/UI architecture, interaction design |
| `writer` | haiku | Documentation, migration notes, user guides |
| `qa-tester` | sonnet | Interactive CLI/service runtime validation |
| `scientist` | sonnet | Data/statistical analysis |
| `document-specialist` | sonnet | External documentation and reference lookup |
| `git-master` | sonnet | Commit strategy, history management |
| `vision` | sonnet | Image/screenshot/diagram analysis |
| `database-expert` | sonnet | Database design, query optimization, and migrations |
| `devops-engineer` | sonnet | CI/CD, containerization, infrastructure-as-code |
| `i18n-specialist` | sonnet | Internationalization, localization, multilingual support |
| `accessibility-auditor` | sonnet | Web accessibility review and WCAG compliance |
| `api-designer` | sonnet | REST/GraphQL API design and contract definition |

Deprecated aliases (backward compatible):
- `researcher` -> `document-specialist`
- `tdd-guide` -> `test-engineer`

---

### Product Lane (4)

| Agent | Model | Description |
|-------|-------|-------------|
| `product-manager` | sonnet | Problem framing, user personas/JTBD, PRD |
| `ux-researcher` | sonnet | Heuristic audit, usability, accessibility |
| `information-architect` | sonnet | Taxonomy, navigation, discoverability |
| `product-analyst` | sonnet | Product metrics, funnel analysis, experiments |

---

### Axiom Lane (14)

| Agent | Model | Description |
|-------|-------|-------------|
| `axiom-requirement-analyst` | sonnet | Requirements tri-state gate (PASS/CLARIFY/REJECT) |
| `axiom-product-designer` | sonnet | Draft PRD generation with Mermaid flowcharts |
| `axiom-review-aggregator` | sonnet | 5-expert parallel review aggregation and conflict arbitration |
| `axiom-prd-crafter` | sonnet | Engineering-grade PRD with gated validation |
| `axiom-system-architect` | sonnet | Atomic task DAG and Manifest generation |
| `axiom-evolution-engine` | sonnet | Knowledge harvesting, pattern detection, workflow optimization |
| `axiom-context-manager` | sonnet | 7-operation memory system (read/write/state/checkpoint) |
| `axiom-worker` | sonnet | PM->Worker protocol, tri-state output (QUESTION/COMPLETE/BLOCKED) |
| `axiom-ux-director` | sonnet | UX/experience expert review, outputs review_ux.md |
| `axiom-product-director` | sonnet | Product strategy expert review, outputs review_product.md |
| `axiom-domain-expert` | sonnet | Domain knowledge expert review, outputs review_domain.md |
| `axiom-tech-lead` | sonnet | Technical feasibility review, outputs review_tech.md |
| `axiom-critic` | sonnet | Security/quality/logic review, outputs review_critic.md |
| `axiom-sub-prd-writer` | sonnet | Decompose Manifest tasks into executable Sub-PRDs |

---

### Coordination (1)

| Agent | Model | Description |
|-------|-------|-------------|
| `critic` | opus | Critical challenge of plans and designs |

---

## Skills (71 total)

All skills are invocable as slash commands with `/ultrapower:` prefix.

### Workflow Skills

Core orchestration and execution skills:

| Skill | Command | Description |
|-------|---------|-------------|
| `autopilot` | `/ultrapower:autopilot` | Fully autonomous execution from idea to working code |
| `ultrawork` | `/ultrapower:ultrawork` | Maximum parallel agent execution |
| `ultrapilot` | `/ultrapower:ultrapilot` | Parallel autopilot, 3-5x speed improvement |
| `swarm` | `/ultrapower:swarm` | N coordinated agents with Team pipeline |
| `team` | `/ultrapower:team` | N coordinated agents using Claude Code native team |
| `pipeline` | `/ultrapower:pipeline` | Sequential agent chain with data passing |
| `ralph` | `/ultrapower:ralph` | Self-referential development until complete |
| `ralph-init` | `/ultrapower:ralph-init` | Initialize PRD for structured task tracking |
| `ultraqa` | `/ultrapower:ultraqa` | Autonomous QA loop workflow |
| `plan` | `/ultrapower:plan` | Start a planning session |
| `ralplan` | `/ultrapower:ralplan` | Iterative planning (Planner+Architect+Critic) |
| `review` | `/ultrapower:review` | Review a work plan with critic |
| `ccg` | `/ultrapower:ccg` | Claude-Codex-Gemini three-model parallel orchestration |

---

### Axiom Skills

| Skill | Command | Description |
|-------|---------|-------------|
| `ax-draft` | `/ultrapower:ax-draft` | Requirements clarification -> Draft PRD -> user confirm |
| `ax-review` | `/ultrapower:ax-review` | 5-expert parallel review -> aggregation -> Rough PRD |
| `ax-decompose` | `/ultrapower:ax-decompose` | Rough PRD -> system architecture -> atomic task DAG |
| `ax-implement` | `/ultrapower:ax-implement` | Execute Axiom tasks with CI gate, auto-repair |
| `ax-analyze-error` | `/ultrapower:ax-analyze-error` | Root cause diagnosis -> auto-fix -> knowledge queue |
| `ax-reflect` | `/ultrapower:ax-reflect` | Session reflection -> experience extraction -> action items |
| `ax-evolve` | `/ultrapower:ax-evolve` | Process learning queue -> update knowledge base -> pattern detection |
| `ax-status` | `/ultrapower:ax-status` | Full system status dashboard |
| `ax-rollback` | `/ultrapower:ax-rollback` | Roll back to the last checkpoint (user confirmation required) |
| `ax-suspend` | `/ultrapower:ax-suspend` | Save session state and safely exit |
| `ax-context` | `/ultrapower:ax-context` | Directly operate the Axiom memory system |
| `ax-evolution` | `/ultrapower:ax-evolution` | Evolution engine unified entry (evolve/reflect/knowledge/patterns) |
| `ax-knowledge` | `/ultrapower:ax-knowledge` | Query the Axiom knowledge base |
| `ax-export` | `/ultrapower:ax-export` | Export Axiom workflow artifacts as portable zip |

---

### Superpowers Skills

Structured guidance for advanced workflows:

| Skill | Command | Description |
|-------|---------|-------------|
| `brainstorming` | `/ultrapower:brainstorming` | Structured exploration of requirements and design options |
| `writing-plans` | `/ultrapower:writing-plans` | Decompose requirements into atomic task plans |
| `subagent-driven-development` | `/ultrapower:subagent-driven-development` | Execute independent tasks in current session |
| `executing-plans` | `/ultrapower:executing-plans` | Execute plans in independent sessions |
| `test-driven-development` | `/ultrapower:test-driven-development` | TDD enforcement: test-first development |
| `systematic-debugging` | `/ultrapower:systematic-debugging` | Systematic debugging workflow |
| `requesting-code-review` | `/ultrapower:requesting-code-review` | Request code review after task completion |
| `receiving-code-review` | `/ultrapower:receiving-code-review` | Receive and process code review feedback |
| `finishing-a-development-branch` | `/ultrapower:finishing-a-development-branch` | Complete development branch and integrate work |
| `using-git-worktrees` | `/ultrapower:using-git-worktrees` | Create isolated git worktree workspaces |
| `verification-before-completion` | `/ultrapower:verification-before-completion` | Run verification before claiming completion |
| `using-superpowers` | `/ultrapower:using-superpowers` | Establish skill usage rules |
| `dispatching-parallel-agents` | `/ultrapower:dispatching-parallel-agents` | Dispatch independent tasks to multiple agents in parallel |
| `next-step-router` | (internal) | Analyze outputs at critical nodes, recommend optimal next step |
| `writing-skills` | `/ultrapower:writing-skills` | Create/edit/validate skills |

---

### Agent Shortcuts

Lightweight wrappers for common agent invocations:

| Skill | Command | Routes To | Triggers |
|-------|---------|-----------|---------|
| `analyze` | `/ultrapower:analyze` | `debugger` | "analyze", "debug", "investigate" |
| `deepsearch` | `/ultrapower:deepsearch` | `explore` | "search", "find in codebase" |
| `tdd` | `/ultrapower:tdd` | `test-engineer` | "tdd", "test first", "red green" |
| `build-fix` | `/ultrapower:build-fix` | `build-fixer` | "fix build", "type errors" |
| `code-review` | `/ultrapower:code-review` | `code-reviewer` | "review code" |
| `security-review` | `/ultrapower:security-review` | `security-reviewer` | "security review" |
| `frontend-ui-ux` | (silent activation) | `designer` | UI/component/styling work |
| `git-master` | (silent activation) | `git-master` | git/commit work |
| `sciomc` | `/ultrapower:sciomc` | parallel `scientist` | "sciomc" |
| `external-context` | `/ultrapower:external-context` | parallel `document-specialist` | web search |

---

### Utility Skills

| Skill | Command | Description |
|-------|---------|-------------|
| `note` | `/ultrapower:note` | Save notes to compression-resistant notepad |
| `cancel` | `/ultrapower:cancel` | Unified cancel of all active modes |
| `omc-setup` | `/ultrapower:omc-setup` | One-time installation wizard |
| `omc-doctor` | `/ultrapower:omc-doctor` | Diagnose and repair installation issues |
| `omc-help` | `/ultrapower:omc-help` | Display OMC usage guide |
| `hud` | `/ultrapower:hud` | Configure HUD status bar |
| `release` | `/ultrapower:release` | Automated release workflow |
| `mcp-setup` | `/ultrapower:mcp-setup` | Configure MCP servers |
| `writer-memory` | `/ultrapower:writer-memory` | Agent memory system for writers |
| `project-session-manager` | `/ultrapower:project-session-manager` | Manage isolated dev environments (git worktrees + tmux) |
| `psm` | `/ultrapower:psm` | Alias for project-session-manager |
| `skill` | `/ultrapower:skill` | Manage local skills (list, add, delete, search, edit) |
| `configure-discord` | `/ultrapower:configure-discord` | Configure Discord webhook/bot notifications |
| `configure-telegram` | `/ultrapower:configure-telegram` | Configure Telegram bot notifications |
| `wizard` | `/ultrapower:wizard` | Interactive configuration wizard |
| `nexus` | `/ultrapower:nexus` | Active learning system management (Phase 2 self-improvement) |
| `deepinit` | `/ultrapower:deepinit` | Deep codebase initialization with layered AGENTS.md |
| `learner` | `/ultrapower:learner` | Extract reusable skill from session |
| `trace` | `/ultrapower:trace` | Display agent flow trace timeline |
| `learn-about-omc` | `/ultrapower:learn-about-omc` | Learn OMC usage patterns and get recommendations |

---

## Custom Tools (35 total)

ultrapower exposes **35 custom tools** via the `mcp__plugin_ultrapower_t__` prefix.

| Category | Count | Tool Prefix |
|----------|-------|-------------|
| LSP (Language Server Protocol) | 12 | `lsp_*` |
| AST (Structured code search) | 2 | `ast_grep_*` |
| Python REPL | 1 | `python_repl` |
| Notepad (Session memory) | 6 | `notepad_*` |
| State (Execution mode state) | 5 | `state_*` |
| Project Memory (Project-level memory) | 4 | `project_memory_*` |
| Trace (Flow tracing) | 2 | `trace_*` |
| Skills (Skill loading) | 3 | `*_omc_skills*` |
| **Total** | **35** | |

> **Disable tool groups**: Set `OMC_DISABLE_TOOLS=lsp,python-repl,project-memory` to disable specific groups at startup. Supported group names: `lsp`, `ast`, `python`/`python-repl`, `trace`, `state`, `notepad`, `memory`/`project-memory`, `skills`.

---

### LSP Tools (12)

IDE-grade code intelligence via Language Server Protocol:

```
mcp__plugin_ultrapower_t__lsp_hover              -- Type info and docs at position
mcp__plugin_ultrapower_t__lsp_goto_definition    -- Jump to symbol definition
mcp__plugin_ultrapower_t__lsp_find_references    -- Find all usages
mcp__plugin_ultrapower_t__lsp_document_symbols   -- File outline (functions, classes)
mcp__plugin_ultrapower_t__lsp_workspace_symbols  -- Search symbols across workspace
mcp__plugin_ultrapower_t__lsp_diagnostics        -- Errors, warnings, hints (single file)
mcp__plugin_ultrapower_t__lsp_diagnostics_directory  -- Project-level type checking
mcp__plugin_ultrapower_t__lsp_servers            -- List available language servers
mcp__plugin_ultrapower_t__lsp_prepare_rename     -- Check if rename is valid
mcp__plugin_ultrapower_t__lsp_rename             -- Preview multi-file rename
mcp__plugin_ultrapower_t__lsp_code_actions       -- Available refactors/quick fixes
mcp__plugin_ultrapower_t__lsp_code_action_resolve -- Get action details
```

Supported languages: TypeScript, Python, Rust, Go, C/C++, Java, JSON, HTML, CSS, YAML.

> **Note**: LSP tools require language server installation (typescript-language-server, pylsp, rust-analyzer, gopls, etc.). Use `lsp_servers` to check installation status.

---

### AST Tools (2)

Structural code search and transformation via ast-grep:

```
mcp__plugin_ultrapower_t__ast_grep_search   -- Pattern-based AST matching with meta-variables ($NAME, $$$ARGS)
mcp__plugin_ultrapower_t__ast_grep_replace  -- AST-aware code transformation (dry-run by default)
```

Supported languages: JavaScript, TypeScript, TSX, Python, Ruby, Go, Rust, Java, Kotlin, Swift, C, C++, C#, HTML, CSS, JSON, YAML.

---

### Python REPL (1)

```
mcp__plugin_ultrapower_t__python_repl  -- Persistent Python REPL with pandas/numpy/matplotlib for data analysis
```

---

### Notepad Tools (6)

Compression-resistant session memory stored at `{worktree}/.omc/notepad.md`:

```
mcp__plugin_ultrapower_t__notepad_read            -- Read notepad (sections: all/priority/working/manual)
mcp__plugin_ultrapower_t__notepad_write_priority  -- Write priority context (<=500 chars, auto-loaded at session start)
mcp__plugin_ultrapower_t__notepad_write_working   -- Write working memory (timestamped, auto-pruned after 7 days)
mcp__plugin_ultrapower_t__notepad_write_manual    -- Write manual record (permanent, never auto-pruned)
mcp__plugin_ultrapower_t__notepad_prune           -- Prune working memory entries older than N days
mcp__plugin_ultrapower_t__notepad_stats           -- Get notepad statistics (size, entry count, oldest entry)
```

---

### State Tools (5)

Execution mode state management stored at `{worktree}/.omc/state/{mode}-state.json`:

```
mcp__plugin_ultrapower_t__state_read          -- Read state for a mode (autopilot/ralph/ultrawork/team etc.)
mcp__plugin_ultrapower_t__state_write         -- Write/update mode state (supports active, iteration, phase fields)
mcp__plugin_ultrapower_t__state_clear         -- Clear state file for a mode
mcp__plugin_ultrapower_t__state_list_active   -- List all currently active modes
mcp__plugin_ultrapower_t__state_get_status    -- Get detailed status for a mode or all modes
```

Supported modes: `autopilot`, `ultrapilot`, `team`, `pipeline`, `ralph`, `ultrawork`, `ultraqa`, `ralplan`.

> **Security**: The `mode` parameter must pass `assertValidMode()` validation before path concatenation to prevent path traversal. See [Security & Safety Rules](#security--safety-rules).

---

### Project Memory Tools (4)

Project-level persistent memory stored at `{worktree}/.omc/project-memory.json`:

```
mcp__plugin_ultrapower_t__project_memory_read          -- Read project memory (sections: techStack/build/conventions/structure/notes/directives)
mcp__plugin_ultrapower_t__project_memory_write         -- Write/update project memory (merge mode supported)
mcp__plugin_ultrapower_t__project_memory_add_note      -- Add categorized note (build/test/deploy/env/architecture etc.)
mcp__plugin_ultrapower_t__project_memory_add_directive -- Add user directive (cross-session persistent, compression-resistant)
```

---

### Trace Tools (2)

Agent flow tracing and session analytics:

```
mcp__plugin_ultrapower_t__trace_timeline  -- Chronological agent flow trace (hooks/skills/agents/keywords/tools/modes)
mcp__plugin_ultrapower_t__trace_summary   -- Session aggregate stats (hook counts, keyword frequency, skill activations, tool bottlenecks)
```

---

### Skills Tools (3)

Skill loading and discovery:

```
mcp__plugin_ultrapower_t__load_omc_skills_local   -- Load OMC skills from project local
mcp__plugin_ultrapower_t__load_omc_skills_global  -- Load OMC skills from global installation
mcp__plugin_ultrapower_t__list_omc_skills         -- List all available skills
```

---

## Hooks System (35 hooks)

ultrapower includes 35 lifecycle hooks that enhance Claude Code behavior.

### Execution Mode Hooks

| Hook | Description |
|------|-------------|
| `autopilot` | Fully autonomous execution from idea to working code |
| `ultrawork` | Maximum parallel agent execution |
| `ralph` | Persistent execution until verified complete |
| `ultrapilot` | Parallel autopilot with file ownership |
| `ultraqa` | QA loop until goal is achieved |
| `mode-registry` | Tracks current execution mode (ultrawork, ralph, team, etc.) |
| `persistent-mode` | Maintains mode state across sessions |

### Core Hooks

| Hook | Description |
|------|-------------|
| `rules-injector` | Dynamic rule injection with YAML frontmatter parsing |
| `omc-orchestrator` | Enforces orchestrator behavior and delegation |
| `auto-slash-command` | Auto-detects and executes slash commands |
| `keyword-detector` | Magic keyword detection (ultrawork, ralph, etc.) |
| `todo-continuation` | Ensures todo list completion |
| `notepad` | Compression-resistant memory system |
| `learner` | Extracts skills from conversations |

### Context & Recovery Hooks

| Hook | Description |
|------|-------------|
| `recovery` | Edit error, session, and context window recovery |
| `preemptive-compaction` | Monitors context usage to prevent overflow |
| `pre-compact` | Pre-compaction processing |
| `subagent-stop` | Triggered when sub-agents complete, prevents infinite loops |
| `teammate-idle` | Triggered when team members idle, permits by default |
| `session-end` | Session termination cleanup of temporary state |
| `user-prompt-submit` | Triggered before user submits prompt, for keyword detection |
| `permission-request` | Triggered on tool permission requests |
| `task-completed` | Triggered on task completion |
| `config-change` | Triggered on configuration changes |
| `directory-readme-injector` | README context injection |

### Quality & Validation Hooks

| Hook | Description |
|------|-------------|
| `comment-checker` | BDD detection and instruction filtering |
| `thinking-block-validator` | Extended thinking validation |
| `empty-message-sanitizer` | Empty message handling |
| `permission-handler` | Permission request and validation |
| `think-mode` | Extended thinking detection |

### Coordination & Environment Hooks

| Hook | Description |
|------|-------------|
| `subagent-tracker` | Tracks spawned sub-agents |
| `flow-tracer` | Agent flow trace recording (hook triggers, keyword detection, skill activations, mode changes) |
| `non-interactive-env` | CI/non-interactive environment handling |
| `agent-usage-reminder` | Reminds to use specialist agents |
| `background-notification` | Background task completion notifications |
| `plugin-patterns` | Plugin pattern detection |
| `setup` | Initial installation and configuration |
| `beads-context` | Context bead chain management |
| `project-memory` | Project-level memory management |

### Axiom Hooks (2)

| Hook | Location | Description |
|------|----------|-------------|
| `axiom-boot` | `src/hooks/axiom-boot/` | Inject Axiom memory context at session startup |
| `axiom-guards` | `src/hooks/axiom-guards/` | Gate rule enforcement (Expert/User/CI Gate) |

### Hook Runtime Guarantees

- Hook inputs use snake_case fields: `tool_name`, `tool_input`, `tool_response`, `session_id`, `cwd`, `hook_event_name`
- Kill switches: `DISABLE_OMC` (disable all hooks), `OMC_SKIP_HOOKS` (skip specific hooks by comma-separated names)
- Sensitive hook fields (permission-request, setup, session-end) are filtered through strict whitelist in bridge-normalize; unknown fields are discarded
- Required key validation per hook event type (e.g., session-end requires `sessionId`, `directory`)
- `SubagentStop` inference: Never read `input.success` directly; use `input.success !== false`

---

## MCP Integration

### MCP Providers

| Provider | Tool | Best For |
|----------|------|---------|
| Codex (OpenAI) | `mcp__x__ask_codex` | Architecture review, planning validation, code review, security review |
| Gemini (Google) | `mcp__g__ask_gemini` | UI/UX design review, docs, large-context tasks (1M tokens) |

Any OMC agent role can be passed as `agent_role` to either provider.

### Tool Discovery

MCP tools are lazy-loaded and not in your tool list at session start. Before first use, call `ToolSearch` to discover:

```
ToolSearch("mcp")       -- discover all MCP tools (recommended, run once early)
ToolSearch("ask_codex") -- discover Codex specifically
ToolSearch("ask_gemini") -- discover Gemini specifically
```

If ToolSearch returns no results, the MCP server is not configured — fall back to equivalent Claude agents.

### Local MCP Tools (via `claude mcp add`)

| Tool | Description |
|------|-------------|
| `sequential-thinking` | Structured step-by-step reasoning — breaks complex problems into ordered thought chains |
| `software-planning-tool` | Task planning and decomposition — structured task analysis, dependency graphs, execution tracking |

### MCP Path Boundary Rules

MCP tools (`ask_codex`, `ask_gemini`) enforce strict path boundaries. Both `prompt_file` and `output_file` are resolved relative to `working_directory`.

| Parameter | Requirement |
|-----------|-------------|
| `prompt_file` | Must be within `working_directory` (after symlink resolution) |
| `output_file` | Must be within `working_directory` (after symlink resolution) |
| `working_directory` | Must be within the project worktree (unless bypassed) |

### Environment Variable Overrides

| Variable | Values | Description |
|----------|--------|-------------|
| `OMC_MCP_OUTPUT_PATH_POLICY` | `strict` (default), `redirect_output` | Controls output file path enforcement |
| `OMC_MCP_OUTPUT_REDIRECT_DIR` | path (default: `.omc/outputs`) | Redirect directory when policy is `redirect_output` |
| `OMC_MCP_ALLOW_EXTERNAL_PROMPT` | `0` (default), `1` | Allow prompt file outside working directory |
| `OMC_ALLOW_EXTERNAL_WORKDIR` | unset (default), `1` | Allow working_directory outside project worktree |
| `OMC_DISCORD_WEBHOOK_URL` | URL | Discord webhook URL for notifications |
| `OMC_DISCORD_NOTIFIER_BOT_TOKEN` | Token | Discord bot token for Bot API notifications |
| `OMC_DISCORD_NOTIFIER_CHANNEL` | Channel ID | Discord channel ID for Bot API notifications |
| `OMC_DISCORD_MENTION` | `<@uid>` or `<@&role_id>` | Mention prepended to Discord messages |
| `OMC_TELEGRAM_BOT_TOKEN` | Token | Telegram bot token for notifications |
| `OMC_TELEGRAM_CHAT_ID` | Chat ID | Telegram chat ID for notifications |
| `OMC_SLACK_WEBHOOK_URL` | URL | Slack incoming webhook URL for notifications |

### MCP Error Codes

| Error Code | Meaning |
|-----------|---------|
| `E_PATH_OUTSIDE_WORKDIR_PROMPT` | prompt_file is outside working_directory |
| `E_PATH_OUTSIDE_WORKDIR_OUTPUT` | output_file is outside working_directory |
| `E_PATH_RESOLUTION_FAILED` | Symlink or directory resolution failed |
| `E_WRITE_FAILED` | Output file write failed (I/O error) |
| `E_WORKDIR_INVALID` | working_directory does not exist or is inaccessible |

---

## Security & Safety Rules

### Non-Negotiable Security Rules

These rules are enforced at the framework level and must not be bypassed:

**1. Path Traversal Prevention**

The `mode` parameter must pass `assertValidMode()` validation before path concatenation:

```typescript
import { assertValidMode } from './src/lib/validateMode';
const validMode = assertValidMode(mode);
const path = `.omc/state/${validMode}-state.json`;
```

**2. Hook Input Sanitization**

All hook inputs pass through `bridge-normalize.ts` whitelist filtering. Unknown fields are discarded. This prevents injection attacks via malformed hook payloads.

**3. Shell Execution Safety (v5.5.0+)**

Shell commands use `execFileSync` instead of `exec`/`execSync` to prevent shell injection. Arguments are passed as arrays, not interpolated strings.

**4. Sensitive Hook Field Filtering (v5.5.0+)**

The `SENSITIVE_HOOKS` constant in bridge-normalize defines hooks with sensitive fields (permission-request, setup, session-end). These hooks apply strict field whitelisting — only explicitly allowed fields pass through.

**5. SubagentStop Inference Rule**

Never read `input.success` directly. Use `input.success !== false` to allow undefined/missing values to be treated as success. This prevents false-positive blocking of legitimate sub-agent completions.

### Delegation Enforcer (v5.5.2+)

The `delegation-enforcer` feature ensures the orchestrator delegates implementation work rather than executing it directly. When triggered, it routes substantial code changes to the appropriate executor agent and logs the delegation decision.

### Security Review Checklist

When modifying security-sensitive code, verify:
- [ ] `mode` parameters validated with `assertValidMode()` before path use
- [ ] Hook field access uses whitelist pattern from bridge-normalize
- [ ] Shell commands use `execFileSync` with argument arrays
- [ ] No `eval()` or dynamic `require()` with untrusted input
- [ ] State file paths constrained to `.omc/state/` directory

---

## Magic Keywords

Include any of the following keywords anywhere in your prompt to activate enhanced modes:

| Keyword | Effect |
|---------|--------|
| `ultrawork`, `ulw` | Activate parallel agent orchestration |
| `autopilot`, `auto-pilot`, `fullsend`, `full auto` | Fully autonomous execution |
| `ultrapilot`, `ultra-pilot`, `parallel build`, `swarm build` | Parallel autopilot (3-5x speed) |
| `ralph` | Persistent execution until verified complete |
| `team`, `coordinated team` | Team mode multi-agent coordination |
| `swarm N agents`, `coordinated agents`, `team mode` | Coordinated agent cluster |
| `plan this`, `plan the` | Planning interview workflow |
| `ralplan` | Iterative planning consensus |
| `tdd`, `test first` | TDD workflow enforcement |
| `ultrathink` | Extended thinking mode |
| `deepsearch`, `search the codebase`, `find in codebase` | Deep codebase search |
| `deep analyze`, `deepanalyze` | Deep analysis mode |
| `ccg`, `claude-codex-gemini` | Three-model parallel orchestration |
| `ask codex`, `use codex`, `delegate to codex` | Delegate to Codex (OpenAI) |
| `ask gemini`, `use gemini`, `delegate to gemini` | Delegate to Gemini (Google) |
| `agent pipeline`, `chain agents` | Sequential agent chain |
| `cancelomc`, `stopomc` | Unified cancel of all active modes |

### Examples

```bash
# Maximum parallelism
ultrawork implement user authentication with OAuth

# Autonomous execution
autopilot: build a todo app with React

# Persistent execution
ralph: refactor the authentication module

# Planning session
plan this feature

# TDD workflow
tdd: implement password validation

# Three-model orchestration
ccg: implement the payment module

# Cancel active modes
cancelomc
```

---

## Platform Support

### Operating Systems

| Platform | Installation | Hook Type |
|----------|-------------|-----------|
| **Windows** | Claude Code Plugin | Node.js (.mjs) |
| **macOS** | Claude Code Plugin | Node.js (.mjs) |
| **Linux** | Claude Code Plugin | Node.js (.mjs) |

> **Note**: Set `OMC_USE_NODE_HOOKS=1` to use Node.js hooks on macOS/Linux.

### Available Tools

| Tool | Status | Description |
|------|--------|-------------|
| **Read** | Available | Read files |
| **Write** | Available | Create files |
| **Edit** | Available | Modify files |
| **Bash** | Available | Run shell commands |
| **Glob** | Available | Find files by pattern |
| **Grep** | Available | Search file contents |
| **WebSearch** | Available | Search the web |
| **WebFetch** | Available | Fetch web pages |
| **Task** | Available | Spawn sub-agents |
| **TodoWrite** | Available | Track tasks |

---

## Performance Monitoring

ultrapower includes comprehensive agent performance, token usage, and parallel workflow debugging.

Full documentation: **[Performance Monitoring Guide](./PERFORMANCE-MONITORING.md)**

### Quick Overview

| Feature | Description | Access |
|---------|-------------|--------|
| **Agent Observatory** | Real-time agent status, efficiency, bottlenecks | HUD / API |
| **Token Analytics** | Cost tracking, usage reports, budget warnings | `omc stats`, `omc cost` |
| **Session Replay** | Post-session event timeline analysis | `.omc/state/agent-replay-*.jsonl` |
| **Intervention System** | Auto-detects stalled agents and cost overruns | Automatic |

### CLI Commands

CLI entry points: `ultrapower`, `omc`, `omc-cli` (all equivalent).

```bash
omc stats          # Current session statistics
omc cost daily     # Daily cost report
omc cost weekly    # Weekly cost report
omc sessions       # List session records
omc agents         # Agent breakdown
omc export         # Export data
omc cleanup        # Clean up old data
omc backfill       # Import historical data
omc wait           # Wait for background task completion
omc config-stop-callback  # Configure stop callback notification tags
```

### HUD Configuration

Configure HUD elements in `~/.claude/settings.json`:

```json
{
  "omcHud": {
    "preset": "focused",
    "elements": {
      "cwd": true,
      "gitRepo": true,
      "gitBranch": true
    }
  }
}
```

| Element | Description | Default |
|---------|-------------|---------|
| `cwd` | Display current working directory | `false` |
| `gitRepo` | Display git repository name | `false` |
| `gitBranch` | Display current git branch | `false` |
| `omcLabel` | Display [OMC] label | `true` |
| `contextBar` | Display context window usage | `true` |
| `agents` | Display active agent count | `true` |
| `todos` | Display todo progress | `true` |
| `ralph` | Display ralph loop status | `true` |
| `autopilot` | Display autopilot status | `true` |
| `axiom` | Display Axiom system status | `false` |
| `suggestions` | Display smart next-step suggestions | `false` |

Available presets: `minimal`, `focused`, `full`, `dense`, `analytics`, `opencode`

---

## Troubleshooting

### Diagnose Installation Issues

```bash
/ultrapower:omc-doctor
```

Checks:
- Missing dependencies
- Configuration errors
- Hook installation status
- Agent availability
- Skill registration

### Common Issues

| Issue | Resolution |
|-------|-----------|
| Command not found | Re-run `/ultrapower:omc-setup` |
| Hooks not executing | Check hook permissions: `chmod +x ~/.claude/hooks/**/*.sh` |
| Agents not delegating | Verify CLAUDE.md is loaded: check `./.claude/CLAUDE.md` or `~/.claude/CLAUDE.md` |
| LSP tools not working | Install language server: `npm install -g typescript-language-server` |
| Token limit errors | Use `/ultrapower:` for token-efficient execution |
| Path traversal error | Ensure mode parameter passes `assertValidMode()` validation |

### Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/liangjie559567/ultrapower/main/scripts/uninstall.sh | bash
```

Or manually:

```bash
rm ~/.claude/agents/{architect,document-specialist,explore,designer,writer,vision,critic,analyst,executor,qa-tester}.md
rm ~/.claude/commands/{analyze,autopilot,deepsearch,plan,review,ultrawork}.md
```

---

## Axiom System

ultrapower deeply integrates the Axiom agent orchestration framework, providing a complete requirements -> development -> evolution workflow.

### Axiom State Machine

```
IDLE -> PLANNING -> CONFIRMING -> EXECUTING -> AUTO_FIX -> BLOCKED -> ARCHIVING -> IDLE
```

### Axiom Gate System

| Gate | Trigger | Action |
|------|---------|--------|
| Expert Gate | All new feature requirements | Must pass `/ax-draft` -> `/ax-review` flow |
| User Gate | PRD draft finalization | Must display "PRD generated, confirm execution? (Yes/No)" |
| CI Gate | Code modification completion | Must run `tsc --noEmit && npm run build && npm test` |
| Scope Gate | File modification | Check if within `manifest.md` Impact Scope; out-of-scope triggers warning |

### Axiom Memory System

```
.omc/axiom/
├── active_context.md       # Current task state (short-term memory)
├── project_decisions.md    # Architecture decision records (long-term memory)
├── user_preferences.md     # User preferences
├── state_machine.md        # State machine definition
├── reflection_log.md       # Reflection log
└── evolution/
    ├── knowledge_base.md   # Knowledge graph (confidence system)
    ├── pattern_library.md  # Code pattern library (promoted at >= 3 occurrences)
    ├── learning_queue.md   # Pending learning materials (P0-P3 priority)
    └── workflow_metrics.md # Workflow execution metrics
```

### Axiom Worker Protocol

Worker agents receive atomic tasks from PM, and output one of three formats:

```
## QUESTION
Question: [specific question]
Reason: [why clarification is needed]
```

```
## COMPLETE
Completed: [task description]
Changes: [list of modified files]
Verification: [CI command output]
```

```
## BLOCKED
Reason: [blocking cause]
Attempted: [methods tried]
Needs: [what help is needed]
```

**Self-repair strategy**: Up to 3 attempts. After each failure, runs `tsc --noEmit && npm run build && npm test`. After 3 failures, outputs BLOCKED.

### Axiom Evolution Engine (Auto-Behavior)

| Trigger Event | Auto-Action |
|--------------|------------|
| Task completed | Add code changes to `learning_queue.md` |
| Error fix successful | Add fix pattern to learning queue (P1) |
| Workflow completed | Update `workflow_metrics.md` |
| State -> ARCHIVING | Auto-trigger `/ax-reflect` |
| State -> IDLE | Process learning queue (P0/P1) |

### Tool Adapter Files

| File | Target Tool |
|------|------------|
| `.kiro/steering/axiom.md` | Kiro |
| `.cursorrules` | Cursor |
| `.gemini/GEMINI.md` | Gemini |
| `.gemini/GEMINI-CLI.md` | Gemini CLI |
| `.opencode/OPENCODE.md` | OpenCode CLI |
| `.github/copilot-instructions.md` | GitHub Copilot |
| `.codex/CODEX.md` | Codex CLI |

For detailed Axiom documentation see:
- **[docs/EVOLUTION.md](./EVOLUTION.md)** — Axiom self-evolution system complete documentation
- **[docs/NEXUS.md](./NEXUS.md)** — Nexus active evolution system complete documentation

---

## Changelog

For version history and release notes see [CHANGELOG.md](../CHANGELOG.md).

### Key Version Milestones

- **v5.5.5** — This release: comprehensive reference documentation rewrite
- **v5.5.2** — delegation-enforcer: ensures orchestrator delegates implementation work
- **v5.5.0** — Security hardening: `assertValidMode()`, `execFileSync`, `SENSITIVE_HOOKS`, bridge-normalize strict whitelist
- **v5.4.x** — Axiom deep integration: 14 agents, 14 skills, 2 hooks
- **v5.2.x** — Team pipeline with phased routing; ultrapilot/swarm as Team facades
- **v5.0.x** — 35 custom tools via `mcp__plugin_ultrapower_t__` prefix

---

## License

MIT — see [LICENSE](../LICENSE)

## Credits

Inspired by code-yeongyu's [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode).
