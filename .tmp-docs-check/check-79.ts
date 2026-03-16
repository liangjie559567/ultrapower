import {
  getRegistry,
  initializeRegistry,
  routeCommand,
  getExternalTool,
  listExternalTools,
  hasExternalPlugins,
  hasMcpServers
} from './compatibility';

const registry = getRegistry();

// 注册发现内容和工具
await initializeRegistry({ force: true });

// 访问工具
const allTools = listExternalTools();
const tool = getExternalTool('my-plugin:search');

// 路由命令
const route = routeCommand('search');
if (route) {
  console.log(`Handler: ${route.handler}`);
  console.log(`Requires permission: ${route.requiresPermission}`);
}

// 检查可用内容
if (hasExternalPlugins()) {
  console.log('External plugins available');
}
if (hasMcpServers()) {
  console.log('MCP servers available');
}

// 获取所有插件和服务器
const plugins = registry.getAllPlugins();
const servers = registry.getAllMcpServers();

// 搜索工具
const results = registry.searchTools('filesystem');

// 监听事件
registry.addEventListener(event => {
  if (event.type === 'tool-registered') {
    console.log(`Registered: ${event.data.tool}`);
  }
});
