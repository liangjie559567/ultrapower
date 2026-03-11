import { createLogger } from '../../lib/unified-logger.js';
const logger = createLogger('progress:agent-status');
export class AgentStatusIndicator {
    agents = new Map();
    add(name, status = 'idle') {
        this.agents.set(name, { name, status });
    }
    update(name, status, progress) {
        const agent = this.agents.get(name);
        if (agent) {
            agent.status = status;
            agent.progress = progress;
        }
    }
    render() {
        const symbols = {
            idle: '○',
            running: '◉',
            completed: '✓',
            failed: '✗',
            timeout: '⏱'
        };
        logger.info('\nAgent Status:');
        for (const agent of this.agents.values()) {
            const symbol = symbols[agent.status];
            const progress = agent.progress ? ` - ${agent.progress}` : '';
            logger.info(`  ${symbol} ${agent.name} [${agent.status}]${progress}`);
        }
    }
    summary() {
        let completed = 0, failed = 0, running = 0;
        for (const agent of this.agents.values()) {
            if (agent.status === 'completed')
                completed++;
            else if (agent.status === 'failed' || agent.status === 'timeout')
                failed++;
            else if (agent.status === 'running')
                running++;
        }
        return { total: this.agents.size, completed, failed, running };
    }
}
//# sourceMappingURL=agent-status.js.map