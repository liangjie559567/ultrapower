#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const dirs = ['agents.codex'];

for (const dir of dirs) {
  const files = readdirSync(dir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const path = join(dir, file);
    let content = readFileSync(path, 'utf-8');

    const lines = content.split('\n');
    let inFrontmatter = false;
    let frontmatterEnd = 0;

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

    let body = lines.slice(frontmatterEnd + 1).join('\n');

    // Replace **heading** with ## heading
    body = body.replace(/^\*\*([^*]+)\*\*$/gm, '## $1');
    // Replace - with * in lists
    body = body.replace(/^(\s*)- /gm, '$1* ');
    // Add blank line before headings
    body = body.replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2');
    // Add blank line after headings
    body = body.replace(/(#{1,6} [^\n]+)\n([^\n#])/g, '$1\n\n$2');
    // Add blank line before lists
    body = body.replace(/([^\n])\n(\s*\* )/g, '$1\n\n$2');
    // Remove multiple consecutive blank lines
    body = body.replace(/\n{3,}/g, '\n\n');

    const fixed = lines.slice(0, frontmatterEnd + 1).join('\n') + '\n' + body;
    writeFileSync(path, fixed);
    console.log(`Fixed: ${path}`);
  }
}
