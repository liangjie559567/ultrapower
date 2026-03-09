# @liangjie559567/ultrapower-mcp-server

MCP server for ultrapower - exposes 32 custom tools for Claude Desktop and Cursor.

## Installation

```bash
npm install -g @liangjie559567/ultrapower-mcp-server
```

## Quick Start

### Claude Desktop

Edit `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ultrapower": {
      "command": "npx",
      "args": ["-y", "@liangjie559567/ultrapower-mcp-server"]
    }
  }
}
```

### Cursor

Create `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "ultrapower": {
      "command": "npx",
      "args": ["-y", "@liangjie559567/ultrapower-mcp-server"]
    }
  }
}
```

## Available Tools (32)

* **LSP Tools (12)**: Code navigation, diagnostics, refactoring

* **AST Tools (2)**: Structural pattern matching and replacement

* **Python REPL (1)**: Persistent data analysis environment

* **Notepad Tools (6)**: Session memory management

* **State Tools (5)**: Mode state management

* **Project Memory Tools (4)**: Project-level persistent memory

* **Trace Tools (2)**: Agent flow trace analysis

## Documentation

Full documentation: <https://github.com/liangjie559567/ultrapower>

## License

MIT
