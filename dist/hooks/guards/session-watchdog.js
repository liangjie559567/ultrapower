/**
 * session-watchdog.ts — 会话看门狗
 *
 * 注册 Stop 事件，检测会话超时并清理状态。
 * 对齐 Python session_watchdog.py：通过轮询文件修改时间监控活跃度。
 */
import { promises as fs } from 'fs';
import * as path from 'path';
export class SessionWatchdog {
    activeContextFile;
    timeoutMs;
    pollIntervalMs;
    startTime;
    pollTimer = null;
    constructor(options = {}) {
        const base = options.baseDir ?? process.cwd();
        this.activeContextFile = path.join(base, '.omc', 'axiom', 'active_context.md');
        this.timeoutMs = options.timeoutMs ?? 3600_000; // 默认 1 小时
        this.pollIntervalMs = options.pollIntervalMs ?? 60_000; // 默认每分钟轮询
        this.startTime = Date.now();
    }
    /** 启动轮询监控（对齐 Python 文件修改时间监控） */
    startPolling() {
        if (this.pollTimer)
            return;
        this.pollTimer = setInterval(() => {
            void this.checkFileActivity();
        }, this.pollIntervalMs);
    }
    /** 停止轮询 */
    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }
    /** 检查文件最后修改时间，超时则触发 onTimeout（对齐 Python 轮询逻辑） */
    async checkFileActivity() {
        try {
            const stat = await fs.stat(this.activeContextFile);
            const lastModifiedMs = stat.mtimeMs;
            const idleMs = Date.now() - lastModifiedMs;
            if (idleMs > this.timeoutMs) {
                this.stopPolling();
                await this.onTimeout();
            }
        }
        catch {
            // 文件不存在时跳过
        }
    }
    isTimedOut() {
        return Date.now() - this.startTime > this.timeoutMs;
    }
    async onStop(reason) {
        this.stopPolling();
        await this.updateStatus('IDLE', reason ?? 'session_ended');
    }
    async onTimeout() {
        await this.updateStatus('IDLE', 'timeout');
    }
    async updateStatus(status, reason) {
        let content;
        try {
            content = await fs.readFile(this.activeContextFile, 'utf-8');
        }
        catch {
            return;
        }
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const updated = content
            .replace(/^(Task Status:).*/m, `$1 ${status}`)
            .replace(/^(Last Updated:).*/m, `$1 ${timestamp}`);
        const withNote = updated.includes('## Session End')
            ? updated
            : updated + `\n\n## Session End\n- [${timestamp}] Stopped: ${reason}\n`;
        await fs.writeFile(this.activeContextFile, withNote, 'utf-8');
    }
}
//# sourceMappingURL=session-watchdog.js.map