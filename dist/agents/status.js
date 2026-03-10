/**
 * Agent 状态追踪器
 * 集成进度显示到 Agent 执行流程
 */
import { AgentStatusIndicator } from '../cli/progress/index.js';
export class AgentStatusTracker {
    indicator = new AgentStatusIndicator();
    tasks = new Map();
    register(id, name) {
        this.tasks.set(id, { id, name, status: 'idle' });
        this.indicator.add(name, 'idle');
    }
    start(id) {
        const task = this.tasks.get(id);
        if (task) {
            task.status = 'running';
            task.startTime = Date.now();
            this.indicator.update(task.name, 'running');
        }
    }
    complete(id) {
        const task = this.tasks.get(id);
        if (task) {
            task.status = 'completed';
            task.endTime = Date.now();
            this.indicator.update(task.name, 'completed');
        }
    }
    fail(id) {
        const task = this.tasks.get(id);
        if (task) {
            task.status = 'failed';
            task.endTime = Date.now();
            this.indicator.update(task.name, 'failed');
        }
    }
    render() {
        this.indicator.render();
    }
    getSummary() {
        return this.indicator.summary();
    }
}
//# sourceMappingURL=status.js.map