export interface ErrorPattern {
  name: string;
  regex: RegExp;
  category: string;
  solution: string;
}

export class ErrorMatcher {
  private patterns: ErrorPattern[] = [
    {
      name: 'TypeScript Error',
      regex: /TS\d+:/,
      category: 'typescript',
      solution: 'Run tsc --noEmit to see all errors'
    },
    {
      name: 'File Not Found',
      regex: /ENOENT|not found/i,
      category: 'filesystem',
      solution: 'Verify file path and permissions'
    },
    {
      name: 'Permission Denied',
      regex: /EACCES|permission denied/i,
      category: 'permissions',
      solution: 'Check file/directory permissions'
    },
    {
      name: 'Hook Timeout',
      regex: /timeout|exceeded/i,
      category: 'hook',
      solution: 'Increase timeout or optimize hook logic'
    },
    {
      name: 'Memory Error',
      regex: /out of memory|heap|memory/i,
      category: 'memory',
      solution: 'Reduce concurrent tasks or restart'
    }
  ];

  match(error: string): ErrorPattern | null {
    return this.patterns.find(p => p.regex.test(error)) || null;
  }

  matchAll(error: string): ErrorPattern[] {
    return this.patterns.filter(p => p.regex.test(error));
  }
}
