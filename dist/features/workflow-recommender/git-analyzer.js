import { execSync } from 'child_process';
export class GitAnalyzer {
    static getModifiedFiles(cwd) {
        try {
            const output = execSync('git diff --name-only HEAD', { cwd, encoding: 'utf-8' });
            return output.trim().split('\n').filter(Boolean);
        }
        catch {
            return [];
        }
    }
    static getRecentCommits(cwd, count = 5) {
        try {
            const output = execSync(`git log -${count} --oneline`, { cwd, encoding: 'utf-8' });
            return output.trim().split('\n');
        }
        catch {
            return [];
        }
    }
}
//# sourceMappingURL=git-analyzer.js.map