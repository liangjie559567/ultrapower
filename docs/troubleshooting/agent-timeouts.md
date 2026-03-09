# Agent Timeouts

## Timeout Configuration

Default timeouts by agent type:

* Haiku: 2 minutes

* Sonnet: 5 minutes

* Opus: 10 minutes

## Common Causes

1. **Large codebase analysis**: Agent reading too many files
2. **Complex operations**: Multi-step refactoring
3. **Network issues**: MCP provider delays

## Solutions

### Increase Timeout

Edit `src/agents/timeout-config.ts`:
```typescript
export const AGENT_TIMEOUTS = {
  haiku: 180000,  // 3 min
  sonnet: 600000, // 10 min
  opus: 1200000   // 20 min
};
```

### Break Down Task

* Split large tasks into smaller chunks

* Use incremental approach

* Limit file scope

### Agent Stuck

If agent appears hung:
1. Use `/ultrapower:cancel`
2. Clear `.omc/state/` files
3. Restart with reduced scope
