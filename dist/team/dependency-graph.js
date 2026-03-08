/**
 * 依赖图 - 用于死锁检测
 */
export class DependencyGraph {
    adjacencyList = new Map();
    /**
     * 添加节点
     */
    addNode(nodeId) {
        if (!this.adjacencyList.has(nodeId)) {
            this.adjacencyList.set(nodeId, new Set());
        }
    }
    /**
     * 添加依赖边：from 依赖 to
     */
    addEdge(from, to) {
        this.addNode(from);
        this.addNode(to);
        this.adjacencyList.get(from).add(to);
    }
    /**
     * 获取节点的所有依赖
     */
    getDependencies(nodeId) {
        return Array.from(this.adjacencyList.get(nodeId) || []);
    }
    /**
     * 获取所有节点
     */
    getNodes() {
        return Array.from(this.adjacencyList.keys());
    }
}
//# sourceMappingURL=dependency-graph.js.map