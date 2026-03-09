# MCP Server Usage Guide

This guide explains how to set up and use the ultrapower MCP server with Claude Desktop and Cursor.

## Quick Start

### Installation

The MCP server is built into ultrapower. To use it, configure your editor to connect to the server.

### Starting the Server

```bash

# Start the MCP server on stdio

node bridge/mcp-server.cjs

# Or with npm

npm run mcp:start
```

The server listens on stdio and exposes 32 custom tools:

* 12 LSP tools (code navigation, diagnostics)

* 2 AST tools (pattern matching)

* 1 Python REPL tool

* 6 Notepad tools (session memory)

* 5 State tools (mode state management)

* 4 Project Memory tools (persistent memory)

* 2 Trace tools (agent flow analysis)

---

## Claude Desktop Configuration

### Setup

1. Open Claude Desktop settings
2. Navigate to **Developer** → **Model Override**
3. Add the MCP server configuration

### Configuration File

Edit `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ultrapower": {
      "command": "node",
      "args": ["/path/to/ultrapower/bridge/mcp-server.cjs"],
      "env": {
        "OMC_LOG_LEVEL": "info"
      }
    }
  }
}
```

### Verify Connection

After configuration, restart Claude Desktop. The MCP server tools should appear in the tool list:

```
mcp__plugin_ultrapower_t__ultrapower:lsp_hover
mcp__plugin_ultrapower_t__ultrapower:lsp_goto_definition
mcp__plugin_ultrapower_t__ultrapower:ast_grep_search
... (64 tools total - each tool has both new and legacy names)
```

**Note:** Legacy names without `ultrapower:` prefix are deprecated but still work:
```
mcp__plugin_ultrapower_t__lsp_hover (deprecated, shows warning)
```

---

## Cursor Configuration

### Setup

1. Open Cursor settings
2. Navigate to **Extensions** → **MCP**
3. Add the server configuration

### Configuration File

Edit `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "ultrapower": {
      "command": "node",
      "args": ["/path/to/ultrapower/bridge/mcp-server.cjs"],
      "env": {
        "OMC_LOG_LEVEL": "info"
      }
    }
  }
}
```

### Verify Connection

Restart Cursor. Check the MCP panel to confirm the server is connected and all 32 tools are available.

---

## Tool Usage Examples

### LSP Tools

Get type information at cursor position:
```
Use mcp__plugin_ultrapower_t__ultrapower:lsp_hover with file and position
```

Find all references to a symbol:
```
Use mcp__plugin_ultrapower_t__ultrapower:lsp_find_references to locate usage
```

### AST Tools

Search for code patterns:
```
Use mcp__plugin_ultrapower_t__ultrapower:ast_grep_search with pattern and language
```

### State Management

Read current mode state:
```
Use mcp__plugin_ultrapower_t__ultrapower:state_read with mode name
```

### Project Memory

Store project-level information:
```
Use mcp__plugin_ultrapower_t__ultrapower:project_memory_write to persist data
```

---

## Troubleshooting

### Server Not Starting

**Error**: `Command not found: node`

**Solution**: Ensure Node.js is installed and in PATH:
```bash
node --version
```

### Tools Not Appearing

**Error**: MCP server connected but no tools visible

**Solution**:
1. Check server logs: `OMC_LOG_LEVEL=debug`
2. Verify configuration file syntax
3. Restart the editor

### Connection Timeout

**Error**: MCP server connection timeout

**Solution**:
1. Verify the server path is correct
2. Check file permissions: `chmod +x bridge/mcp-server.cjs`
3. Try starting server manually to see errors

### Path Issues

**Error**: `E_PATH_OUTSIDE_WORKDIR`

**Solution**: Ensure all file paths are within the project worktree. Use absolute paths when possible.

### Environment Variables

Set these to customize behavior:

| Variable | Values | Default |
| ---------- | -------- | --------- |
| `OMC_LOG_LEVEL` | `debug`, `info`, `warn`, `error` | `info` |
| `OMC_MCP_OUTPUT_PATH_POLICY` | `strict`, `redirect_output` | `strict` |
| `OMC_MCP_OUTPUT_REDIRECT_DIR` | path | `.omc/outputs` |

---

## Advanced Configuration

### Custom Working Directory

```json
{
  "mcpServers": {
    "ultrapower": {
      "command": "node",
      "args": ["/path/to/ultrapower/bridge/mcp-server.cjs"],
      "env": {
        "OMC_LOG_LEVEL": "debug",
        "OMC_WORKDIR": "/custom/path"
      }
    }
  }
}
```

### Output Redirection

Redirect MCP tool outputs to a specific directory:

```json
{
  "env": {
    "OMC_MCP_OUTPUT_PATH_POLICY": "redirect_output",
    "OMC_MCP_OUTPUT_REDIRECT_DIR": ".omc/mcp-outputs"
  }
}
```

---

## Performance Tips

1. **Use LSP tools for large codebases** - They're optimized for fast navigation
2. **Cache state reads** - Avoid repeated `state_read` calls
3. **Batch operations** - Group multiple tool calls when possible
4. **Monitor logs** - Set `OMC_LOG_LEVEL=debug` to identify bottlenecks

---

## Support

For issues or questions:

* Check [REFERENCE.md](../REFERENCE.md) for complete tool documentation

* Review [Troubleshooting Guide](./troubleshooting-guide.md)

* Check server logs with `OMC_LOG_LEVEL=debug`
