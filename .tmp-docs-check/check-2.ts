// Phase 2: MCP 迁移
const adapter = await createWorkerAdapter('auto', cwd);
if (!adapter) {
  // 自动回退到旧实现
  return legacyUpsertJobStatus(cwd, jobStatus);
}

// Phase 3: Team 迁移
const workers = await adapter.list({ workerType: 'team', teamName });
if (workers.length === 0) {
  // 回退到 JSON 文件
  return getWorkersFromJsonFiles(teamName);
}
