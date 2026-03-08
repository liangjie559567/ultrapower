/**
 * 死锁检测器 - 使用 DFS 检测依赖循环
 */
var VisitState;
(function (VisitState) {
    VisitState[VisitState["Unvisited"] = 0] = "Unvisited";
    VisitState[VisitState["Visiting"] = 1] = "Visiting";
    VisitState[VisitState["Visited"] = 2] = "Visited";
})(VisitState || (VisitState = {}));
export class DeadlockDetector {
    /**
     * 检测依赖图中的循环
     */
    detect(graph) {
        const nodes = graph.getNodes();
        const state = new Map();
        const path = [];
        for (const node of nodes) {
            state.set(node, VisitState.Unvisited);
        }
        for (const node of nodes) {
            if (state.get(node) === VisitState.Unvisited) {
                const cycle = this.dfs(node, graph, state, path);
                if (cycle) {
                    return { hasDeadlock: true, cycle };
                }
            }
        }
        return { hasDeadlock: false };
    }
    dfs(node, graph, state, path) {
        state.set(node, VisitState.Visiting);
        path.push(node);
        for (const dep of graph.getDependencies(node)) {
            const depState = state.get(dep);
            if (depState === VisitState.Visiting) {
                // 发现循环
                const cycleStart = path.indexOf(dep);
                return path.slice(cycleStart);
            }
            if (depState === VisitState.Unvisited) {
                const cycle = this.dfs(dep, graph, state, path);
                if (cycle)
                    return cycle;
            }
        }
        path.pop();
        state.set(node, VisitState.Visited);
        return null;
    }
}
//# sourceMappingURL=deadlock-detector.js.map