/**
 * session-watchdog.ts — 会话看门狗
 *
 * 注册 Stop 事件，检测会话超时并清理状态。
 */

import { promises as fs } from 'fs';
import * as path from 'path';

export interface WatchdogOptions {
  timeoutMs?: number;
  baseDir?: string;
}

export class SessionWatchdog {
  private readonly activeContextFile: string;
  private readonly timeoutMs: number;
  private startTime: number;

  constructor(options: WatchdogOptions = {}) {
    const base = options.baseDir ?? process.cwd();
    this.activeContextFile = path.join(base, '.omc', 'axiom', 'active_context.md');
    this.timeoutMs = options.timeoutMs ?? 3600_000; // 默认 1 小时
    this.startTime = Date.now();
  }

  isTimedOut(): boolean {
    return Date.now() - this.startTime > this.timeoutMs;
  }

  async onStop(reason?: string): Promise<void> {
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
