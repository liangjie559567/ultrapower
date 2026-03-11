/**
 * 进度显示使用示例
 */
import { Spinner, ProgressBar } from './index.js';
import { AgentStatusTracker } from '../../agents/status.js';
import { createLogger } from '../../lib/unified-logger.js';
const logger = createLogger('progress:examples');
// 示例 1: 简单 Spinner
export function exampleSpinner() {
    const spinner = new Spinner();
    spinner.start('Loading agents...');
    setTimeout(() => {
        spinner.update('Processing tasks...');
    }, 1000);
    setTimeout(() => {
        spinner.stop('success', 'All agents loaded');
    }, 2000);
}
// 示例 2: 进度条
export function exampleProgressBar() {
    const bar = new ProgressBar({ total: 10 });
    let current = 0;
    const interval = setInterval(() => {
        current++;
        bar.update(current, `Processing item ${current}`);
        if (current >= 10) {
            clearInterval(interval);
        }
    }, 200);
}
// 示例 3: Agent 状态追踪
export function exampleAgentStatus() {
    const tracker = new AgentStatusTracker();
    tracker.register('agent-1', 'test-optimizer');
    tracker.register('agent-2', 'hooks-refactor');
    tracker.register('agent-3', 'cli-optimizer');
    tracker.start('agent-1');
    tracker.start('agent-2');
    setTimeout(() => {
        tracker.complete('agent-1');
        tracker.start('agent-3');
        tracker.render();
    }, 1000);
    setTimeout(() => {
        tracker.complete('agent-2');
        tracker.complete('agent-3');
        tracker.render();
        const summary = tracker.getSummary();
        logger.info(`\nCompleted: ${summary.completed}/${summary.total}`);
    }, 2000);
}
//# sourceMappingURL=examples.js.map