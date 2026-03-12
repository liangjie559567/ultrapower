/**
 * Agent 状态追踪器
 * 集成进度显示到 Agent 执行流程
 */
import { type AgentStatus } from '../cli/progress/index.js';
export interface AgentTask {
    id: string;
    name: string;
    status: AgentStatus;
    startTime?: number;
    endTime?: number;
}
export declare class AgentStatusTracker {
    private indicator;
    private tasks;
    register(id: string, name: string): void;
    start(id: string): void;
    complete(id: string): void;
    fail(id: string): void;
    render(): void;
    getSummary(): {
        total: number;
        completed: number;
        failed: number;
        running: number;
    };
}
//# sourceMappingURL=status.d.ts.map