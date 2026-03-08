import * as fs from 'fs/promises';
import * as path from 'path';
import { createDocFromTemplate } from '../doc-manager.js';
export async function executeTestingLoop(workingDir, maxRounds) {
    const docsDir = path.join(workingDir, '.ccg', 'docs');
    for (let round = 1; round <= maxRounds; round++) {
        const testDoc = await createDocFromTemplate('test-checklist', {
            round: round.toString(),
            date: new Date().toISOString().split('T')[0],
        });
        await fs.writeFile(path.join(docsDir, `test-round-${round}.md`), testDoc);
        if (testDoc.includes('全部通过')) {
            break;
        }
    }
}
//# sourceMappingURL=phase-testing.js.map