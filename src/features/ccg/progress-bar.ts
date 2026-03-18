export class ProgressBar {
  private current = 0;
  private total = 0;
  private label = '';

  start(total: number, label: string): void {
    this.total = total;
    this.current = 0;
    this.label = label;
    this.render();
  }

  increment(step = 1): void {
    this.current = Math.min(this.current + step, this.total);
    this.render();
  }

  complete(): void {
    this.current = this.total;
    this.render();
    console.log('');
  }

  private render(): void {
    const percent = Math.floor((this.current / this.total) * 100);
    const filled = Math.floor(percent / 2);
    const bar = '█'.repeat(filled) + '░'.repeat(50 - filled);
    if (!process.stdout.destroyed) {
      process.stdout.write(`\r${this.label}: [${bar}] ${percent}%`);
    }
  }
}

export const progressBar = new ProgressBar();
