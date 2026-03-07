import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

let output;
try {
  output = execSync('npm run lint 2>&1', { encoding: 'utf-8' });
} catch (e) {
  output = e.stdout + e.stderr;
}
const lines = output.split('\n');

const fixes = new Map();
let currentFile = null;

for (const line of lines) {
  if (line.trim().endsWith('.ts') && !line.includes('test')) {
    currentFile = line.trim();
  } else if (currentFile && line.includes('no-unused-vars')) {
    const match = line.match(/(\d+):(\d+)\s+warning\s+'([^']+)'/);
    if (match) {
      const [, lineNum, , varName] = match;
      if (!fixes.has(currentFile)) fixes.set(currentFile, []);
      fixes.get(currentFile).push({ line: parseInt(lineNum), var: varName });
    }
  }
}

for (const [file, issues] of fixes) {
  try {
    let content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (const { line, var: varName } of issues) {
      const idx = line - 1;
      if (idx < lines.length) {
        lines[idx] = lines[idx].replace(
          new RegExp(`\\b${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`),
          `_${varName}`
        );
      }
    }

    writeFileSync(file, lines.join('\n'), 'utf-8');
    console.log(`Fixed ${issues.length} in ${file}`);
  } catch (e) {
    console.error(`Error fixing ${file}:`, e.message);
  }
}
