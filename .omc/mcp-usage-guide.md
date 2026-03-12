# Codex/Gemini MCP 使用指南

## 快速修复超时问题

**问题**: Codex/Gemini 在大型工程中总是超时

**解决方案**: 超时已从 25秒 增加到 120秒

```bash
# 配置已自动更新
# 重启 Claude Code 即可生效
```

## 使用建议

### 1. 限制上下文文件（最重要）

```typescript
// ❌ 错误：传递太多文件
const files = glob('src/**/*.ts'); // 可能 100+ 文件
ask_codex({ context_files: files });

// ✅ 正确：只传递相关文件
const files = [
  'src/core/index.ts',
  'src/types.ts',
  'src/config.ts'
].slice(0, 10); // 最多 10 个
```

### 2. 使用后台模式处理大任务

```typescript
// 大型分析任务使用后台模式
const job = await ask_codex({
  agent_role: "architect",
  prompt: "分析项目架构",
  context_files: files,
  background: true  // 关键
});

// 等待完成
await wait_for_job({ job_id: job.jobId });
```

### 3. 任务分解

```typescript
// 按模块分别分析
for (const module of ['auth', 'api', 'ui']) {
  await ask_codex({
    prompt: `分析 ${module} 模块`,
    context_files: getModuleFiles(module).slice(0, 10)
  });
}
```

## 推荐配置

| 任务类型 | 文件数 | 超时 | 模式 |
|---------|--------|------|------|
| 快速查询 | 1-3 | 30s | 同步 |
| 代码审查 | 5-10 | 60s | 同步 |
| 架构分析 | 10-15 | 120s | 后台 |
| 大型重构 | 15+ | 180s | 后台 |

## 故障排查

1. **仍然超时**: 减少 context_files 数量
2. **API 错误**: 检查 API 密钥配置
3. **CLI 未找到**: 重新安装 codex/gemini CLI

## 下一步

重启 Claude Code 以应用新的超时配置。
