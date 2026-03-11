import { createLogger } from '../../lib/unified-logger.js';
const logger = createLogger('ccg:progress-bar');
export class ProgressBar {
    current = 0;
    total = 0;
    label = '';
    start(total, label) {
        this.total = total;
        this.current = 0;
        this.label = label;
        this.render();
    }
    increment(step = 1) {
        this.current = Math.min(this.current + step, this.total);
        this.render();
    }
    complete() {
        this.current = this.total;
        this.render();
        logger.info('');
    }
    render() {
        const percent = Math.floor((this.current / this.total) * 100);
        const filled = Math.floor(percent / 2);
        const bar = '█'.repeat(filled) + '░'.repeat(50 - filled);
        process.stdout.write(`\r${this.label}: [${bar}] ${percent}%`);
    }
}
export const progressBar = new ProgressBar();
//# sourceMappingURL=progress-bar.js.map