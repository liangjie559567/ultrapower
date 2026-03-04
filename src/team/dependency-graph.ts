/**
 * 依赖图 - 用于死锁检测
 */

export class DependencyGraph {
  private adjacencyList = new Map<string, Set<string>>();

  /**
   * 添加节点
   */
  addNode(nodeId: string): void {
    if (!this.adjacencyList.has(nodeId)) {
      this.adjacencyList.set(nodeId, new Set());
    }
  }

  /**
   * 添加依赖边：from 依赖 to
   */
  addEdge(from: string, to: string): void {
    this.addNode(from);
    this.addNode(to);
    this.adjacencyList.get(from)!.add(to);
  }

  /**
   * 获取节点的所有依赖
   */
  getDependencies(nodeId: string): string[] {
    return Array.from(this.adjacencyList.get(nodeId) || []);
  }

  /**
   * 获取所有节点
   */
  getNodes(): string[] {
    return Array.from(this.adjacencyList.keys());
  }
}
