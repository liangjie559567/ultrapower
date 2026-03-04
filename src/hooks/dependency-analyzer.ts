/**
 * Hook Dependency Analyzer
 *
 * 分析 Hook 间的依赖关系，生成 DAG 用于并行化优化
 */

export interface HookDependency {
  hookType: string;
  reads: string[];      // 读取的状态文件/环境变量
  writes: string[];     // 写入的状态文件/环境变量
  callsTools: string[]; // 调用的工具
}

export interface DependencyGraph {
  nodes: HookDependency[];
  edges: Array<{ from: string; to: string; reason: string }>;
  parallelGroups: string[][];
  serialChains: string[][];
}

const HOOK_DEPENDENCIES: HookDependency[] = [
  {
    hookType: 'pre-tool-use',
    reads: [],
    writes: [],
    callsTools: [],
  },
  {
    hookType: 'post-tool-use',
    reads: [],
    writes: ['.omc/state/last-tool-error.json'],
    callsTools: [],
  },
  {
    hookType: 'permission-request',
    reads: [],
    writes: [],
    callsTools: [],
  },
  {
    hookType: 'setup-init',
    reads: [],
    writes: ['.omc/notepad.md', '.omc/project-memory.json'],
    callsTools: ['notepad_read', 'project_memory_read'],
  },
  {
    hookType: 'setup-maintenance',
    reads: ['.omc/notepad.md'],
    writes: [],
    callsTools: ['notepad_prune'],
  },
  {
    hookType: 'session-end',
    reads: ['.omc/state/*.json'],
    writes: [],
    callsTools: ['state_clear'],
  },
  {
    hookType: 'keyword-detector',
    reads: [],
    writes: [],
    callsTools: [],
  },
  {
    hookType: 'autopilot',
    reads: ['.omc/state/autopilot-state.json'],
    writes: ['.omc/state/autopilot-state.json'],
    callsTools: ['state_read', 'state_write'],
  },
  {
    hookType: 'ralph',
    reads: ['.omc/state/ralph-state.json'],
    writes: ['.omc/state/ralph-state.json'],
    callsTools: ['state_read', 'state_write'],
  },
  {
    hookType: 'ultrawork',
    reads: ['.omc/state/ultrawork-state.json'],
    writes: ['.omc/state/ultrawork-state.json'],
    callsTools: ['state_read', 'state_write'],
  },
  {
    hookType: 'learner',
    reads: [],
    writes: ['skills/*.md'],
    callsTools: [],
  },
  {
    hookType: 'recovery',
    reads: ['.omc/state/last-tool-error.json'],
    writes: [],
    callsTools: [],
  },
  {
    hookType: 'rules-injector',
    reads: ['templates/rules/*.md'],
    writes: [],
    callsTools: [],
  },
  {
    hookType: 'think-mode',
    reads: [],
    writes: [],
    callsTools: [],
  },
];

export class DependencyAnalyzer {
  private dependencies: HookDependency[];

  constructor(dependencies: HookDependency[] = HOOK_DEPENDENCIES) {
    this.dependencies = dependencies;
  }

  analyze(): DependencyGraph {
    const edges = this.buildEdges();
    const parallelGroups = this.findParallelGroups(edges);
    const serialChains = this.findSerialChains(edges);

    return {
      nodes: this.dependencies,
      edges,
      parallelGroups,
      serialChains,
    };
  }

  private buildEdges(): Array<{ from: string; to: string; reason: string }> {
    const edges: Array<{ from: string; to: string; reason: string }> = [];

    for (const hook1 of this.dependencies) {
      for (const hook2 of this.dependencies) {
        if (hook1.hookType === hook2.hookType) continue;

        // 写后读依赖
        for (const write of hook1.writes) {
          if (hook2.reads.some(r => this.pathMatches(r, write))) {
            edges.push({
              from: hook1.hookType,
              to: hook2.hookType,
              reason: `write-read: ${write}`,
            });
          }
        }

        // 写后写依赖
        for (const write of hook1.writes) {
          if (hook2.writes.some(w => this.pathMatches(w, write))) {
            edges.push({
              from: hook1.hookType,
              to: hook2.hookType,
              reason: `write-write: ${write}`,
            });
          }
        }
      }
    }

    return edges;
  }

  private pathMatches(pattern: string, path: string): boolean {
    if (pattern === path) return true;
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(path);
    }
    return false;
  }

  private findParallelGroups(edges: Array<{ from: string; to: string }>): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();

    for (const hook of this.dependencies) {
      if (processed.has(hook.hookType)) continue;

      const group = [hook.hookType];
      processed.add(hook.hookType);

      for (const other of this.dependencies) {
        if (processed.has(other.hookType)) continue;

        const hasEdge = edges.some(
          e => (e.from === hook.hookType && e.to === other.hookType) ||
               (e.from === other.hookType && e.to === hook.hookType)
        );

        if (!hasEdge) {
          group.push(other.hookType);
          processed.add(other.hookType);
        }
      }

      if (group.length > 1) {
        groups.push(group);
      }
    }

    return groups;
  }

  private findSerialChains(edges: Array<{ from: string; to: string }>): string[][] {
    const chains: string[][] = [];
    const visited = new Set<string>();

    for (const hook of this.dependencies) {
      if (visited.has(hook.hookType)) continue;

      const chain = this.buildChain(hook.hookType, edges, visited);
      if (chain.length > 1) {
        chains.push(chain);
      }
    }

    return chains;
  }

  private buildChain(
    start: string,
    edges: Array<{ from: string; to: string }>,
    visited: Set<string>
  ): string[] {
    const chain = [start];
    visited.add(start);

    let current = start;
    while (true) {
      const next = edges.find(e => e.from === current && !visited.has(e.to));
      if (!next) break;

      chain.push(next.to);
      visited.add(next.to);
      current = next.to;
    }

    return chain;
  }
}
