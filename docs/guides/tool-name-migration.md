# Tool Name Migration Guide

## Overview

Starting from v5.6.0, all ultrapower tools use the `ultrapower:` prefix instead of underscore naming.

**Legacy format:** `tool_name`
**New format:** `ultrapower:tool_name`

## Migration Timeline

* **v5.6.0**: New prefix introduced, legacy names deprecated

* **v6.0.0**: Legacy names will be removed

## Affected Tools

### LSP Tools

* `ultrapower:lsp_hover` → `ultrapower:lsp_hover`

* `ultrapower:lsp_goto_definition` → `ultrapower:lsp_goto_definition`

* `ultrapower:lsp_find_references` → `ultrapower:lsp_find_references`

* `ultrapower:lsp_document_symbols` → `ultrapower:lsp_document_symbols`

* `ultrapower:lsp_workspace_symbols` → `ultrapower:lsp_workspace_symbols`

* `ultrapower:lsp_diagnostics` → `ultrapower:lsp_diagnostics`

* `ultrapower:lsp_diagnostics_directory` → `ultrapower:lsp_diagnostics_directory`

* `ultrapower:lsp_servers` → `ultrapower:lsp_servers`

* `ultrapower:lsp_prepare_rename` → `ultrapower:lsp_prepare_rename`

* `ultrapower:lsp_rename` → `ultrapower:lsp_rename`

* `ultrapower:lsp_code_actions` → `ultrapower:lsp_code_actions`

* `ultrapower:lsp_code_action_resolve` → `ultrapower:lsp_code_action_resolve`

### State Tools

* `state_read` → `ultrapower:state_read`

* `state_write` → `ultrapower:state_write`

* `state_clear` → `ultrapower:state_clear`

* `state_list_active` → `ultrapower:state_list_active`

* `state_get_status` → `ultrapower:state_get_status`

### Notepad Tools

* `notepad_read` → `ultrapower:notepad_read`

* `notepad_write_priority` → `ultrapower:notepad_write_priority`

* `notepad_write_working` → `ultrapower:notepad_write_working`

* `notepad_write_manual` → `ultrapower:notepad_write_manual`

* `notepad_prune` → `ultrapower:notepad_prune`

* `notepad_stats` → `ultrapower:notepad_stats`

### Memory Tools

* `project_memory_read` → `ultrapower:project_memory_read`

* `project_memory_write` → `ultrapower:project_memory_write`

* `project_memory_add_note` → `ultrapower:project_memory_add_note`

* `project_memory_add_directive` → `ultrapower:project_memory_add_directive`

### AST Tools

* `ast_grep_search` → `ultrapower:ast_grep_search`

* `ast_grep_replace` → `ultrapower:ast_grep_replace`

### Other Tools

* `python_repl` → `ultrapower:python_repl`

* `trace_timeline` → `ultrapower:trace_timeline`

* `trace_summary` → `ultrapower:trace_summary`

## Automated Migration

Use the migration script to update your codebase:

```bash
node scripts/migrate-tool-names.js [directory]
```

This will update tool references in `.ts`, `.js`, `.json`, and `.md` files.

## Manual Migration

If you prefer manual migration, search for tool names and replace them:

```typescript
// Before
await client.callTool('state_read', { mode: 'team' });

// After
await client.callTool('ultrapower:state_read', { mode: 'team' });
```

## Backward Compatibility

Legacy names still work in v5.6.x but will show deprecation warnings:

```
⚠️  DEPRECATED: Tool 'state_read' is deprecated since v5.6.0
and will be removed in v6.0.0.
Please use 'ultrapower:state_read' instead.
```

## Why This Change?

1. **Namespace clarity**: Prevents conflicts with other MCP servers
2. **Consistency**: Aligns with MCP naming conventions
3. **Discoverability**: Makes ultrapower tools easily identifiable
