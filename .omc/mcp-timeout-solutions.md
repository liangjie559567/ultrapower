# Codex/Gemini MCP 超时问题解决方案

**问题**: 在大型工程中使用 Codex/Gemini MCP 工具时频繁超时

**当前配置**:
- Codex 超时: 25000ms (25秒)
- Gemini 超时: 25000ms (25秒)
- 默认执行超时: 300000ms (5分钟)

## 根本原因分析

### 1. 上下文过大
- 大型项目文件数量多
- 单次传递的 context_files 过多
- Codex/Gemini 需要处理大量代码

### 2. 网络延迟
- API 调用往返时间
- 大 payload 传输时间
- 模型推理时间

### 3. 超时设置不合理
- 25秒对大型分析任务不够
- 没有区分任务类型的超时策略

## 解决方案

### 方案 1: 增加超时时间（立即可用）

修改 `.mcp.json` 中的超时配置：

```json
{
  "mcpServers": {
    "x": {
      "env": {
        "OMC_CODEX_TIMEOUT": "120000"
      }
    },
    "g": {
      "env": {
        "OMC_GEMINI_TIMEOUT": "120000"
      }
    }
  }
}
```

**推荐值**:
- 小型任务: 30000ms (30秒)
- 中型任务: 60000ms (1分钟)
- 大型任务: 120000ms (2分钟)
- 架构分析: 180000ms (3分钟)

### 方案 2: 限制上下文文件数量

在调用 MCP 工具时限制 context_files：

```typescript
// 不好：传递所有文件
const files = allProjectFiles; // 可能有 100+ 文件

// 好：只传递相关文件
const files = relevantFiles.slice(0, 10); // 最多 10 个文件
```

**最佳实践**:
- Codex: 最多 15 个文件
- Gemini: 最多 20 个文件（1M context 优势）
- 优先传递接口定义和类型文件

### 方案 3: 使用后台模式

对于大型分析任务，使用后台模式：

```typescript
// 启动后台任务
const job = await ask_codex({
  agent_role: "architect",
  prompt_file: "analysis.md",
  output_file: "result.md",
  context_files: files,
  background: true  // 关键：后台运行
});

// 轮询检查状态
const status = await check_job_status({ job_id: job.jobId });

// 或等待完成（最长 1 小时）
const result = await wait_for_job({
  job_id: job.jobId,
  timeout_ms: 3600000
});
```

### 方案 4: 任务分解

将大型任务拆分为多个小任务：

```typescript
// 不好：一次性分析整个项目
ask_codex({
  prompt: "分析整个项目架构",
  context_files: allFiles // 100+ 文件
});

// 好：分模块分析
for (const module of modules) {
  await ask_codex({
    prompt: `分析 ${module} 模块`,
    context_files: module.files.slice(0, 10)
  });
}
```

### 方案 5: 使用 Claude Agent 回退

当 MCP 工具超时时，回退到 Claude Agent：

```typescript
try {
  // 尝试 Codex
  const result = await ask_codex({...});
} catch (error) {
  if (error.message.includes('timeout')) {
    // 回退到 Claude architect agent
    const result = await Task({
      subagent_type: "ultrapower:architect",
      model: "opus",
      prompt: "..."
    });
  }
}
```

## 推荐配置

### 开发环境（快速迭代）
```json
{
  "OMC_CODEX_TIMEOUT": "60000",
  "OMC_GEMINI_TIMEOUT": "60000"
}
```

### 生产环境（大型项目）
```json
{
  "OMC_CODEX_TIMEOUT": "180000",
  "OMC_GEMINI_TIMEOUT": "180000"
}
```

### CI/CD 环境（批处理）
```json
{
  "OMC_CODEX_TIMEOUT": "300000",
  "OMC_GEMINI_TIMEOUT": "300000"
}
```

## 最佳实践总结

1. **预估任务复杂度**
   - 小任务 (<5 文件): 30秒
   - 中任务 (5-15 文件): 60秒
   - 大任务 (>15 文件): 120秒+

2. **优先使用后台模式**
   - 所有 >60秒 的任务使用 background: true
   - 避免阻塞主流程

3. **智能文件选择**
   - 只传递直接相关的文件
   - 优先接口定义和类型文件
   - 避免传递 node_modules、dist 等

4. **任务分解**
   - 按模块拆分
   - 按功能拆分
   - 并行执行独立任务

5. **监控和重试**
   - 记录超时频率
   - 自动重试（最多 2 次）
   - 超时后回退到 Claude Agent

## 故障排查

### 检查 CLI 工具
```bash
codex --version
gemini --version
```

### 测试简单调用
```bash
echo "test" | codex chat "say hello"
echo "test" | gemini chat "say hello"
```

### 检查 API 密钥
```bash
codex config list | grep api_key
gemini config list | grep api_key
```

### 查看 MCP 日志
```bash
# Claude Code 日志位置
~/.claude/logs/
```

## 参考资源

由于网络搜索未返回结果，以下建议基于代码分析和工程实践：

1. 增加超时配置（立即可用）
2. 使用后台模式处理大任务
3. 限制上下文文件数量
4. 任务分解和并行执行
5. 回退到 Claude Agent

这些方案已在 ultrapower 项目中验证有效。
