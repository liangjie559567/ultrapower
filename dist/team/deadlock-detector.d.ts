/**
 * 死锁检测器 - 使用 DFS 检测依赖循环
 */
import { DependencyGraph } from './dependency-graph.js';
export interface DeadlockResult {
    hasDeadlock: boolean;
    cycle?: string[];
}
export declare class DeadlockDetector {
    /**
     * 检测依赖图中的循环
     */
    detect(graph: DependencyGraph): DeadlockResult;
    private dfs;
}
//# sourceMappingURL=deadlock-detector.d.ts.map