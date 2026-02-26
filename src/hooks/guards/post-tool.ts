/**
 * post-tool.ts — PostToolUse 守卫
 *
 * 注册 PostToolUse 事件，更新 .omc/axiom/active_context.md。
 */

import { promises as fs } from 'fs';
import * as path from 'path';

export interface PostToolContext {
  toolName: string;
  toolInput: Record<string, unknown>;
  toolResponse?: unknown;
  sessionId?: string;
}

export class PostToolGuard {
  private readonly activeContextFile: string;

  constructor(baseDir?: string) {
    const base = baseDir ?? process.cwd();
    this.activeContextFile = path.join(base, '.omc', 'axiom', 'active_context.md');
  }

  async onToolUse(ctx: PostToolContext): Promise<void> {
    const { toolName, toolInput } = ctx;

    // 记录文件写入操作
    if (toolName === 'Write' || toolName === 'Edit') {
      const filePath = String(toolInput['file_path'] ?? '');
      await this.appendActivity(`Tool: ${toolName} → ${filePath}`);
    }

    // 记录 Bash 命令
    if (toolName === 'Bash') {
      const cmd = String(toolInput['command'] ?? '').slice(0, 80);
      await this.appendActivity(`Tool: Bash → ${cmd}`);
    }
  }

  private async appendActivity(line: string): Promise<void> {
    let content: string;
    try {
      content = await fs.readFile(this.activeContextFile, 'utf-8');
    } catch {
      return; // 文件不存在时跳过
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const entry = `\n- [${timestamp}] ${line}`;

    // 在 ## Recent Activity 节追加
    if (content.includes('## Recent Activity')) {
      const updated = content.replace(
        /(## Recent Activity\n)/,
        `$1${entry}\n`
      );
      await fs.writeFile(this.activeContextFile, updated, 'utf-8');
    }
  }
}
