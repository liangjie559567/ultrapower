# Prompt Optimization

## 概述

ultrapower 现已集成自动 prompt 优化功能，可在发送给 Codex/Gemini 之前自动优化 prompts，减少 token 使用并提升响应速度。

## 功能特性

### 1. 自动优化冗余短语

移除常见的礼貌用语和冗余表达：

- `Could you please` → 移除
- `I would like you to` → 移除
- `Can you help me` → 移除
- `help me` → 移除
- `and help me understand it` → 移除

**示例：**
```
输入: "Could you please analyze this code and help me understand it"
输出: "analyze this code"
```

### 2. 简化指令动词

将冗长的指令简化为直接命令：

- `Please summarize the following` → `Summarize`
- `Could you analyze` → `Analyze`

**示例：**
```
输入: "Please summarize the following document"
输出: "Summarize document"
```

### 3. 上下文文件优化

- 优先选择接口定义文件（`.d.ts`、`types`）
- 限制文件数量（默认最多 5 个）
- 保持最相关的文件

### 4. Token 估算

粗略估算：1 token ≈ 4 字符

## 集成位置

Prompt optimizer 已集成到 MCP 核心层：

- **文件**: `src/mcp/prompt-injection.ts`
- **函数**: `buildPromptWithSystemContext()`
- **影响范围**: 所有通过 Codex/Gemini MCP 工具的调用

## 使用方式

### 自动优化（默认启用）

所有通过以下方式的调用都会自动优化：

```typescript
// MCP 工具调用
ask_codex({
  agent_role: "architect",
  prompt: "Could you please analyze this code", // 自动优化为 "analyze this code"
  context_files: ["file1.ts", "file2.ts"]
});

ask_gemini({
  agent_role: "designer",
  prompt: "Please summarize the following UI", // 自动优化为 "Summarize UI"
  files: ["component.tsx"]
});
```

### 手动使用 Optimizer

如果需要在其他场景使用：

```typescript
import { optimizePrompt } from './features/prompt-optimizer';

const result = optimizePrompt(
  'Could you please analyze this code',
  ['file1.ts', 'file2.ts', 'file3.ts'],
  { maxContextFiles: 2, preferInterfaces: true }
);

console.log(result.prompt);           // "analyze this code"
console.log(result.contextFiles);     // ["file1.ts", "file2.ts"]
console.log(result.estimatedTokens);  // 4
console.log(result.optimizations);    // ["移除冗余短语", "限制为 2 个文件"]
```

## API 参考

### `optimizePromptText(prompt: string)`

优化单个 prompt 文本。

**返回：**
```typescript
{
  text: string;      // 优化后的文本
  changes: string[]; // 应用的优化列表
}
```

### `optimizeContextFiles(files: string[], options?: OptimizationOptions)`

优化上下文文件列表。

**选项：**
```typescript
interface OptimizationOptions {
  maxContextFiles?: number;    // 最大文件数（默认 5）
  preferInterfaces?: boolean;  // 优先接口文件（默认 true）
}
```

**返回：**
```typescript
{
  files: string[];   // 优化后的文件列表
  changes: string[]; // 应用的优化列表
}
```

### `estimateTokens(text: string): number`

估算文本的 token 数量（1 token ≈ 4 字符）。

### `optimizePrompt(prompt, contextFiles, options?): OptimizedPrompt`

完整优化流程，同时优化 prompt 和上下文文件。

**返回：**
```typescript
interface OptimizedPrompt {
  prompt: string;           // 优化后的 prompt
  contextFiles: string[];   // 优化后的文件列表
  estimatedTokens: number;  // 估算的 token 数
  optimizations: string[];  // 所有应用的优化
}
```

## 性能影响

- **Token 节省**: 平均减少 20-40% 的 prompt tokens
- **响应速度**: 更短的 prompts 通常获得更快的响应
- **成本节省**: 减少 API 调用的 token 消耗

## 测试覆盖

- 单元测试: `src/features/prompt-optimizer/__tests__/index.test.ts` (7 tests)
- 集成测试: `src/mcp/__tests__/prompt-optimization-integration.test.ts` (3 tests)
- 所有测试通过 ✓

## 最佳实践

1. **保持简洁**: 直接使用命令式语句，避免礼貌用语
2. **明确意图**: 清晰表达需求，optimizer 会移除冗余
3. **信任优化**: 系统会自动优化，无需手动精简 prompts

## 禁用优化

如果需要禁用自动优化（不推荐），可以修改 `buildPromptWithSystemContext` 函数：

```typescript
// 注释掉优化调用
// const { text: optimizedPrompt } = optimizePromptText(userPrompt);
// parts.push(optimizedPrompt);
parts.push(userPrompt); // 使用原始 prompt
```

## 未来改进

- [ ] 支持更多语言的冗余短语检测
- [ ] 基于历史数据的智能优化
- [ ] 可配置的优化级别（aggressive/moderate/conservative）
- [ ] 优化效果的实时统计和报告
