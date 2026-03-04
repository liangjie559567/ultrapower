import { ErrorMatcher } from './error-matcher.js';

export interface Suggestion {
  error: string;
  category: string;
  solution: string;
  steps: string[];
}

export class SolutionSuggester {
  private matcher = new ErrorMatcher();

  suggest(error: string): Suggestion | null {
    const pattern = this.matcher.match(error);
    if (!pattern) return null;

    return {
      error: pattern.name,
      category: pattern.category,
      solution: pattern.solution,
      steps: this.getSteps(pattern.category)
    };
  }

  private getSteps(category: string): string[] {
    const steps: Record<string, string[]> = {
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
