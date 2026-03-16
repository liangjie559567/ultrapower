/**
 * 死锁检测器 - 使用 DFS 检测依赖循环
 * 生产级实现，包含日志记录和阈值控制
 */

import { logger } from './logger.js';

export const DEADLOCK_CHECK_THRESHOLD = 3;

enum VisitState {
  Unvisited,
  Visiting,
  Visited,
}

export interface DeadlockResult {
  hasDeadlock: boolean;
  cycle?: string[];
}

export class DependencyGraph {
  private adjacencyList = new Map<string, Set<string>>();

  addNode(nodeId: string): void {
    if (!this.adjacencyList.has(nodeId)) {
      this.adjacencyList.set(nodeId, new Set());
    }
  }

  addEdge(from: string, to: string): void {
    this.addNode(from);
    this.addNode(to);
    this.adjacencyList.get(from)!.add(to);
  }

  getDependencies(nodeId: string): string[] {
    return Array.from(this.adjacencyList.get(nodeId) || []);
  }

  getNodes(): string[] {
    return Array.from(this.adjacencyList.keys());
  }
}

export class DeadlockDetector {
  detect(graph: DependencyGraph): DeadlockResult {
    const nodes = graph.getNodes();
    const state = new Map<string, VisitState>();
    const path: string[] = [];

    for (const node of nodes) {
      state.set(node, VisitState.Unvisited);
    }

    for (const node of nodes) {
      if (state.get(node) === VisitState.Unvisited) {
        const cycle = this.dfs(node, graph, state, path);
        if (cycle) {
          logger.warn('Deadlock detected', {
            agents: cycle,
            cyclePath: cycle.join(' → '),
          });
          return { hasDeadlock: true, cycle };
        }
      }
    }

    return { hasDeadlock: false };
  }

  private dfs(
    node: string,
    graph: DependencyGraph,
    state: Map<string, VisitState>,
    path: string[]
  ): string[] | null {
    state.set(node, VisitState.Visiting);
    path.push(node);

    for (const dep of graph.getDependencies(node)) {
      const depState = state.get(dep);

      if (depState === VisitState.Visiting) {
        const cycleStart = path.indexOf(dep);
        return path.slice(cycleStart);
      }

      if (depState === VisitState.Unvisited) {
        const cycle = this.dfs(dep, graph, state, path);
        if (cycle) return cycle;
      }
    }

    path.pop();
    state.set(node, VisitState.Visited);
    return null;
  }
}
