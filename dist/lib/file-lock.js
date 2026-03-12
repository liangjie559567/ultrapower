/**
 * file-lock.ts — 基于目录的文件锁实现
 *
 * 使用 mkdirSync 的原子性保证互斥，支持陈旧锁自动清理。
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * 获取文件锁。
 *
 * 实现原理：通过 fs.mkdirSync 的原子性创建锁目录，
 * 成功创建即持有锁；失败则检测陈旧锁并决定是否抢占。
 *
 * @param lockPath  锁目录路径（如 `.omc/axiom/evolution/.archive.lock`）
 * @param staleMs   陈旧超时毫秒数，默认 30000（30 秒）
 * @returns         unlock 函数，调用后释放锁
 * @throws          Error 当锁未陈旧且被其他进程持有时
 */
export async function acquireLock(lockPath, staleMs = 30000) {
    const lockFile = path.join(lockPath, 'lock.json');
    const tryAcquire = () => {
        try {
            // mkdirSync 在目录已存在时抛出 EEXIST，保证原子互斥
            fs.mkdirSync(lockPath);
        }
        catch (err) {
            const nodeErr = err;
            if (nodeErr.code !== 'EEXIST') {
                throw err;
            }
            // 目录已存在：检测是否为陈旧锁
            let meta = null;
            try {
                const raw = fs.readFileSync(lockFile, 'utf8');
                meta = JSON.parse(raw);
            }
            catch {
                // lock.json 不可读 → 视为陈旧锁，强制清理
            }
            const isStale = meta === null || Date.now() - meta.timestamp > staleMs;
            if (isStale) {
                // 强制移除陈旧锁目录并重试
                fs.rmSync(lockPath, { recursive: true, force: true });
                tryAcquire();
                return;
            }
            throw new Error(`[file-lock] 锁已被占用: ${lockPath}`);
        }
        // 成功创建锁目录，写入元数据
        const meta = { pid: process.pid, timestamp: Date.now() };
        fs.writeFileSync(lockFile, JSON.stringify(meta), 'utf8');
    };
    tryAcquire();
    const unlock = async () => {
        fs.rmSync(lockPath, { recursive: true, force: true });
    };
    return unlock;
}
/**
 * 在文件锁保护下执行同步操作
 */
export function withFileLockSync(filePath, fn, maxRetries = 20) {
    const lockPath = `${filePath}.lock`;
    const lockFile = path.join(lockPath, 'lock.json');
    const fileDir = path.dirname(filePath);
    const lockPathParent = path.dirname(lockPath);
    if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
    }
    if (!fs.existsSync(lockPathParent)) {
        fs.mkdirSync(lockPathParent, { recursive: true });
    }
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            fs.mkdirSync(lockPath);
            const meta = { pid: process.pid, timestamp: Date.now() };
            fs.writeFileSync(lockFile, JSON.stringify(meta), 'utf8');
            break;
        }
        catch (err) {
            const nodeErr = err;
            if (nodeErr.code === 'EEXIST') {
                let meta = null;
                try {
                    const raw = fs.readFileSync(lockFile, 'utf8');
                    meta = JSON.parse(raw);
                }
                catch {
                    // Treat as stale lock
                }
                const isStale = meta === null || Date.now() - meta.timestamp > 30000;
                if (isStale) {
                    fs.rmSync(lockPath, { recursive: true, force: true });
                    continue;
                }
                if (attempt < maxRetries) {
                    const delay = Math.min(100 * Math.pow(2, attempt), 1000) + Math.random() * 50;
                    const start = Date.now();
                    while (Date.now() - start < delay) {
                        // Busy wait
                    }
                    continue;
                }
                lastError = new Error(`[file-lock] 锁已被占用: ${lockPath}`);
            }
            else if (nodeErr.code === 'ENOENT') {
                fs.rmSync(lockPath, { recursive: true, force: true });
                continue;
            }
            else {
                throw err;
            }
        }
    }
    if (lastError) {
        throw lastError;
    }
    try {
        return fn();
    }
    finally {
        try {
            fs.rmSync(lockPath, { recursive: true, force: true });
        }
        catch (err) {
            const nodeErr = err;
            if (nodeErr.code !== 'ENOENT' && nodeErr.code !== 'ENOTEMPTY') {
                throw err;
            }
        }
    }
}
/**
 * 在文件锁保护下执行异步操作
 */
export async function withFileLock(filePath, fn, maxRetries = 20, _retryDelay = 100) {
    const lockPath = `${filePath}.lock`;
    const lockFile = path.join(lockPath, 'lock.json');
    // Ensure parent directories exist for both file and lock
    const fileDir = path.dirname(filePath);
    const lockPathParent = path.dirname(lockPath);
    if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
    }
    if (!fs.existsSync(lockPathParent)) {
        fs.mkdirSync(lockPathParent, { recursive: true });
    }
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            await fs.promises.mkdir(lockPath);
            // Write lock metadata immediately after mkdir to minimize race window
            const meta = { pid: process.pid, timestamp: Date.now() };
            await fs.promises.writeFile(lockFile, JSON.stringify(meta), 'utf8');
            break; // Lock acquired
        }
        catch (err) {
            const nodeErr = err;
            if (nodeErr.code === 'EEXIST') {
                let meta = null;
                try {
                    const raw = await fs.promises.readFile(lockFile, 'utf8');
                    meta = JSON.parse(raw);
                }
                catch {
                    // Ignore parse errors, treat as stale lock
                }
                const isStale = meta === null || Date.now() - meta.timestamp > 30000;
                if (isStale) {
                    await fs.promises.rm(lockPath, { recursive: true, force: true });
                    continue; // Retry immediately
                }
                // Lock is held by another process, retry with exponential backoff + jitter
                if (attempt < maxRetries) {
                    const delay = Math.min(100 * Math.pow(2, attempt), 1000) + Math.random() * 50;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                lastError = new Error(`[file-lock] 锁已被占用: ${lockPath}`);
            }
            else if (nodeErr.code === 'ENOENT') {
                // Lock directory was deleted between mkdir and writeFile
                await fs.promises.rm(lockPath, { recursive: true, force: true }).catch(() => { });
                continue; // Retry immediately
            }
            else {
                throw err;
            }
        }
    }
    if (lastError) {
        throw lastError;
    }
    try {
        return await fn();
    }
    finally {
        await fs.promises.rm(lockPath, { recursive: true, force: true }).catch((err) => {
            const nodeErr = err;
            // Ignore ENOENT (already deleted) and ENOTEMPTY (Windows race condition)
            if (nodeErr.code !== 'ENOENT' && nodeErr.code !== 'ENOTEMPTY') {
                throw err;
            }
        });
    }
}
//# sourceMappingURL=file-lock.js.map