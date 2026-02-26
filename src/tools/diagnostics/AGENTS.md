<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-28 | Updated: 2026-01-28 -->

# diagnostics

通过 TypeScript 编译器（tsc）或 LSP 聚合进行项目级诊断。

## 用途

此目录提供全项目类型检查和错误检测：
- **主要方式**：`tsc --noEmit` 用于快速、全面的 TypeScript 检查
- **回退方式**：当 tsc 不可用时使用 LSP 迭代
- 驱动 `lsp_diagnostics_directory` 工具

## 关键文件

| 文件 | 描述 |
|------|------|
| `index.ts` | 主入口 - 带策略选择的 `runDirectoryDiagnostics()` |
| `tsc-runner.ts` | TypeScript 编译器运行器 - 解析 `tsc --noEmit` 输出 |
| `lsp-aggregator.ts` | LSP 回退 - 迭代文件并收集诊断 |

## 面向 AI Agent

### 在此目录中工作

#### 策略选择

```typescript
// 自动选择最佳策略
const result = await runDirectoryDiagnostics(directory, 'auto');

// 强制指定策略
const tscResult = await runDirectoryDiagnostics(directory, 'tsc');
const lspResult = await runDirectoryDiagnostics(directory, 'lsp');
```

**策略逻辑：**
```typescript
if (strategy === 'auto') {
  useStrategy = hasTsconfig ? 'tsc' : 'lsp';
}
```

#### TSC 运行器

使用 `tsc --noEmit --pretty false` 生成可解析的输出：
```typescript
// 输出格式：file(line,col): error TS1234: message
const regex = /^(.+)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/gm;
```

**优势：**
- 快速（单进程）
- 全面（完整项目类型检查）
- 准确（使用 tsconfig.json）

#### LSP 聚合器

迭代文件的回退方式：
```typescript
for (const file of files) {
  const client = await lspClientManager.getClientForFile(file);
  await client.openDocument(file);
  await sleep(LSP_DIAGNOSTICS_WAIT_MS); // 等待 300ms 让服务器处理
  const diagnostics = client.getDiagnostics(file);
}
```

**适用场景：**
- 无 tsconfig.json
- 多语言项目
- 需要逐文件增量检查

### 常见模式

**结果格式：**
```typescript
interface DirectoryDiagnosticResult {
  strategy: 'tsc' | 'lsp';
  success: boolean;
  errorCount: number;
  warningCount: number;
  diagnostics: string;  // 格式化输出
  summary: string;      // 人类可读摘要
}
```

### 测试要求

```bash
# 用 TypeScript 项目测试
npm test -- --grep "diagnostics"
```

## 依赖

### 内部
- `../lsp/` - 聚合模式的 LSP 客户端

### 外部
| 包 | 用途 |
|----|------|
| `child_process` | 运行 tsc |
| `fs`, `path` | 文件系统操作 |

## 性能对比

| 策略 | 速度 | 准确性 | 要求 |
|------|------|--------|------|
| `tsc` | 快（约 1-5 秒） | 高 | tsconfig.json |
| `lsp` | 慢（约 0.3 秒/文件） | 中 | 已安装语言服务器 |

**建议**：TypeScript 项目始终优先使用 `tsc`。

<!-- MANUAL: -->
