const allowedTools: string[] = [
  'Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'Task', 'TodoWrite',
  'Bash',  // 如果 config.permissions.allowBash !== false
  'Edit',  // 如果 config.permissions.allowEdit !== false
  'Write', // 如果 config.permissions.allowWrite !== false
  'mcp__*', // 所有 MCP 工具
];
