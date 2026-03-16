import {
  getMcpBridge,
  resetMcpBridge,
  invokeMcpTool,
  readMcpResource
} from './compatibility';

const bridge = getMcpBridge();

// 连接到服务器
const tools = await bridge.connect('filesystem');

// 调用工具
const result = await invokeMcpTool('filesystem', 'read_file', {
  path: '/etc/hosts'
});

// 读取资源
const resourceResult = await readMcpResource('web', '<https://api.example.com>');

// 检查连接
const status = bridge.getConnectionStatus();

// 清理
bridge.disconnectAll();
resetMcpBridge();
