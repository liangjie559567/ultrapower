# MCP Configuration

## Environment Variables

### Server Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `OMC_LOG_LEVEL` | Logging verbosity | `info` |
| `OMC_WORKDIR` | Working directory | `process.cwd()` |
| `OMC_MCP_OUTPUT_PATH_POLICY` | Path validation | `strict` |
| `OMC_MCP_OUTPUT_REDIRECT_DIR` | Output directory | `.omc/outputs` |

### Provider API Keys

| Variable | Provider | Required |
|----------|----------|----------|
| `OPENAI_API_KEY` | Codex | Yes |
| `GOOGLE_API_KEY` | Gemini | Yes |

### Logging Levels

- `debug` - All operations, tool calls, responses
- `info` - Server start, tool invocations
- `warn` - Retries, fallbacks
- `error` - Failures only

## Configuration Files

### Claude Desktop

Location: `~/.claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ultrapower": {
      "command": "node",
      "args": ["/absolute/path/to/ultrapower/bridge/mcp-server.cjs"],
      "env": {
        "OMC_LOG_LEVEL": "info"
      }
    },
    "codex": {
      "command": "node",
      "args": ["/absolute/path/to/ultrapower/bridge/codex-server.cjs"],
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "OMC_LOG_LEVEL": "info"
      }
    },
    "gemini": {
      "command": "node",
      "args": ["/absolute/path/to/ultrapower/bridge/gemini-server.cjs"],
      "env": {
        "GOOGLE_API_KEY": "...",
        "OMC_LOG_LEVEL": "info"
      }
    }
  }
}
```

### Cursor

Location: `.cursor/mcp.json` (project root)

```json
{
  "mcpServers": {
    "ultrapower": {
      "command": "node",
      "args": ["./node_modules/@liangjie559567/ultrapower/bridge/mcp-server.cjs"]
    }
  }
}
```

### Claude Code Plugin

Location: `.claude/mcp.json` (workspace)

```json
{
  "mcpServers": {
    "ultrapower": {
      "command": "node",
      "args": ["bridge/mcp-server.cjs"],
      "disabled": false,
      "autoApprove": [
        "lsp_hover",
        "state_read",
        "notepad_read"
      ]
    }
  }
}
```

## Path Policies

### Strict Mode (Default)

All file operations must be within workdir:

```json
{
  "env": {
    "OMC_MCP_OUTPUT_PATH_POLICY": "strict"
  }
}
```

Throws `E_PATH_OUTSIDE_WORKDIR` for violations.

### Redirect Mode

Outputs redirected to safe directory:

```json
{
  "env": {
    "OMC_MCP_OUTPUT_PATH_POLICY": "redirect_output",
    "OMC_MCP_OUTPUT_REDIRECT_DIR": ".omc/mcp-outputs"
  }
}
```

## Timeout Configuration

### Per-Tool Timeouts

Edit `src/mcp/timeout.ts`:

```typescript
export const TOOL_TIMEOUTS: Record<string, number> = {
  lsp_hover: 30000,
  lsp_diagnostics: 60000,
  ast_grep_search: 60000,
  ask_codex: 300000,
  ask_gemini: 300000
};
```

### Global Timeout

```typescript
const DEFAULT_TIMEOUT = 120000; // 2 minutes
```

## Auto-Approval

Skip permission prompts for trusted tools:

```json
{
  "mcpServers": {
    "ultrapower": {
      "autoApprove": [
        "lsp_hover",
        "lsp_goto_definition",
        "state_read",
        "notepad_read",
        "project_memory_read"
      ]
    }
  }
}
```

## Disabling Servers

Temporarily disable without removing config:

```json
{
  "mcpServers": {
    "codex": {
      "disabled": true
    }
  }
}
```

## Multi-Workspace Setup

### User-Level Config

`~/.claude/mcp.json` - applies to all workspaces:

```json
{
  "mcpServers": {
    "ultrapower": {
      "command": "node",
      "args": ["/global/path/to/bridge/mcp-server.cjs"]
    }
  }
}
```

### Workspace-Level Config

`.claude/mcp.json` - overrides user config:

```json
{
  "mcpServers": {
    "ultrapower": {
      "command": "node",
      "args": ["./local/bridge/mcp-server.cjs"]
    }
  }
}
```

Precedence: `workspace > user`

## Security Configuration

### Path Validation

```typescript
// Enforce workdir boundary
const workdir = process.env.OMC_WORKDIR || process.cwd();

function validatePath(path: string): void {
  const absolute = resolve(workdir, path);
  if (!absolute.startsWith(workdir)) {
    throw new Error('E_PATH_OUTSIDE_WORKDIR');
  }
}
```

### Input Sanitization

```typescript
// Whitelist known fields
const ALLOWED_FIELDS = ['task', 'agent_role', 'context_files', 'model'];

function sanitizeInput(input: any): any {
  return Object.fromEntries(
    Object.entries(input).filter(([key]) => ALLOWED_FIELDS.includes(key))
  );
}
```

## Troubleshooting

### Server Not Starting

```bash
# Check Node.js version
node --version  # Should be >= 20.0.0

# Test server manually
node bridge/mcp-server.cjs
```

### API Key Issues

```bash
# Verify key is set
echo $OPENAI_API_KEY

# Test key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Path Errors

```bash
# Use absolute paths
"args": ["/Users/me/projects/ultrapower/bridge/mcp-server.cjs"]

# Or relative to home
"args": ["~/projects/ultrapower/bridge/mcp-server.cjs"]
```

### Permission Denied

```bash
# Make executable
chmod +x bridge/mcp-server.cjs
```

## Next Steps

- [Performance](./performance.md) - Benchmarks and optimization
- [Server Guide](./server-guide.md) - Build custom servers
- [Client Guide](./client-guide.md) - Use tools in agents
