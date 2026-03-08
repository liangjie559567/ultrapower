import { ErrorMatcher } from './error-matcher.js';
export class SolutionSuggester {
    matcher = new ErrorMatcher();
    suggest(error) {
        const pattern = this.matcher.match(error);
        if (!pattern)
            return null;
        return {
            error: pattern.name,
            category: pattern.category,
            solution: pattern.solution,
            steps: this.getSteps(pattern.category)
        };
    }
    getSteps(category) {
        const steps = {
            typescript: [
                'Run: tsc --noEmit',
                'Check type definitions',
                'Fix type annotations'
            ],
            filesystem: [
                'Verify file path',
                'Check file permissions',
                'Ensure directory exists'
            ],
            permissions: [
                'Check file permissions: ls -la',
                'Update permissions if needed',
                'Verify user privileges'
            ],
            hook: [
                'Check hook logs',
                'Increase timeout setting',
                'Optimize hook logic'
            ],
            memory: [
                'Reduce concurrent tasks',
                'Clear cache',
                'Restart application'
            ]
        };
        return steps[category] || [];
    }
}
//# sourceMappingURL=solution-suggester.js.map