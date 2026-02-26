/**
 * session-watchdog.ts — 会话看门狗
 *
 * 注册 Stop 事件，检测会话超时并清理状态。
 * 对齐 Python session_watchdog.py：通过轮询文件修改时间监控活跃度。
 */

import { promises as fs } from 'fs';
import * as path from 'path';

export interface WatchdogOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
  baseDir?: string;
}

export class SessionWatchdog {
  private readonly activeContextFile: string;
  private readonly timeoutMs: number;
  private readonly pollIntervalMs: number;
  private startTime: number;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: WatchdogOptions = {}) {
    const base = options.baseDir ?? process.cwd();
    this.activeContextFile = path.join(base, '.omc', 'axiom', 'active_context.md');
    this.timeoutMs = options.timeoutMs ?? 3600_000;       // 默认 1 小时
    this.pollIntervalMs = options.pollIntervalMs ?? 60_000; // 默认每分钟轮询
    this.startTime = Date.now();
  }

  /** 启动轮询监控（对齐 Python 文件修改时间监控） */
  startPolling(): void {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => {
      void this.checkFileActivity();
    }, this.pollIntervalMs);
  }

  /** 停止轮询 */
  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /** 检查文件最后修改时间，超时则触发 onTimeout（对齐 Python 轮询逻辑） */
  private async checkFileActivity(): Promise<void> {
    try {
      const stat = await fs.stat(this.activeContextFile);
      const lastModifiedMs = stat.mtimeMs;
      const idleMs = Date.now() - lastModifiedMs;
      if (idleMs > this.timeoutMs) {
        this.stopPolling();
        await this.onTimeout();
      }
    } catch {
      // 文件不存在时跳过
    }
  }

  isTimedOut(): boolean {
    return Date.now() - this.startTime > this.timeoutMs;
  }

  async onStop(reason?: string): Promise<void> {
    this.stopPolling();
    await this.updateStatus('IDLE', reason ?? 'session_ended');
  }

  async onTimeout(): Promise<void> {
    await this.updateStatus('IDLE', 'timeout');
  }

  private async updateStatus(status: string, reason: string): Promise<void> {
    let content: string;
    try {
      content = await fs.readFile(this.activeContextFile, 'utf-8');
    } catch {
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
