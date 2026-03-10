/**
 * 简单的 CLI 进度指示器
 */

export type SpinnerStatus = 'running' | 'success' | 'error' | 'info';

export class Spinner {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private interval?: NodeJS.Timeout;
  private frameIndex = 0;
  private text = '';

  start(text: string): void {
    this.text = text;
    this.frameIndex = 0;

    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.frames[this.frameIndex]} ${this.text}`);
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
    }, 80);
  }

  update(text: string): void {
    this.text = text;
  }

  stop(status: SpinnerStatus, finalText?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }

    const symbols = {
      running: '⠿',
      success: '✓',
      error: '✗',
      info: 'ℹ'
    };

    process.stdout.write(`\r${symbols[status]} ${finalText || this.text}\n`);
  }
}
