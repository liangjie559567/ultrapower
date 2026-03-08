import * as fs from 'fs/promises';
import * as path from 'path';

export async function executeDevelopmentPhase(workingDir: string): Promise<void> {
  const docsDir = path.join(workingDir, '.ccg', 'docs');
  const requirementsPath = path.join(docsDir, 'requirements.md');
  const techDesignPath = path.join(docsDir, 'tech-design.md');

  await fs.access(requirementsPath);
  await fs.access(techDesignPath);
}
