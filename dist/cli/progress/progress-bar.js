/**
 * 简单的进度条
 */
export class ProgressBar {
    current = 0;
    total;
    width;
    constructor(options) {
        this.total = options.total;
        this.width = options.width || 40;
    }
    update(current, text) {
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
    increment(text) {
        this.update(this.current + 1, text);
    }
}
//# sourceMappingURL=progress-bar.js.map