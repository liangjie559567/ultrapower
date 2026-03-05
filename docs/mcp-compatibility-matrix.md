# MCP Server Compatibility Matrix

## Namespace Format

All community MCP server tools use the format: `mcp__servername__toolname`

## Supported Community Servers

### Filesystem Server
- **Package**: `@modelcontextprotocol/server-filesystem`
- **Namespace**: `mcp__filesystem__*`
- **Tools**:
  - `mcp__filesystem__read_file`
  - `mcp__filesystem__write_file`
  - `mcp__filesystem__list_directory`
  - `mcp__filesystem__create_directory`
  - `mcp__filesystem__move_file`
  - `mcp__filesystem__get_file_info`

### GitHub Server
- **Package**: `@modelcontextprotocol/server-github`
- **Namespace**: `mcp__github__*`
- **Tools**:
  - `mcp__github__create_issue`
  - `mcp__github__create_pull_request`
  - `mcp__github__search_repositories`
  - `mcp__github__get_file_contents`

### Slack Server
- **Package**: `@modelcontextprotocol/server-slack`
- **Namespace**: `mcp__slack__*`
- **Tools**:
  - `mcp__slack__send_message`
  - `mcp__slack__list_channels`
  - `mcp__slack__read_channel`

## Internal Tools (No Namespace)

Internal OMC tools do not use namespace prefixes:
- `lsp_*` - Language Server Protocol tools
- `ast_grep_*` - AST manipulation tools
- `state_*` - State management tools
- `notepad_*` - Notepad tools
- `project_memory_*` - Memory tools
- `python_repl` - Python REPL
- `trace_*` - Trace tools

## Backward Compatibility

The resolver supports both formats:
- Namespaced: `mcp__filesystem__read_file` → resolves to tool
- Plain: `read_file` → resolves to internal tool
