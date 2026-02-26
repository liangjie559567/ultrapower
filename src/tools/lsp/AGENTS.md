<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-28 | Updated: 2026-01-28 -->

# lsp

语言服务器协议（LSP）客户端实现，提供类 IDE 的代码智能能力。

## 用途

此目录实现了 LSP 客户端，使 agent 能够：
- 连接到语言服务器（TypeScript、Python、Rust、Go 等）
- 获取类型信息、文档和签名
- 查找定义、引用和符号
- 执行重构操作（重命名、代码操作）
- 收集诊断（错误、警告）

## 关键文件

| 文件 | 描述 |
|------|------|
| `index.ts` | 模块导出 - 重新导出客户端、服务器、工具函数 |
| `client.ts` | `LspClient` 类 - 通过 stdio 的 JSON-RPC 2.0 通信 |
| `servers.ts` | `LSP_SERVERS` 配置 - 10 个语言服务器定义 |
| `utils.ts` | LSP 响应的格式化工具函数 |

## 面向 AI Agent

### 在此目录中工作

#### LSP 客户端架构

```
┌─────────────────┐     JSON-RPC 2.0      ┌──────────────────┐
│   LspClient     │◄────────────────────►│ Language Server  │
│                 │       stdio           │ (tsserver, etc.) │
│ - connect()     │                       │                  │
│ - hover()       │                       │                  │
│ - definition()  │                       │                  │
│ - references()  │                       │                  │
│ - diagnostics() │                       │                  │
└─────────────────┘                       └──────────────────┘
```

#### 客户端管理器

`lspClientManager` 是一个池化连接的单例：

```typescript
// 获取文件对应的客户端（自动选择合适的服务器）
const client = await lspClientManager.getClientForFile('src/index.ts');

// 相同工作区/服务器组合复用客户端
const key = `${workspaceRoot}:${serverConfig.command}`;
```

#### 服务器配置

`LSP_SERVERS` 中每个服务器包含：
```typescript
interface LspServerConfig {
  name: string;           // 人类可读名称
  command: string;        // 可执行命令
  args: string[];         // 命令参数
  extensions: string[];   // 处理的文件扩展名
  installHint: string;    // 安装说明
}
```

### 常见模式

**请求/响应：**
```typescript
// 所有请求使用 JSON-RPC 2.0 格式
const request = {
  jsonrpc: '2.0',
  id: this.requestId++,
  method: 'textDocument/hover',
  params: { textDocument: { uri }, position: { line, character } }
};

// 包装在 Content-Length 头中
const message = `Content-Length: ${content.length}\r\n\r\n${content}`;
```

**通知处理：**
```typescript
// 服务器通过通知推送诊断
if (notification.method === 'textDocument/publishDiagnostics') {
  this.diagnostics.set(params.uri, params.diagnostics);
}
```

### 测试要求

LSP 测试需要安装语言服务器：
```bash
# 安装 TypeScript 服务器
npm i -g typescript-language-server typescript

# 运行测试
npm test -- --grep "lsp"
```

## 依赖

### 内部
- 无

### 外部
| 包 | 用途 |
|----|------|
| `vscode-languageserver-protocol` | LSP 类型定义 |
| `child_process` | 生成语言服务器进程 |
| `fs`, `path` | 文件操作 |

## 支持的语言服务器

| 语言 | 服务器 | 命令 | 扩展名 |
|------|--------|------|--------|
| TypeScript/JS | typescript-language-server | `typescript-language-server` | .ts, .tsx, .js, .jsx |
| Python | pylsp | `pylsp` | .py, .pyw |
| Rust | rust-analyzer | `rust-analyzer` | .rs |
| Go | gopls | `gopls` | .go |
| C/C++ | clangd | `clangd` | .c, .h, .cpp, .cc, .hpp |
| Java | jdtls | `jdtls` | .java |
| JSON | vscode-json-language-server | `vscode-json-language-server` | .json, .jsonc |
| HTML | vscode-html-language-server | `vscode-html-language-server` | .html, .htm |
| CSS | vscode-css-language-server | `vscode-css-language-server` | .css, .scss, .less |
| YAML | yaml-language-server | `yaml-language-server` | .yaml, .yml |

<!-- MANUAL: -->
