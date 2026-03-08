import { z } from 'zod';
const ParallelOpportunitySchema = z.object({
    tasks: z.array(z.object({
        id: z.string(),
        dependencies: z.array(z.string()).optional()
    })).describe('Task list with dependencies')
});
export const parallelOpportunityDetectorTool = {
    name: 'parallel_detector',
    description: 'Analyze task dependency graph and recommend parallel strategies',
    schema: ParallelOpportunitySchema.shape,
    handler: async (args) => {
        try {
            const { tasks } = args;
            const graph = buildDependencyGraph(tasks);
            const phases = detectParallelPhases(graph);
            const recommendation = generateRecommendation(phases);
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(recommendation, null, 2)
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : String(error)}`
                    }],
                isError: true
            };
        }
    }
};
function buildDependencyGraph(tasks) {
    const graph = new Map();
    tasks.forEach(t => graph.set(t.id, t.dependencies || []));
    return graph;
}
function detectParallelPhases(graph) {
    const phases = [];
    const completed = new Set();
    while (completed.size < graph.size) {
        const ready = Array.from(graph.entries())
            .filter(([id, deps]) => !completed.has(id) && deps.every(d => completed.has(d)))
            .map(([id]) => id);
        if (ready.length === 0)
            break; // Cycle detected
        phases.push(ready);
        ready.forEach(id => completed.add(id));
    }
    return phases;
}
function generateRecommendation(phases) {
    return {
        totalPhases: phases.length,
        phases: phases.map((p, i) => ({
            phase: i + 1,
            parallelTasks: p,
            count: p.length
        })),
        strategy: phases.length > 1 ? 'team' : 'sequential'
    };
}
//# sourceMappingURL=parallel-opportunity-detector.js.map