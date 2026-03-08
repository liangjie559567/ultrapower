#!/usr/bin/env node
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const skillsDir = 'skills';
const errors = [];

const dirs = readdirSync(skillsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

for (const dir of dirs) {
  const skillPath = join(skillsDir, dir, 'SKILL.md');
  try {
    const content = readFileSync(skillPath, 'utf-8');

    if (!content.startsWith('---')) {
      errors.push(`${dir}: Missing frontmatter`);
      continue;
    }

    const frontmatterEnd = content.indexOf('---', 3);
    if (frontmatterEnd === -1) {
      errors.push(`${dir}: Unclosed frontmatter`);
      continue;
    }

    const frontmatter = content.slice(3, frontmatterEnd);

    if (!frontmatter.includes('name:')) {
      errors.push(`${dir}: Missing 'name' field`);
    }
    if (!frontmatter.includes('description:')) {
      errors.push(`${dir}: Missing 'description' field`);
    }
  } catch (err) {
    errors.push(`${dir}: ${err.message}`);
  }
}

if (errors.length > 0) {
  console.error('❌ Skill frontmatter validation failed:\n');
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

console.log(`✅ All ${dirs.length} skills have valid frontmatter`);
