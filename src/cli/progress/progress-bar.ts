/**
 * 简单的进度条
 */

export interface ProgressOptions {
  total: number;
  width?: number;
  format?: string;
}

export class ProgressBar {
  private current = 0;
  private readonly total: number;
  private readonly width: number;

  constructor(options: ProgressOptions) {
    this.total = options.total;
    this.width = options.width || 40;
  }

  update(current: number, text?: string): void {
    this.current = Math.min(current, this.total);
    const percent = Math.floor((this.current / this.total) * 100);
    const filled = Math.floor((this.current / this.total) * this.width);
    const empty = this.width - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const display = `[${bar}] ${percent}% (${this.current}/${this.total})`;

    process.stdout.write(`\r${display}${text ? ' ' + text : ''}`);

    if (this.current >= this.total) {
      process.stdout.write('\n');
    }
  }

  increment(text?: string): void {
    this.update(this.current + 1, text);
  }
}
