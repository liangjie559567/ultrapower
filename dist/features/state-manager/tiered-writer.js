/**
 * Tiered State Writer
 * 关键状态立即写入，非关键状态批量写入
 */
const CRITICAL_MODES = new Set(['session', 'team', 'ralph']);
export class TieredWriter {
    batchInterval;
    batchSize;
    pendingWrites = new Map();
    timer = null;
    writeCount = 0;
    batchCount = 0;
    constructor(options = {}) {
        this.batchInterval = options.batchInterval ?? 5000; // 5 秒
        this.batchSize = options.batchSize ?? 10; // 10 条
    }
    /**
     * 写入状态
     */
    async write(mode, data, writeFn) {
        this.writeCount++;
        if (CRITICAL_MODES.has(mode)) {
            // 关键状态立即写入
            await writeFn(mode, data);
            return;
        }
        // 非关键状态加入批量队列
        this.pendingWrites.set(mode, { mode, data, timestamp: Date.now() });
        // 达到批量阈值立即写入
        if (this.pendingWrites.size >= this.batchSize) {
            await this.flush(writeFn);
            return;
        }
        // 启动定时器
        if (!this.timer) {
            this.timer = setTimeout(() => this.flush(writeFn), this.batchInterval);
        }
    }
    /**
     * 刷新批量写入
     */
    async flush(writeFn) {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (this.pendingWrites.size === 0)
            return;
        const writes = Array.from(this.pendingWrites.values());
        this.pendingWrites.clear();
        this.batchCount++;
        // 批量写入
        await Promise.all(writes.map(w => writeFn(w.mode, w.data)));
    }
    /**
     * 获取统计信息
     */
    getStats() {
        return {
            totalWrites: this.writeCount,
            batchWrites: this.batchCount,
            pendingWrites: this.pendingWrites.size,
            ioReduction: this.writeCount > 0 ? ((this.writeCount - this.batchCount) / this.writeCount * 100).toFixed(1) : '0.0',
        };
    }
    /**
     * 清理
     */
    destroy() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}
//# sourceMappingURL=tiered-writer.js.map