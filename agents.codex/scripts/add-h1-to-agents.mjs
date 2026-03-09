#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const dir = 'agents.codex';
const files = readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'AGENTS.md' && f !== 'CONVERSION-GUIDE.md');

for (const file of files) {
  const path = join(dir, file);
  let content = readFileSync(path, 'utf-8');
  const lines = content.split('\n');

  let inFrontmatter = false;
  let frontmatterEnd = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else {
        frontmatterEnd = i;
        break;
      }
    }
  }

  if (frontmatterEnd > 0) {
    const afterFrontmatter = lines.slice(frontmatterEnd + 1);
    const firstNonEmpty = afterFrontmatter.findIndex(l => l.trim() !== '');

    if (firstNonEmpty >= 0 && afterFrontmatter[firstNonEmpty].startsWith('## ')) {
      const name = file.replace('.md', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      lines.splice(frontmatterEnd + 1, 0, '', `# ${name}`, '');
      writeFileSync(path, lines.join('\n'));
      console.log(`Fixed: ${file}`);
    }
  }
}
