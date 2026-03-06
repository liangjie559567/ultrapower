# MCP Ecosystem Documentation

ultrapower provides comprehensive MCP (Model Context Protocol) integration for extending Claude Code with custom tools and external AI providers.

## Documentation Structure

- [Overview](./overview.md) - MCP architecture and capabilities
- [Server Guide](./server-guide.md) - Creating and deploying MCP servers
- [Client Guide](./client-guide.md) - Consuming MCP tools in agents
- [Configuration](./configuration.md) - Setup and environment variables
- [Performance](./performance.md) - Benchmarks and optimization

## Quick Links

- [MCP Server Usage](../guides/mcp-server-usage.md) - Getting started
- [Tool Reference](../REFERENCE.md) - Complete tool catalog
- [Troubleshooting](../guides/troubleshooting-guide.md) - Common issues

## MCP Servers in ultrapower

### Built-in Servers

1. **OMC Tools Server** (`bridge/mcp-server.cjs`)
   - 32 custom tools (LSP, AST, State, Memory, Trace)
   - Stdio transport
   - Path security enforcement

2. **Codex Server** (`bridge/codex-server.cjs`)
   - OpenAI GPT-5.3-Codex integration
   - Agent role routing
   - Background job management

3. **Gemini Server** (`bridge/gemini-server.cjs`)
   - Google Gemini 3 Pro integration
   - 1M context window
   - Multi-file design support

### External Servers

ultrapower integrates with community MCP servers:
- `sequential-thinking` - Structured reasoning
- `software-planning-tool` - Task decomposition
- `context7` - Documentation lookup

## Key Features

- **Tool Namespacing** - Automatic `mcp__<server>__<tool>` prefixing
- **Security** - Path traversal protection, input sanitization
- **Retry Logic** - Exponential backoff for transient failures
- **Timeout Management** - Configurable per-tool timeouts
- **Job Management** - Background execution with status tracking

## Architecture

```
┌─────────────────┐
│  Claude Code    │
└────────┬────────┘
         │
    ┌────▼─────┐
    │   MCP    │
    │  Client  │
    └────┬─────┘
         │
    ┌────▼──────────────────────┐
    │  MCP Servers (stdio)      │
    ├───────────────────────────┤
    │ • OMC Tools               │
    │ • Codex (OpenAI)          │
    │ • Gemini (Google)         │
    │ • Community Servers       │
    └───────────────────────────┘
```

## Getting Started

1. Install ultrapower: `/plugin install omc@ultrapower`
2. Configure MCP servers in `.claude/mcp.json`
3. Use tools via `mcp__<server>__<tool>` naming
4. Monitor with `OMC_LOG_LEVEL=debug`

See [Server Guide](./server-guide.md) for detailed setup instructions.
