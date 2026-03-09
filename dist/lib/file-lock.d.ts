/**
 * file-lock.ts — 基于目录的文件锁实现
 *
 * 使用 mkdirSync 的原子性保证互斥，支持陈旧锁自动清理。
 */
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
export declare function acquireLock(lockPath: string, staleMs?: number): Promise<() => Promise<void>>;
/**
 * 在文件锁保护下执行异步操作
 */
export declare function withFileLock<T>(filePath: string, fn: () => T | Promise<T>, maxRetries?: number, _retryDelay?: number): Promise<T>;
//# sourceMappingURL=file-lock.d.ts.map