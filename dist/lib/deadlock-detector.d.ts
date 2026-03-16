/**
 * 死锁检测器 - 使用 DFS 检测依赖循环
 * 生产级实现，包含日志记录和阈值控制
 */
export declare const DEADLOCK_CHECK_THRESHOLD = 3;
export interface DeadlockResult {
    hasDeadlock: boolean;
    cycle?: string[];
}
export declare class DependencyGraph {
    private adjacencyList;
    addNode(nodeId: string): void;
    addEdge(from: string, to: string): void;
    getDependencies(nodeId: string): string[];
    getNodes(): string[];
}
export declare class DeadlockDetector {
    detect(graph: DependencyGraph): DeadlockResult;
    private dfs;
}
//# sourceMappingURL=deadlock-detector.d.ts.map