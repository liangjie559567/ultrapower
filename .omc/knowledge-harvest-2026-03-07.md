# 知识收割 - Bug 修复会话

## 新增知识条目

### 1. 原子写入三层防护模式
**置信度：** HIGH
**来源：** 生产验证通过
**模式：**
```typescript
await withFileLock(path, async () => {
  atomicWriteJsonSync(path, data, { retries: 3 });
});
```
**适用场景：** 高并发状态文件写入

### 2. WAL 完整集成流程
**置信度：** HIGH
**来源：** Architect 验证
**流程：**
1. `WAL.writeEntry(operation)` - 记录意图
2. 执行状态写入（原子操作）
3. `WAL.commit()` - 标记完成
4. 启动时 `WAL.recover()` - 崩溃恢复

### 3. 进程清理信号升级
**置信度：** HIGH
**来源：** MCP 进程泄漏修复
**模式：**
```typescript
process.kill(pid, 'SIGTERM');
setTimeout(() => {
  if (stillRunning) process.kill(pid, 'SIGKILL');
}, 5000);
```

### 4. TOCTOU 漏洞消除
**置信度：** HIGH
**反模式：**
```typescript
if (fs.existsSync(path)) {  // ❌ TOCTOU
  const data = fs.readFileSync(path);
}
```
**正确模式：**
```typescript
try {
  const data = await fs.readFile(path);  // ✅ 直接操作
} catch (err) {
  if (err.code === 'ENOENT') { /* 处理不存在 */ }
}
```

## 工作流模式

### Ralph + Team 组合
**效果：** 持久循环 + 并行执行
**适用：** 需要多轮迭代和验证的复杂修复
**关键：** Architect 早期介入避免返工

### 并行任务文件所有权
**规则：** 每个任务声明修改的文件
**冲突检测：** 任务分配前检查文件重叠
**收益：** 避免并发修改冲突

## 测试策略

### 分层验证
1. 单元测试（每个修复）
2. 集成测试（完整构建）
3. Architect 验证（架构完整性）

### 测试先行
每轮修复后立即运行完整测试套件，快速发现回归。
