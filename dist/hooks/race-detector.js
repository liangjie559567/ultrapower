/**
 * Race Condition Detector
 *
 * 检测并发 Hook 执行中的竞态条件
 */
export class RaceDetector {
    fileAccess = new Map();
    envAccess = new Map();
    conflicts = [];
    onRaceDetected;
    constructor(options = {}) {
        this.onRaceDetected = options.onRaceDetected;
    }
    /**
     * 记录文件访问
     */
    recordFileAccess(hookType, filePath, accessType) {
        const now = Date.now();
        if (!this.fileAccess.has(filePath)) {
            this.fileAccess.set(filePath, []);
        }
        const accesses = this.fileAccess.get(filePath);
        accesses.push({ hook: hookType, type: accessType, timestamp: now });
        // 检测冲突（100ms 窗口内）
        this.detectFileConflict(filePath, accesses);
    }
    /**
     * 记录环境变量访问
     */
    recordEnvAccess(hookType, envVar) {
        const now = Date.now();
        if (!this.envAccess.has(envVar)) {
            this.envAccess.set(envVar, []);
        }
        const accesses = this.envAccess.get(envVar);
        accesses.push({ hook: hookType, timestamp: now });
        // 检测冲突（50ms 窗口内）
        this.detectEnvConflict(envVar, accesses);
    }
    /**
     * 检测文件访问冲突
     */
    detectFileConflict(filePath, accesses) {
        const window = 100; // 100ms 窗口
        const now = Date.now();
        // 只检查窗口内的访问
        const recent = accesses.filter(a => now - a.timestamp < window);
        if (recent.length < 2)
            return;
        // 检测 read-write 或 write-write 冲突
        const writes = recent.filter(a => a.type === 'write');
        const reads = recent.filter(a => a.type === 'read');
        if (writes.length > 1) {
            // write-write 冲突
            const conflict = {
                type: 'file-write-write',
                resource: filePath,
                hooks: writes.map(w => w.hook),
                timestamp: now,
            };
            this.conflicts.push(conflict);
            if (this.onRaceDetected) {
                this.onRaceDetected(conflict);
            }
        }
        else if (writes.length > 0 && reads.length > 0) {
            // read-write 冲突
            const conflict = {
                type: 'file-read-write',
                resource: filePath,
                hooks: [...writes.map(w => w.hook), ...reads.map(r => r.hook)],
                timestamp: now,
            };
            this.conflicts.push(conflict);
            if (this.onRaceDetected) {
                this.onRaceDetected(conflict);
            }
        }
    }
    /**
     * 检测环境变量冲突
     */
    detectEnvConflict(envVar, accesses) {
        const window = 50; // 50ms 窗口
        const now = Date.now();
        const recent = accesses.filter(a => now - a.timestamp < window);
        if (recent.length > 1) {
            const conflict = {
                type: 'env-race',
                resource: envVar,
                hooks: recent.map(a => a.hook),
                timestamp: now,
            };
            this.conflicts.push(conflict);
            if (this.onRaceDetected) {
                this.onRaceDetected(conflict);
            }
        }
    }
    /**
     * 检查是否有竞态冲突
     */
    hasConflicts() {
        return this.conflicts.length > 0;
    }
    /**
     * 获取所有冲突
     */
    getConflicts() {
        return [...this.conflicts];
    }
    /**
     * 清除记录
     */
    reset() {
        this.fileAccess.clear();
        this.envAccess.clear();
        this.conflicts = [];
    }
}
//# sourceMappingURL=race-detector.js.map