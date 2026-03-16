# MCP Client Guide

## Using MCP Tools in Agents

### Tool Discovery

Before using MCP tools, discover them with `ToolSearch`:

```typescript
// Discover all MCP tools
await ToolSearch("mcp");

// Discover specific server
await ToolSearch("ask_codex");
```

### Direct Tool Invocation

```typescript
// LSP hover
const hover = await mcp__plugin_ultrapower_t__ultrapower:lsp_hover({
  file: 'src/index.ts',
  line: 10,
  character: 5
});

// AST search
const matches = await mcp__plugin_ultrapower_t__ast_grep_search({
  pattern: 'function $NAME($$$ARGS) { $$$ }',
  language: 'typescript',
  paths: ['src/']
});

// State read
const state = await mcp__plugin_ultrapower_t__state_read({
  mode: 'team'
});
```

### Agent Delegation

Delegate analysis to external AI:

```typescript
// Codex for architecture review
const review = await mcp__x__ask_codex({
  task: 'Review this API design for scalability',
  agent_role: 'architect',
  context_files: ['src/api/routes.ts', 'src/api/handlers.ts'],
  model: 'gpt-5.3-codex'
});

// Gemini for UI design
const design = await mcp__g__ask_gemini({
  task: 'Analyze component hierarchy and suggest improvements',
  agent_role: 'designer',
  context_files: ['src/components/']
});
```

### Background Jobs

For long-running tasks:

```typescript
// Start background job
const job = await mcp__x__ask_codex({
  task: 'Comprehensive security audit',
  agent_role: 'security-reviewer',
  context_files: ['src/'],
  background: true
});

// Check status
const status = await mcp__x__check_job_status({
  job_id: job.job_id
});

// Wait for completion (blocks up to 1 hour)
const result = await mcp__x__wait_for_job({
  job_id: job.job_id,
  timeout: 3600000
});
```

## Agent Role Routing

### Available Roles

Any ultrapower agent role works with MCP providers:

**Codex-optimized**:

* `architect` - System design

* `planner` - Task breakdown

* `critic` - Challenge assumptions

* `code-reviewer` - Code quality

* `security-reviewer` - Vulnerability scan

**Gemini-optimized**:

* `designer` - UI/UX

* `writer` - Documentation

* `vision` - Visual analysis

### Role Selection

```typescript
// Architecture decisions → Codex
await mcp__x__ask_codex({
  task: 'Evaluate microservices vs monolith',
  agent_role: 'architect'
});

// UI patterns → Gemini
await mcp__g__ask_gemini({
  task: 'Review component accessibility',
  agent_role: 'designer'
});
```

## Context Management

### File Context

Always provide relevant files:

```typescript
await mcp__x__ask_codex({
  task: 'Review error handling',
  agent_role: 'code-reviewer',
  context_files: [
    'src/errors/index.ts',
    'src/middleware/error-handler.ts',
    'src/api/routes.ts'
  ]
});
```

### Directory Context

Use glob patterns:

```typescript
context_files: ['src/**/*.ts', 'tests/**/*.test.ts']
```

### Large Context

Gemini handles 1M tokens:

```typescript
await mcp__g__ask_gemini({
  task: 'Analyze entire codebase structure',
  agent_role: 'architect',
  context_files: ['src/', 'tests/', 'docs/']
});
```

## Error Handling

### Retry on Failure

```typescript
async function callWithRetry(fn: () => Promise<any>, maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      await sleep(1000 * Math.pow(2, i));
    }
  }
}

const result = await callWithRetry(() =>
  mcp__x__ask_codex({ task: '...', agent_role: 'planner' })
);
```

### Fallback to Claude Agent

```typescript
let result;
try {
  result = await mcp__x__ask_codex({
    task: 'Review code',
    agent_role: 'code-reviewer'
  });
} catch (error) {
  // Fallback to native agent
  result = await Task({
    subagent_type: 'ultrapower:code-reviewer',
    prompt: 'Review code',
    model: 'opus'
  });
}
```

## Best Practices

### 1. Use MCP for Read-Only Analysis

MCP tools cannot modify files. Use for:

* Code review

* Architecture analysis

* Planning validation

* Documentation generation

### 2. Use Claude Agents for Implementation

Agents have tool access. Use for:

* Code changes

* File operations

* Test execution

* Build verification

### 3. Provide Sufficient Context

```typescript
// Bad - no context
await mcp__x__ask_codex({
  task: 'Review authentication',
  agent_role: 'security-reviewer'
});

// Good - relevant files
await mcp__x__ask_codex({
  task: 'Review authentication',
  agent_role: 'security-reviewer',
  context_files: [
    'src/auth/login.ts',
    'src/auth/session.ts',
    'src/middleware/auth.ts'
  ]
});
```

### 4. Choose Right Provider

```typescript
// Codex for technical analysis
await mcp__x__ask_codex({
  task: 'Identify performance bottlenecks',
  agent_role: 'performance-reviewer'
});

// Gemini for design/docs
await mcp__g__ask_gemini({
  task: 'Improve README structure',
  agent_role: 'writer'
});
```

### 5. Monitor Job Status

```typescript
const job = await mcp__x__ask_codex({
  task: 'Large analysis',
  background: true
});

// Poll every 5s
while (true) {
  const status = await mcp__x__check_job_status({ job_id: job.job_id });
  if (status.status === 'completed') break;
  if (status.status === 'failed') throw new Error(status.error);
  await sleep(5000);
}
```

## Integration Patterns

### Parallel Analysis

```typescript
const [codexReview, geminiDesign] = await Promise.all([
  mcp__x__ask_codex({
    task: 'Security review',
    agent_role: 'security-reviewer',
    context_files: ['src/']
  }),
  mcp__g__ask_gemini({
    task: 'UI consistency check',
    agent_role: 'designer',
    context_files: ['src/components/']
  })
]);
```

### Sequential Pipeline

```typescript
// 1. Plan with Codex
const plan = await mcp__x__ask_codex({
  task: 'Create implementation plan',
  agent_role: 'planner'
});

// 2. Implement with Claude agent
await Task({
  subagent_type: 'ultrapower:executor',
  prompt: `Implement: ${plan.content}`
});

// 3. Review with Codex
await mcp__x__ask_codex({
  task: 'Review implementation',
  agent_role: 'code-reviewer',
  context_files: ['src/new-feature.ts']
});
```

### Consensus Building

```typescript
const reviews = await Promise.all([
  mcp__x__ask_codex({
    task: 'Review design',
    agent_role: 'architect'
  }),
  mcp__x__ask_codex({
    task: 'Challenge design',
    agent_role: 'critic'
  }),
  Task({
    subagent_type: 'ultrapower:analyst',
    prompt: 'Analyze requirements'
  })
]);

// Synthesize consensus
```

## Next Steps

* [Configuration](./configuration.md) - Environment setup

* [Performance](./performance.md) - Optimization tips

* [Server Guide](./server-guide.md) - Build custom servers
