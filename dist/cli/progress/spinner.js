/**
 * 简单的 CLI 进度指示器
 */
export class Spinner {
    frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    interval;
    frameIndex = 0;
    text = '';
    start(text) {
        this.text = text;
        this.frameIndex = 0;
        this.interval = setInterval(() => {
            process.stdout.write(`\r${this.frames[this.frameIndex]} ${this.text}`);
            this.frameIndex = (this.frameIndex + 1) % this.frames.length;
        }, 80);
    }
    update(text) {
        this.text = text;
    }
    stop(status, finalText) {
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
//# sourceMappingURL=spinner.js.map