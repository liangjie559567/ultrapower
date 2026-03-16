import {
  initializeCompatibility,
  getRegistry,
  getMcpBridge
} from './compatibility';

// 初始化所有内容
const result = await initializeCompatibility({
  pluginPaths: ['~/.claude/plugins'],
  mcpConfigPath: '~/.claude/claude_desktop_config.json',
  autoConnect: true  // 自动连接到 MCP 服务器
});

console.log(`Plugins: ${result.pluginCount}`);
console.log(`MCP servers: ${result.mcpServerCount}`);
console.log(`Tools: ${result.toolCount}`);
console.log(`Connected: ${result.connectedServers.join(', ')}`);
