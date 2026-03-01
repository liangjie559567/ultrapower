# Delegation Enforcer Integration Design

**Status:** IMPLEMENTED (v5.5.2)
**Scope:** `src/hooks/bridge.ts`, `src/features/delegation-enforcer.ts`
**Reviewer:** Product Gate — confirmed

---

## 1. Problem

When Claude Code orchestrators dispatch sub-agents via `Task` or `Agent` calls,
the `model` parameter is often omitted. The Claude Code SDK does **not**
automatically apply the default model from agent definitions — every call must
include it explicitly. This causes most delegated agents to run on the caller's
model (typically opus) rather than the cost-appropriate tier.

**Impact:** Explore agents (should be haiku) run as opus; executor agents (should
be sonnet) run as opus → 3–10× cost amplification for typical swarm workloads.

---

## 2. Architecture

### 2.1 Module Boundaries

```
src/hooks/bridge.ts              ← orchestrates all pre-tool-use processing
  └─ processPreToolUse()
       ├─ processOrchestratorPreTool()    ← delegation BLOCKING (omc-orchestrator)
       ├─ ... (AskUserQuestion, pkill, background guard, file ownership)
       └─ enforceDelegationModel()        ← model INJECTION (delegation-enforcer) ← NEW
            └─ src/features/delegation-enforcer.ts
                 ├─ isAgentCall()
                 ├─ enforceModel()
                 └─ processPreToolUse()   (called as enforceDelegationModel)
```

**Note:** `processOrchestratorPreTool` (omc-orchestrator) handles whether an
orchestrator *should* delegate. `processPreToolUse` in delegation-enforcer handles
*how* to route that delegation (which model tier to use).

### 2.2 Relationship with processOrchestratorPreTool

| Concern | Module | Action |
|---------|--------|--------|
| Should orchestrator direct-edit? | omc-orchestrator | Block / warn |
| Which model for Task/Agent? | delegation-enforcer | Inject model |

These are orthogonal concerns. delegation-enforcer only activates for Task/Agent
tool calls; omc-orchestrator activates for Edit/Write/Bash tool calls.

---

## 3. Hook Type Scope

**Trigger:** `pre-tool-use` only.

**Tool filter:** `toolName === 'Task' || toolName === 'Agent'`

All other tools (Bash, Edit, Write, Read, Glob, etc.) pass through unchanged.

---

## 4. modifiedInput Protocol

The Claude Code SDK reads `modifiedInput` from the hook's JSON output and
substitutes it for the original tool input when `continue: true`.

### 4.1 Injection Position

`model` is injected at the **top level** of the tool input object (alongside
`description`, `prompt`, `subagent_type`):

```json
{
  "description": "Explore the codebase",
  "prompt": "Find all TypeScript files",
  "subagent_type": "ultrapower:explore",
  "model": "haiku"
}
```

### 4.2 Injection Rules

| Condition | Behavior |
|-----------|----------|
| `model` already present | Preserve original; no injection |
| `model` absent, agent type known | Inject from agent definition |
| `model` absent, agent type unknown | Pass through unchanged (no throw) |
| Tool is not Task/Agent | Pass through unchanged |

### 4.3 Model Tier Mapping

Default models come from `getAgentDefinitions()`. Key mappings:

| Agent | Default Model |
|-------|--------------|
| explore, explore-low | haiku |
| executor, executor-medium | sonnet |
| executor-high, deep-executor | opus |
| architect, critic | opus |
| designer, writer | sonnet / haiku |

The `-low`/`-medium`/`-high` suffix variants follow the tiered agent convention.

### 4.4 HookOutput format

```typescript
{
  continue: true,
  modifiedInput: { ...originalInput, model: 'haiku' },  // when injected
  message?: string,  // optional dashboard / enforcement message
}
```

When no injection occurs (model already set or non-agent tool):

```typescript
{
  continue: true,
  modifiedInput: originalInput,  // unchanged reference
  message?: string,
}
```

---

## 5. Error Handling

- Unknown agent types: log debug warning, return `modifiedInput: originalInput`
  (no throw — robustness over strictness in hot path)
- `getAgentDefinitions()` failure: catch, log error, pass through unchanged
- Preserves `run_in_background`, `resume`, and all other input fields

---

## 6. Debug Logging

When `OMC_DEBUG=true`, `console.warn` outputs:

```
[OMC] Auto-injecting model: haiku for explore
```

No output when `OMC_DEBUG` is unset or `false`.

---

## 7. Integration Point in bridge.ts

Inside `processPreToolUse()`, after all blocking checks and before the final
return, the delegation-enforcer is called:

```typescript
// Enforce model parameter for Task/Agent calls
const delegationResult = enforceDelegationModel(
  input.toolName || '',
  input.toolInput,
);

return {
  continue: true,
  modifiedInput: delegationResult.modifiedInput,
  ...(finalMessage ? { message: finalMessage } : {}),
};
```

The `modifiedInput` is always returned (even when unchanged) so the SDK can
route cleanly.

---

## 8. Test Coverage (T-2.5c)

`src/__tests__/delegation-enforcer-integration.test.ts` covers:

1. Task call without model → model injected (executor → sonnet)
2. Task call with explicit model → model preserved
3. Agent tool name → model injected
4. Non-agent tool (Bash) → unchanged, no `model` field
5. All agent tiers (-low, -medium, -high, -high variants)
6. OMC_DEBUG=false → no console.warn
7. OMC_DEBUG=true → console.warn with model name
