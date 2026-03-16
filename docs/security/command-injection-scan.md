# 命令注入扫描报告

## 扫描摘要
- 发现命令执行点: 37
- Windows 风险点: 6
- 安全使用点: 31

## Windows 平台风险点

### 1. src/mcp/codex-core.ts:230
```typescript
const child = spawn(codexCmd, args, {
  stdio: ['pipe', 'pipe', 'pipe'],
  ...(cwd ? { cwd } : {}),
  shell: process.platform === 'win32',
  env: getSpawnEnv()
});
```
**风险**: Windows 平台启用 shell，可能导致命令注入
**平台**: Windows
**修复建议**:
- 验证 `codexCmd` 来源（通过 `getCliCommand('codex')` 获取）
- 确保 `args` 数组元素已消毒
- 考虑使用 `execFile` 或禁用 shell

### 2. src/mcp/gemini-core.ts:114
```typescript
const child = spawn(getCliCommand('gemini'), args, {
  stdio: ['pipe', 'pipe', 'pipe'],
  ...(cwd ? { cwd } : {}),
  shell: process.platform === 'win32',
  env: getSpawnEnv()
});
```
**风险**: Windows 平台启用 shell，可能导致命令注入
**平台**: Windows
**修复建议**:
- 验证 `getCliCommand('gemini')` 返回值
- 确保 `args` 数组元素已消毒
- 考虑使用 `execFile` 或禁用 shell

### 3. src/mcp/gemini-core.ts:217
```typescript
const child = spawn(getCliCommand('gemini'), args, {
  stdio: ['pipe', 'pipe', 'pipe'],
  ...(cwd ? { cwd } : {}),
  shell: process.platform === 'win32',
  env: getSpawnEnv()
});
```
**风险**: Windows 平台启用 shell（后台模式）
**平台**: Windows
**修复建议**: 同上

### 4. src/mcp/codex-core.ts:408
```typescript
const child = spawn(getCliCommand('codex'), args, {
  stdio: ['pipe', 'pipe', 'pipe'],
  ...(cwd ? { cwd } : {}),
  shell: process.platform === 'win32',
  env: getSpawnEnv()
});
```
**风险**: Windows 平台启用 shell（后台模式）
**平台**: Windows
**修复建议**: 同上

### 5. src/tools/lsp/client.ts:202
```typescript
this.process = spawn(this.serverConfig.command, this.serverConfig.args, {
  cwd: this.workspaceRoot,
  stdio: ['pipe', 'pipe', 'pipe'],
  // On Windows, npm-installed binaries are .cmd scripts that require
  // shell execution. Without this, spawn() fails with ENOENT. (#569)
  shell: process.platform === 'win32'
});
```
**风险**: Windows 平台启用 shell 以支持 .cmd 脚本
**平台**: Windows
**修复建议**:
- 验证 `this.serverConfig.command` 和 `this.serverConfig.args` 来源
- 实施白名单验证 LSP 服务器命令
- 考虑使用 `execFile` 或路径规范化

### 6. src/compatibility/mcp-bridge.ts:178
```typescript
const child = spawn(config.command, config.args || [], {
  env: safeEnv,
  stdio: ['pipe', 'pipe', 'pipe'],
});
```
**风险**: 未显式禁用 shell，在某些平台可能启用
**平台**: 跨平台
**修复建议**:
- 显式设置 `shell: false`
- 验证 `config.command` 和 `config.args` 来源
- 实施 MCP 配置白名单

## 安全使用点（参数数组形式）

以下使用点使用参数数组且未启用 shell，相对安全：

1. **测试文件** (11 个)
   - tests/security/penetration.test.ts:10
   - tests/hooks/bridge-input-validation.test.ts:10
   - tests/security/fuzzing.test.ts:10
   - tests/integration/input-validation.test.ts:10
   - tests/integration/hook-input-security.test.ts:10
   - tests/brainstorm-server/server.test.js:33
   - src/notifications/__tests__/session-registry.test.ts:42
   - scripts/test-remember-tags.ts:16
   - src/hooks/persistent-mode/__tests__/error-handling.test.ts:51

2. **工具链** (5 个)
   - benchmarks/run.ts:12 - `spawn('tsx', [script])`
   - src/features/assumption-validator/lsp-checker.ts:10 - `spawn('npx', ['tsc', '--noEmit', filePath])`
   - src/cli/utils/tokscale-launcher.ts:13 - `spawn('bunx', ['tokscale@latest', '--version'])`
   - src/cli/utils/tokscale-launcher.ts:49 - `spawn('bunx', args)`

3. **内部服务** (4 个)
   - src/tools/python-repl/bridge-manager.ts:322 - Python REPL 桥接
   - src/team/mcp-team-bridge.ts:355 - MCP 团队桥接
   - src/notifications/reply-listener.ts:854 - 守护进程启动
   - src/features/rate-limit-wait/daemon.ts:466 - 速率限制守护进程

## 修复优先级

### P0 - 立即修复
1. **src/mcp/codex-core.ts:230, 408** - Codex CLI 调用
2. **src/mcp/gemini-core.ts:114, 217** - Gemini CLI 调用
3. **src/tools/lsp/client.ts:202** - LSP 客户端启动

### P1 - 高优先级
4. **src/compatibility/mcp-bridge.ts:178** - MCP 桥接

## 修复建议

### 通用修复模式

```typescript
// 不安全 (Windows 启用 shell)
spawn(command, args, { shell: process.platform === 'win32' });

// 安全方案 1: 使用 execFile
import { execFile } from 'child_process';
execFile(command, args, options, callback);

// 安全方案 2: 显式禁用 shell + 路径验证
import { resolve } from 'path';
const safePath = resolve(command); // 规范化路径
spawn(safePath, args, { shell: false });

// 安全方案 3: 白名单验证
const ALLOWED_COMMANDS = ['codex', 'gemini', 'typescript-language-server'];
if (!ALLOWED_COMMANDS.includes(basename(command))) {
  throw new Error('Unauthorized command');
}
```

### 针对性修复

#### 1. MCP CLI 工具 (codex/gemini)
```typescript
// 添加命令白名单验证
function getCliCommand(tool: 'codex' | 'gemini'): string {
  const cmd = tool === 'codex' ? 'codex' : 'gemini';
  // 验证命令存在且安全
  return cmd;
}

// 参数消毒
function sanitizeArgs(args: string[]): string[] {
  return args.map(arg => {
    // 移除危险字符
    if (arg.includes(';') || arg.includes('&') || arg.includes('|')) {
      throw new Error('Invalid argument');
    }
    return arg;
  });
}
```

#### 2. LSP 客户端
```typescript
// 实施 LSP 服务器白名单
const ALLOWED_LSP_SERVERS = [
  'typescript-language-server',
  'vscode-json-languageserver',
  'pyright'
];

function validateLspCommand(command: string): void {
  const basename = path.basename(command, '.cmd');
  if (!ALLOWED_LSP_SERVERS.includes(basename)) {
    throw new Error(`Unauthorized LSP server: ${command}`);
  }
}
```

#### 3. MCP 桥接
```typescript
// 显式禁用 shell
const child = spawn(config.command, config.args || [], {
  env: safeEnv,
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: false // 显式禁用
});
```

## 验证清单

- [ ] 所有 Windows 风险点已修复
- [ ] 实施命令白名单验证
- [ ] 参数消毒机制就位
- [ ] 添加单元测试覆盖命令注入场景
- [ ] 更新安全文档
- [ ] 代码审查通过

## 参考资料

- [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [Node.js child_process Security](https://nodejs.org/api/child_process.html#child_process_spawning_bat_and_cmd_files_on_windows)
- CWE-78: OS Command Injection
