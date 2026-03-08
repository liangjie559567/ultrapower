export class ErrorMatcher {
    patterns = [
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
    match(error) {
        return this.patterns.find(p => p.regex.test(error)) || null;
    }
    matchAll(error) {
        return this.patterns.filter(p => p.regex.test(error));
    }
}
//# sourceMappingURL=error-matcher.js.map