/**
 * Hook Dependency Analyzer
 *
 * 分析 Hook 间的依赖关系，生成 DAG 用于并行化优化
 */
export interface HookDependency {
    hookType: string;
    reads: string[];
    writes: string[];
    callsTools: string[];
}
export interface DependencyGraph {
    nodes: HookDependency[];
    edges: Array<{
        from: string;
        to: string;
        reason: string;
    }>;
    parallelGroups: string[][];
    serialChains: string[][];
}
export declare class DependencyAnalyzer {
    private dependencies;
    constructor(dependencies?: HookDependency[]);
    analyze(): DependencyGraph;
    private buildEdges;
    private pathMatches;
    private findParallelGroups;
    private findSerialChains;
    private buildChain;
}
//# sourceMappingURL=dependency-analyzer.d.ts.map