<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-28 | Updated: 2026-01-31 -->

# tools

通过语言服务器协议（LSP）、抽象语法树（AST）工具和 Python REPL，为 AI agent 提供类 IDE 能力。

## 用途

此目录为 agent 提供强大的代码智能工具：
- **LSP 工具（12 个）**：悬停信息、跳转定义、查找引用、诊断、重命名、代码操作
- **AST 工具（2 个）**：通过 ast-grep 进行结构化代码搜索和转换
- **Python REPL（1 个）**：用于数据分析的交互式 Python 执行

这些工具使 agent 能够在语义层面理解和操作代码，远超文本搜索的能力。

## 关键文件

| 文件 | 描述 |
|------|------|
| `index.ts` | 工具注册表 - 导出 `allCustomTools`、`lspTools`、`astTools` |
| `lsp-tools.ts` | 12 个 LSP 工具定义（hover、definition、references 等） |
| `ast-tools.ts` | 2 个用于模式搜索和替换的 AST 工具 |

## 子目录

| 目录 | 用途 |
|------|------|
| `lsp/` | LSP 客户端、服务器配置、工具函数（见 `lsp/AGENTS.md`） |
| `diagnostics/` | 目录级诊断（tsc/LSP）（见 `diagnostics/AGENTS.md`） |
| `python-repl/` | 用于数据分析的 Python REPL 工具 |

## 面向 AI Agent

### 在此目录中工作

#### LSP 工具用法

**基本代码智能：**
```typescript
// 获取位置处的类型信息
lsp_hover({ file: "src/index.ts", line: 10, character: 15 })

// 跳转到定义
lsp_goto_definition({ file: "src/index.ts", line: 10, character: 15 })

// 查找所有用法
lsp_find_references({ file: "src/index.ts", line: 10, character: 15 })
```

**文件/项目分析：**
```typescript
// 获取文件大纲（所有符号）
lsp_document_symbols({ file: "src/index.ts" })

// 跨工作区搜索符号
lsp_workspace_symbols({ query: "createSession", file: "src/index.ts" })

// 单文件诊断
lsp_diagnostics({ file: "src/index.ts", severity: "error" })

// 全项目类型检查（推荐）
lsp_diagnostics_directory({ directory: ".", strategy: "auto" })
```

**重构支持：**
```typescript
// 检查重命名是否有效
lsp_prepare_rename({ file: "src/index.ts", line: 10, character: 15 })

// 预览重命名（不应用更改）
lsp_rename({ file: "src/index.ts", line: 10, character: 15, newName: "newFunction" })

// 获取可用代码操作
lsp_code_actions({ file: "src/index.ts", startLine: 10, startCharacter: 0, endLine: 10, endCharacter: 50 })
```

#### AST 工具用法

**带元变量的模式搜索：**
```typescript
// 查找所有函数声明
ast_grep_search({ pattern: "function $NAME($$$ARGS)", language: "typescript", path: "src" })

// 查找 console.log 调用
ast_grep_search({ pattern: "console.log($MSG)", language: "typescript" })

// 查找 if 语句
ast_grep_search({ pattern: "if ($COND) { $$$BODY }", language: "typescript" })

// 查找 null 检查
ast_grep_search({ pattern: "$X === null", language: "typescript" })
```

**AST 感知替换：**
```typescript
// 将 console.log 转换为 logger（默认为试运行）
ast_grep_replace({
  pattern: "console.log($MSG)",
  replacement: "logger.info($MSG)",
  language: "typescript",
  dryRun: true  // 仅预览
})

// 将 var 转换为 const
ast_grep_replace({
  pattern: "var $NAME = $VALUE",
  replacement: "const $NAME = $VALUE",
  language: "typescript",
  dryRun: false  // 应用更改
})
```

**元变量语法：**
- `$NAME` - 匹配任意单个 AST 节点（标识符、表达式等）
- `$$$ARGS` - 匹配多个节点（函数参数、列表项等）

#### 诊断策略

`lsp_diagnostics_directory` 工具支持两种策略：

| 策略 | 使用时机 | 速度 | 准确性 |
|------|---------|------|--------|
| `tsc` | 存在 tsconfig.json | 快 | 高（完整类型检查） |
| `lsp` | 无 tsconfig.json | 慢 | 逐文件 |
| `auto` | 默认 | 不定 | 选择最佳可用策略 |

**建议**：使用 `strategy: "auto"`（默认）- 有 `tsc` 时优先使用。

### 修改检查清单

#### 添加新工具时

1. 在对应文件中定义工具（`lsp-tools.ts`、`ast-tools.ts` 或新文件）
2. 从 `index.ts` 导出（添加到 `allCustomTools`）
3. 如通过 MCP 暴露，更新 `src/mcp/omc-tools-server.ts`
4. 更新 `docs/REFERENCE.md`（MCP Tools 部分）
5. 如需要，更新 `src/agents/definitions.ts` 中的 agent 工具分配
6. 如分配给 agent，更新 `docs/CLAUDE.md`（Agent 工具矩阵）

### 测试要求

```bash
# 测试 LSP 工具（需要安装语言服务器）
npm test -- --grep "lsp"

# 测试 AST 工具
npm test -- --grep "ast"
```

### 常见模式

**工具定义结构：**
```typescript
export const myTool: ToolDefinition<{
  param: z.ZodString;
}> = {
  name: 'tool_name',
  description: 'What this tool does',
  schema: {
    param: z.string().describe('Parameter description')
  },
  handler: async (args) => {
    // 实现
    return { content: [{ type: 'text', text: 'result' }] };
  }
};
```

**错误处理：**
```typescript
async function withLspClient(filePath, operation, fn) {
  try {
    const client = await lspClientManager.getClientForFile(filePath);
    if (!client) {
      // 返回有用的安装提示
    }
    return fn(client);
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
  }
}
```

## 依赖

### 内部
- `lsp/` - LSP 客户端和服务器配置
- `diagnostics/` - 目录诊断（tsc/LSP 聚合器）

### 外部
| 包 | 用途 |
|----|------|
| `zod` | 工具参数的运行时 schema 验证 |
| `@ast-grep/napi` | AST 解析和模式匹配 |
| `vscode-languageserver-protocol` | LSP 类型 |

## 工具摘要

### LSP 工具（12 个）

| 工具 | 用途 |
|------|------|
| `lsp_hover` | 位置处的类型信息/文档 |
| `lsp_goto_definition` | 跳转到符号定义 |
| `lsp_find_references` | 查找所有用法 |
| `lsp_document_symbols` | 文件大纲 |
| `lsp_workspace_symbols` | 跨工作区符号搜索 |
| `lsp_diagnostics` | 单文件错误/警告 |
| `lsp_diagnostics_directory` | **全项目类型检查** |
| `lsp_servers` | 列出可用语言服务器 |
| `lsp_prepare_rename` | 检查重命名是否有效 |
| `lsp_rename` | 预览多文件重命名 |
| `lsp_code_actions` | 可用重构/修复 |
| `lsp_code_action_resolve` | 获取操作详情 |

### AST 工具（2 个）

| 工具 | 用途 |
|------|------|
| `ast_grep_search` | 带模式的结构化代码搜索 |
| `ast_grep_replace` | AST 感知代码转换 |

### Python REPL（1 个）

| 工具 | 用途 |
|------|------|
| `python_repl` | 执行 Python 代码进行数据分析 |

## 语言支持

### LSP（通过语言服务器）
| 语言 | 服务器 | 安装 |
|------|--------|------|
| TypeScript/JavaScript | typescript-language-server | `npm i -g typescript-language-server typescript` |
| Python | pylsp | `pip install python-lsp-server` |
| Rust | rust-analyzer | `rustup component add rust-analyzer` |
| Go | gopls | `go install golang.org/x/tools/gopls@latest` |
| C/C++ | clangd | 系统包管理器 |
| Java | jdtls | Eclipse JDT.LS |
| JSON | vscode-json-language-server | `npm i -g vscode-langservers-extracted` |
| HTML | vscode-html-language-server | `npm i -g vscode-langservers-extracted` |
| CSS | vscode-css-language-server | `npm i -g vscode-langservers-extracted` |
| YAML | yaml-language-server | `npm i -g yaml-language-server` |

### AST（通过 ast-grep）
JavaScript、TypeScript、TSX、Python、Ruby、Go、Rust、Java、Kotlin、Swift、C、C++、C#、HTML、CSS、JSON、YAML

<!-- MANUAL: -->
