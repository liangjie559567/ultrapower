import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const KEEP_CONSOLE = [
  'stats.ts', 'cost.ts', 'sessions.ts', 'teleport.ts', 'wait.ts', 'backfill.ts',
  'dashboard.ts', 'example.ts', 'test-categories.ts', 'tutorial',
];

function walkDir(dir: string, files: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (!entry.includes('__tests__') && !entry.includes('node_modules')) {
        walkDir(path, files);
      }
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      files.push(path);
    }
  }
  return files;
}

function shouldMigrate(filePath: string): boolean {
  const name = filePath.split('\\').pop() || '';
  const dir = filePath.split('\\').slice(-2, -1)[0] || '';
  return !KEEP_CONSOLE.some(keep => name === keep || dir === keep || filePath.includes(keep));
}

function getContextName(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/');
  const fileName = parts[parts.length - 1].replace('.ts', '');
  const dirName = parts[parts.length - 2];
  return `${dirName}:${fileName}`;
}

function migrateFile(filePath: string): { changed: boolean; before: number; after: number } {
  let content = readFileSync(filePath, 'utf-8');
  const beforeCount = (content.match(/console\.(log|error|warn|info)/g) || []).length;

  if (beforeCount === 0) return { changed: false, before: 0, after: 0 };

  const hasLogger = content.includes('createLogger') || content.includes('from \'../lib/unified-logger');

  if (!hasLogger) {
    const importMatch = content.match(/^(import .+;\n)+/m);
    const contextName = getContextName(filePath);
    const depth = filePath.split('\\').length - 2;
    const prefix = '../'.repeat(depth);
    const loggerImport = `import { createLogger } from '${prefix}lib/unified-logger.js';\nconst logger = createLogger('${contextName}');\n\n`;

    if (importMatch) {
      content = content.replace(importMatch[0], importMatch[0] + loggerImport);
    } else {
      content = loggerImport + content;
    }
  }

  content = content.replace(/console\.log\(/g, 'logger.info(');
  content = content.replace(/console\.error\(/g, 'logger.error(');
  content = content.replace(/console\.warn\(/g, 'logger.warn(');
  content = content.replace(/console\.info\(/g, 'logger.info(');

  const afterCount = (content.match(/console\.(log|error|warn|info)/g) || []).length;

  if (beforeCount !== afterCount) {
    writeFileSync(filePath, content, 'utf-8');
    return { changed: true, before: beforeCount, after: afterCount };
  }

  return { changed: false, before: beforeCount, after: afterCount };
}

const files = walkDir('src');
let totalBefore = 0;
let totalAfter = 0;
let filesChanged = 0;

for (const file of files) {
  if (shouldMigrate(file)) {
    const result = migrateFile(file);
    if (result.changed) {
      filesChanged++;
      console.log(`✓ ${file}: ${result.before} → ${result.after}`);
    }
    totalBefore += result.before;
    totalAfter += result.after;
  }
}

console.log(`\n迁移完成: ${filesChanged} 个文件, ${totalBefore} → ${totalAfter} console 调用`);
