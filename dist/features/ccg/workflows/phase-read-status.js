import { promises as fs } from 'fs';
import path from 'path';
export async function executeReadStatusPhase(workingDir) {
    const ccgDir = path.join(workingDir, '.omc', 'ccg');
    await fs.mkdir(ccgDir, { recursive: true });
    const featureFlowPath = path.join(ccgDir, 'feature-flow.md');
    const content = `# Feature Flow\n\n项目现状分析\n\n## 当前架构\n\n## 技术栈\n\n## 待改造点\n`;
    await fs.writeFile(featureFlowPath, content, 'utf-8');
}
//# sourceMappingURL=phase-read-status.js.map