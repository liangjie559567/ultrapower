# 状态管理一致性检查报告

**检查时间：** 2026-03-07
**检查范围：** dist/lib/, dist/features/state-manager/, dist/hooks/*/state.js
**检查目标：** 验证状态文件读写的原子性和错误恢复机制

---

## 执行摘要

**总体评估：** 🟡 中等风险 - 存在多个关键问题需要修复

**关键发现：**
- ✅ 核心状态管理器使用原子写入（atomic-write.js）
- ❌ WAL 实现未使用原子写入，存在数据损坏风险
- ❌ 部分 hooks 直接使用 writeFileSync，绕过原子保护
- ⚠️ 文件锁实现存在递归调用风险
- ⚠️ 缺少并发写入重试机制

---

## [FINDING:S1] WAL 写入未使用原子操作

**风险等级：** Critical
**影响：** 数据损坏/丢失 - WAL 是恢复机制的基础，其损坏会导致状态无法恢复

### [EVIDENCE:S1]
**文件：** `dist/features/state-manager/wal.js`
**问题代码：**
```javascript
// 行 44: writeEntry 方法
fs.writeFileSync(walPath, JSON.stringify(entry, null, 2));

// 行 54: commit 方法
fs.writeFileSync(walPath, JSON.stringify(entry, null, 2));
```

**问题分析：**
1. WAL 条目使用 `fs.writeFileSync` 直接写入，没有 fsync 保证
2. 进程崩溃或断电时，WAL 文件可能部分写入（torn write）
3. 恢复时读取损坏的 WAL 文件会导致 JSON.parse 失败（行 26）
4. 虽然有 try-catch 跳过损坏文件（行 29），但会丢失未提交的状态变更

**修复建议：**
```javascript
// 使用 atomicWriteJsonSync 替代 writeFileSync
import { atomicWriteJsonSync } from '../../lib/atomic-write.js';

writeEntry(mode, data) {
    // ...
    atomicWriteJsonSync(walPath, entry);  // 原子写入 + fsync
    this.entries.set(id, entry);
    return id;
}
```

---

## [FINDING:S2] Autopilot/Ultrapilot 状态写入未使用原子操作

**风险等级：** High
**影响：** 数据不一致 - 状态文件损坏导致工作流中断，用户需手动清理

### [EVIDENCE:S2]
**文件 1：** `dist/hooks/autopilot/state.js`
```javascript
// 行 96
writeFileSync(stateFile, JSON.stringify(state, null, 2));
```

**文件 2：** `dist/hooks/ultrapilot/state.js`
```javascript
// 行 91
writeFileSync(stateFile, JSON.stringify(state, null, 2));
```

**问题分析：**
1. 两个关键工作流模式直接使用 `writeFileSync`，绕过了原子写入保护
2. 与 team-pipeline（使用 `atomicWriteJsonSync`）形成不一致
3. 高频写入场景（autopilot 迭代、ultrapilot 并行任务）增加损坏概率
4. 没有备份机制，损坏后无法恢复

**对比：** team-pipeline 正确使用了原子写入：
```javascript
// dist/hooks/team-pipeline/state.js 行 88
atomicWriteJsonSync(statePath, next);
```

**修复建议：**
```javascript
import { atomicWriteJsonSync } from '../../lib/atomic-write.js';

export function writeAutopilotState(directory, state, sessionId) {
    try {
        ensureStateDir(directory, sessionId);
        const stateFile = getStateFilePath(directory, sessionId);
        atomicWriteJsonSync(stateFile, state);  // 使用原子写入
        return true;
    } catch {
        return false;
    }
}
```

---

## [FINDING:S3] 文件锁实现存在递归调用风险

**风险等级：** Medium
**影响：** 死锁/栈溢出 - 在高并发场景下可能导致进程崩溃

### [EVIDENCE:S3]
**文件：** `dist/lib/file-lock.js`
```javascript
// 行 21-52: tryAcquire 函数
const tryAcquire = () => {
    try {
        fs.mkdirSync(lockPath);
    } catch (err) {
        // ...
        if (isStale) {
            fs.rmSync(lockPath, { recursive: true, force: true });
            tryAcquire();  // 递归调用，无深度限制
            return;
        }
        throw new Error(`[file-lock] 锁已被占用: ${lockPath}`);
    }
    // ...
};
```

**问题分析：**
1. `tryAcquire` 递归调用自身，没有最大重试次数限制
2. 如果多个进程同时清理陈旧锁，可能形成活锁（livelock）
3. 极端情况下可能导致栈溢出（虽然概率低）
4. 没有指数退避（exponential backoff），高并发时会加剧竞争

**修复建议：**
```javascript
export async function acquireLock(lockPath, staleMs = 30000, maxRetries = 5) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            fs.mkdirSync(lockPath);
            // 成功获取锁
            const meta = { pid: process.pid, timestamp: Date.now() };
            fs.writeFileSync(path.join(lockPath, 'lock.json'), JSON.stringify(meta));
            break;
        } catch (err) {
            if (err.code !== 'EEXIST') throw err;

            // 检查陈旧锁
            const isStale = checkStaleLock(lockPath, staleMs);
            if (isStale) {
                fs.rmSync(lockPath, { recursive: true, force: true });
                retries++;
                await sleep(Math.min(100 * Math.pow(2, retries), 1000)); // 指数退避
                continue;
            }
            throw new Error(`[file-lock] 锁已被占用: ${lockPath}`);
        }
    }
    if (retries >= maxRetries) {
        throw new Error(`[file-lock] 获取锁失败，超过最大重试次数: ${lockPath}`);
    }
    return async () => fs.rmSync(lockPath, { recursive: true, force: true });
}
```

---

## [FINDING:S4] 缺少并发写入重试机制

**风险等级：** Medium
**影响：** 写入失败 - 临时文件冲突导致状态更新丢失

### [EVIDENCE:S4]
**文件：** `dist/lib/atomic-write.js`
```javascript
// 行 50: 使用 'wx' 标志（O_CREAT | O_EXCL）
const fd = await fs.open(tempPath, "wx", 0o600);
```

**问题分析：**
1. 临时文件名使用 `crypto.randomUUID()`，理论上不会冲突
2. 但在极端高并发场景（如 ultrawork 并行写入），仍可能出现：
   - 文件系统延迟导致的假冲突
   - NFS/网络文件系统的缓存不一致
3. 当前实现遇到冲突直接抛出异常，没有重试
4. 调用方（如 state-manager）捕获异常后返回 `success: false`，但不重试

**影响场景：**
- Ultrawork 模式：多个 agent 并行写入不同状态文件
- Team 模式：多个 worker 同时更新任务状态
- Ralph 循环：高频迭代写入

**修复建议：**
```javascript
export async function atomicWriteJson(filePath, data, maxRetries = 3) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const dir = path.dirname(filePath);
            const base = path.basename(filePath);
            const tempPath = path.join(dir, `.${base}.tmp.${crypto.randomUUID()}`);
            // ... 原有写入逻辑 ...
            return; // 成功
        } catch (err) {
            lastError = err;
            if (err.code === 'EEXIST' && i < maxRetries - 1) {
                await sleep(10 * (i + 1)); // 简单退避
                continue;
            }
            throw err;
        }
    }
    throw lastError;
}
```

---

## [FINDING:S5] StateManager 缓存失效时机不完整

**风险等级：** Low
**影响：** 读取陈旧数据 - 外部修改状态文件后，缓存未失效

### [EVIDENCE:S5]
**文件：** `dist/features/state-manager/index.js`
```javascript
// 行 216: writeState 时清除缓存
stateCache.delete(statePath);

// 行 274: clearState 时清除缓存
stateCache.delete(getStatePath(name, loc));

// 但缺少：
// 1. 外部进程修改文件时的缓存失效
// 2. 文件被删除时的缓存失效
// 3. WAL 恢复时的缓存失效
```

**问题分析：**
1. 缓存基于 mtime 检测变更（行 126），但只在缓存命中时检查
2. 如果外部进程修改文件，下次读取会命中陈旧缓存（5 秒 TTL 内）
3. WAL 恢复时（行 54）调用 `writeState`，会清除缓存，但如果恢复失败则缓存仍陈旧
4. `clearState` 使用 `unlinkSync` 删除文件，但如果删除失败，缓存未清除

**修复建议：**
```javascript
// 在 recoverFromWAL 中，无论成功失败都清除缓存
for (const entry of uncommitted) {
    const statePath = getStatePath(entry.mode, StateLocation.LOCAL);
    stateCache.delete(statePath); // 先清除缓存
    try {
        writeState(entry.mode, entry.data, StateLocation.LOCAL);
        walInstance.commit(entry.id);
    } catch (error) {
        console.error(`[WAL] Failed to recover ${entry.mode}:`, error);
    }
}

// 在 clearState 中，先清除缓存再删除文件
export function clearState(name, location) {
    // 先清除所有可能的缓存
    const locationsForCache = location ? [location] : [StateLocation.LOCAL, StateLocation.GLOBAL];
    for (const loc of locationsForCache) {
        stateCache.delete(getStatePath(name, loc));
    }

    // 然后删除文件
    // ... 原有删除逻辑 ...
}
```

---

## 正面发现

### ✅ 原子写入实现正确

**文件：** `dist/lib/atomic-write.js`

**优点：**
1. 使用 temp-file + rename 模式保证原子性（行 59-61）
2. 写入前调用 `fsync()` 保证持久化（行 54, 105, 168）
3. 目录 fsync 保证 rename 持久化（行 64-75，虽然是 best-effort）
4. 临时文件使用 `wx` 标志防止覆盖（行 50, 101, 164）
5. 失败时自动清理临时文件（行 78-81, 129-136, 199-207）
6. 文件权限设置为 0o600，防止未授权访问（行 50, 101, 164）

### ✅ 状态管理器架构合理

**文件：** `dist/features/state-manager/index.js`

**优点：**
1. 统一状态文件位置（.omc/state/）
2. 支持 legacy 路径迁移
3. WAL 恢复机制（虽然 WAL 本身有问题）
4. 读缓存减少 I/O（5 秒 TTL + mtime 检测）
5. 支持加密（OMC_ENCRYPTION_KEY）
6. 审计日志集成

### ✅ 文件锁基本可用

**文件：** `dist/lib/file-lock.js`

**优点：**
1. 使用 `mkdirSync` 的原子性保证互斥
2. 支持陈旧锁自动清理（30 秒超时）
3. 锁元数据包含 PID 和时间戳
4. 实际使用场景（boulder-state）正确调用

---

## 统计数据

### 状态写入方式分布

| 写入方式 | 文件数 | 风险等级 |
|---------|--------|---------|
| atomicWriteJsonSync | 2 | ✅ 安全 |
| atomicWriteSync | 1 | ✅ 安全 |
| writeFileSync (直接) | 4 | ❌ 危险 |

**详细列表：**
- ✅ `dist/hooks/team-pipeline/state.js` - atomicWriteJsonSync
- ✅ `dist/features/boulder-state/storage.js` - atomicWriteSync
- ❌ `dist/hooks/autopilot/state.js` - writeFileSync
- ❌ `dist/hooks/ultrapilot/state.js` - writeFileSync
- ❌ `dist/features/state-manager/wal.js` - writeFileSync (2 处)

### 并发保护覆盖率

| 模块 | 锁保护 | 原子写入 | 重试机制 |
|------|--------|---------|---------|
| state-manager | ❌ | ✅ | ❌ |
| boulder-state | ✅ | ✅ | ❌ |
| autopilot | ❌ | ❌ | ❌ |
| ultrapilot | ❌ | ❌ | ❌ |
| team-pipeline | ❌ | ✅ | ❌ |
| WAL | ❌ | ❌ | ❌ |

---

## 优先级修复建议

### P0 - 立即修复（数据损坏风险）

1. **WAL 原子写入** (FINDING:S1)
   - 影响：恢复机制失效
   - 工作量：1 小时
   - 文件：`dist/features/state-manager/wal.js`

2. **Autopilot/Ultrapilot 原子写入** (FINDING:S2)
   - 影响：工作流状态损坏
   - 工作量：2 小时
   - 文件：`dist/hooks/autopilot/state.js`, `dist/hooks/ultrapilot/state.js`

### P1 - 近期修复（稳定性改进）

3. **文件锁重试限制** (FINDING:S3)
   - 影响：死锁/栈溢出
   - 工作量：2 小时
   - 文件：`dist/lib/file-lock.js`

4. **原子写入重试机制** (FINDING:S4)
   - 影响：高并发写入失败
   - 工作量：3 小时
   - 文件：`dist/lib/atomic-write.js`

### P2 - 可选优化（边缘情况）

5. **缓存失效完整性** (FINDING:S5)
   - 影响：读取陈旧数据
   - 工作量：1 小时
   - 文件：`dist/features/state-manager/index.js`

---

## 测试建议

### 单元测试

```javascript
// 测试 WAL 原子性
describe('WAL atomic writes', () => {
    it('should survive process crash during write', async () => {
        const wal = new WriteAheadLog(testDir);
        const id = wal.writeEntry('test', { data: 'value' });

        // 模拟崩溃：直接读取 WAL 文件，应该是完整的 JSON
        const walPath = path.join(testDir, '.omc/state/wal', `${id}.wal`);
        const content = fs.readFileSync(walPath, 'utf-8');
        expect(() => JSON.parse(content)).not.toThrow();
    });
});

// 测试并发写入
describe('Concurrent state writes', () => {
    it('should handle 10 parallel writes without corruption', async () => {
        const promises = Array.from({ length: 10 }, (_, i) =>
            writeState(`test-${i}`, { value: i }, StateLocation.LOCAL)
        );
        await Promise.all(promises);

        // 验证所有文件都正确写入
        for (let i = 0; i < 10; i++) {
            const state = readState(`test-${i}`, StateLocation.LOCAL);
            expect(state.data.value).toBe(i);
        }
    });
});
```

### 集成测试

```bash
# 压力测试：模拟 ultrawork 高并发场景
for i in {1..100}; do
    node -e "
        const { writeState } = require('./dist/features/state-manager');
        writeState('stress-test-$i', { iteration: $i });
    " &
done
wait

# 验证所有状态文件完整性
for i in {1..100}; do
    node -e "
        const { readState } = require('./dist/features/state-manager');
        const state = readState('stress-test-$i');
        if (!state.exists || state.data.iteration !== $i) {
            console.error('Corruption detected in stress-test-$i');
            process.exit(1);
        }
    "
done
```

---

## 附录：代码审查清单

### 状态写入安全检查

- [ ] 是否使用 `atomicWriteJsonSync` 或 `atomicWriteFileSync`？
- [ ] 是否在写入前调用 `fsync()`？
- [ ] 是否使用 temp-file + rename 模式？
- [ ] 失败时是否清理临时文件？
- [ ] 是否设置了安全的文件权限（0o600）？

### 并发访问检查

- [ ] 多进程/多线程场景是否需要文件锁？
- [ ] 文件锁是否有超时和陈旧锁清理？
- [ ] 是否有重试机制和指数退避？
- [ ] 是否避免了递归调用导致的栈溢出？

### 错误恢复检查

- [ ] 读取失败时是否有降级策略（返回 null/默认值）？
- [ ] 是否有 WAL 或备份机制？
- [ ] 损坏文件是否能被检测和跳过？
- [ ] 是否有审计日志记录异常？

---

**报告生成时间：** 2026-03-07T00:52:21.781Z
**检查工具版本：** ultrapower v5.5.30
**下一步行动：** 创建 GitHub Issues 跟踪 P0/P1 修复项
