/**
 * 依赖图 - 用于死锁检测
 */
export declare class DependencyGraph {
    private adjacencyList;
    /**
     * 添加节点
     */
    addNode(nodeId: string): void;
    /**
     * 添加依赖边：from 依赖 to
     */
    addEdge(from: string, to: string): void;
    /**
     * 获取节点的所有依赖
     */
    getDependencies(nodeId: string): string[];
    /**
     * 获取所有节点
     */
    getNodes(): string[];
}
//# sourceMappingURL=dependency-graph.d.ts.map