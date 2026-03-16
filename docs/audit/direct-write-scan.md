# 直接写入点扫描报告

## 扫描摘要
- 发现直接写入点: 3
- 需要修复: 3
- 测试代码中的写入: 已排除（测试环境可接受）

## 发现的直接写入点

### 1. src/lib/file-lock.ts:66
```typescript
const meta: LockMeta = { pid: process.pid, timestamp: Date.now() };
fs.writeFileSync(lockFile, JSON.stringify(meta), 'utf8');
```
**问题**: 未使用原子写入
**影响**: 并发写入可能导致锁元数据损坏
**严重性**: 高 - 锁机制本身需要可靠性
**修复方案**: 替换为 atomicWriteJsonSyncWithRetry

### 2. src/features/state-manager/wal.ts:57
```typescript
const walPath = path.join(this.walDir, `${id}.wal`);
fs.writeFileSync(walPath, JSON.stringify(entry, null, 2));
```
**问题**: WAL 日志未使用原子写入
**影响**: WAL 损坏会导致状态恢复失败
**严重性**: 高 - WAL 是数据恢复的关键
**修复方案**: 替换为 atomicWriteJsonSyncWithRetry

### 3. src/features/state-manager/wal.ts:69
```typescript
entry.committed = true;
const walPath = path.join(this.walDir, `${id}.wal`);
fs.writeFileSync(walPath, JSON.stringify(entry, null, 2));
```
**问题**: WAL commit 标记未使用原子写入
**影响**: commit 状态不一致可能导致重复执行
**严重性**: 高 - 影响事务完整性
**修复方案**: 替换为 atomicWriteJsonSyncWithRetry

### 4. src/security/audit-logger.ts:70
```typescript
fs.writeFileSync(this.logPath, JSON.stringify(this.events, null, 2));
```
**问题**: 审计日志未使用原子写入
**影响**: 日志损坏可能导致审计追踪丢失
**严重性**: 中 - 影响安全审计能力
**修复方案**: 替换为 atomicWriteJsonSyncWithRetry

## 修复清单

### 高优先级（P0）
1. src/lib/file-lock.ts:66 - acquireLock()
2. src/features/state-manager/wal.ts:57 - begin()
3. src/features/state-manager/wal.ts:69 - commit()

### 中优先级（P1）
4. src/security/audit-logger.ts:70 - save()

## 修复模板

```typescript
// 修复前
fs.writeFileSync(filePath, JSON.stringify(data));

// 修复后
import { atomicWriteJsonSyncWithRetry } from '../../lib/atomic-write.js';
atomicWriteJsonSyncWithRetry(filePath, data);
```

## 已排除项

以下文件中的 writeFileSync 调用已排除（测试代码）：
- tests/**/*.test.ts
- src/**/__tests__/**/*.test.ts
- benchmarks/run.ts

测试代码中的直接写入是可接受的，因为：
1. 测试环境不涉及生产并发
2. 测试需要快速失败以发现问题
3. 测试数据可重建

## 验证建议

修复后应执行：
1. 单元测试：验证原子写入行为
2. 并发测试：模拟多进程写入场景
3. 故障注入：测试写入中断恢复能力
