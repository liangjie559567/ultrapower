# MCP Overview

## What is MCP?

Model Context Protocol (MCP) is an open standard for connecting AI assistants to external tools and data sources. ultrapower implements MCP to:

* Expose custom tools (LSP, AST, State, Memory)

* Integrate external AI providers (Codex, Gemini)

* Connect to community servers (sequential-thinking, context7)

## Architecture

### Transport Layer

ultrapower uses **stdio transport** for all MCP servers:

* Server reads JSON-RPC from stdin

* Server writes responses to stdout

* Errors logged to stderr

### Tool Discovery

1. Client connects to server via stdio
2. Client sends `tools/list` request
3. Server responds with tool catalog
4. Client invokes tools via `tools/call`

### Namespacing

Tools are prefixed to avoid conflicts:
```
mcp__<server_name>__<tool_name>
```

Examples:

* `mcp__plugin_ultrapower_t__lsp_hover`

* `mcp__x__ask_codex`

* `mcp__context7__query_docs`

## Built-in Servers

### 1. OMC Tools Server

**Purpose**: Expose ultrapower's code intelligence and state management

**Tools** (32 total):

* LSP: hover, definition, references, symbols, diagnostics, rename, code actions

* AST: search, replace

* Python: REPL

* Notepad: read, write (priority/working/manual), prune, stats

* State: read, write, clear, list, status

* Memory: read, write, add note, add directive

* Trace: summary, timeline

**Configuration**:
```json
{
  "mcpServers": {
    "ultrapower": {
      "command": "node",
      "args": ["bridge/mcp-server.cjs"]
    }
  }
}
```

### 2. Codex Server

**Purpose**: Delegate to OpenAI GPT-5.3-Codex for analysis

**Tools**:

* `ask_codex` - Send task with agent role

* `check_job_status` - Poll background jobs

* `wait_for_job` - Block until completion

* `kill_job` - Cancel running job

* `list_jobs` - Show all jobs

**Best for**: Architecture review, planning, code review, security audit

**Configuration**:
```json
{
  "mcpServers": {
    "codex": {
      "command": "node",
      "args": ["bridge/codex-server.cjs"],
      "env": {
        "OPENAI_API_KEY": "sk-..."
      }
    }
  }
}
```

### 3. Gemini Server

**Purpose**: Delegate to Google Gemini 3 Pro (1M context)

**Tools**: Same as Codex (ask_gemini, job management)

**Best for**: UI/UX design, documentation, large context tasks

**Configuration**:
```json
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": ["bridge/gemini-server.cjs"],
      "env": {
        "GOOGLE_API_KEY": "..."
      }
    }
  }
}
```

## Security

### Path Traversal Protection

All file operations validate paths:
```typescript
if (!absolutePath.startsWith(workdir)) {
  throw new Error('E_PATH_OUTSIDE_WORKDIR');
}
```

### Input Sanitization

Hook inputs filtered through whitelist:

* Known fields passed through

* Unknown fields dropped

* Prevents injection attacks

### Mode Validation

State operations validate mode names:
```typescript
const validModes = ['autopilot', 'team', 'ralph', ...];
assertValidMode(mode);
```

## Performance

### Retry Logic

Transient failures auto-retry with exponential backoff:

* Max 3 attempts

* Delays: 1s, 2s, 4s

* Only for network/timeout errors

### Timeout Management

Per-tool timeouts prevent hangs:

* LSP tools: 30s

* AST tools: 60s

* AI providers: 300s (5min)

### Connection Pooling

LSP servers reuse connections:

* One server per language

* Persistent across tool calls

* Auto-restart on crash

## Integration Patterns

### Direct Tool Call

```typescript
const result = await mcp__plugin_ultrapower_t__lsp_hover({
  file: 'src/index.ts',
  line: 10,
  character: 5
});
```

### Agent Delegation

```typescript
const result = await mcp__x__ask_codex({
  task: 'Review this API design',
  agent_role: 'architect',
  context_files: ['src/api.ts']
});
```

### Background Jobs

```typescript
const job = await mcp__g__ask_gemini({
  task: 'Analyze UI patterns',
  agent_role: 'designer',
  background: true
});

await mcp__g__wait_for_job({ job_id: job.job_id });
```

## Next Steps

* [Server Guide](./server-guide.md) - Build custom servers

* [Client Guide](./client-guide.md) - Consume tools in agents

* [Configuration](./configuration.md) - Environment setup
