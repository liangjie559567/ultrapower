import {
  discoverPlugins,
  discoverMcpServers,
  discoverAll,
  isPluginInstalled,
  getPluginInfo,
  getPluginPaths,
  getMcpConfigPath
} from './compatibility';

// 从自定义路径发现插件
const plugins = discoverPlugins({
  pluginPaths: ['/custom/plugins/path']
});

// 发现 MCP 服务器
const servers = discoverMcpServers({
  mcpConfigPath: '~/.claude/claude_desktop_config.json',
  settingsPath: '~/.claude/settings.json'
});

// 一次性发现所有内容
const result = discoverAll({
  force: true  // 即使已缓存也强制重新发现
});

// 检查插件安装状态
if (isPluginInstalled('my-plugin')) {
  const info = getPluginInfo('my-plugin');
  console.log(`${info.name} v${info.version}`);
}

// 获取已配置的路径
const pluginPaths = getPluginPaths();
const mcpPath = getMcpConfigPath();
