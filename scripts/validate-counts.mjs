#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

const fix = process.argv.includes('--fix');

const countFiles = (dir, filter = () => true) => {
  try {
    return readdirSync(dir).filter(f => {
      try {
        return statSync(join(dir, f)).isFile() && filter(f);
      } catch { return false; }
    }).length;
  } catch { return 0; }
};

const countDirs = (dir, exclude = []) => {
  try {
    return readdirSync(dir).filter(f => {
      if (exclude.includes(f)) return false;
      try {
        return statSync(join(dir, f)).isDirectory();
      } catch { return false; }
    }).length;
  } catch { return 0; }
};

const countExports = (file) => {
  try {
    const content = readFileSync(file, 'utf8');
    const matches = content.match(/export\s+(const|function|class)\s+\w+/g);
    return matches ? matches.length : 0;
  } catch { return 0; }
};

const updateDoc = (file, pattern, newValue) => {
  try {
    let content = readFileSync(file, 'utf8');
    const updated = content.replace(pattern, (match, prefix) => `${prefix}${newValue}`);
    if (content !== updated) {
      writeFileSync(file, updated, 'utf8');
      return true;
    }
  } catch {}
  return false;
};

try {
  const counts = {
    agents: countFiles('agents', f => f.endsWith('.md') && f !== 'AGENTS.md'),
    skills: countDirs('skills'),
    hooks: countDirs('src/hooks', ['__tests__']),
    tools: countExports('src/tools/index.ts')
  };

  console.log('📊 Actual counts:\n');
  console.log(`  Agents: ${counts.agents}`);
  console.log(`  Skills: ${counts.skills}`);
  console.log(`  Hooks:  ${counts.hooks}`);
  console.log(`  Tools:  ${counts.tools}\n`);

  const docs = ['AGENTS.md', 'README.md', 'docs/REFERENCE.md'];
  const patterns = {
    agents: /(\*\*\d+\+?\s+agents?\*\*|\d+\+?\s+specialized agents?)/gi,
    skills: /(\*\*\d+\+?\s+skills?\*\*|\d+\+?\s+built-in skills?)/gi,
    hooks: /(\*\*\d+\+?\s+hook types?\*\*|\d+\+?\s+hook events?)/gi,
    tools: /(\*\*\d+\+?\s+tools?\*\*|\d+\+?\s+MCP tools?)/gi
  };

  let diffs = 0;

  for (const doc of docs) {
    try {
      const content = readFileSync(doc, 'utf8');

      for (const [key, pattern] of Object.entries(patterns)) {
        const matches = content.match(pattern);
        if (matches) {
          for (const match of matches) {
            const num = parseInt(match.match(/\d+/)[0]);
            if (num !== counts[key]) {
              console.log(`⚠️  ${doc}: ${key} shows ${num}, actual is ${counts[key]}`);
              diffs++;

              if (fix) {
                const newMatch = match.replace(/\d+/, counts[key]);
                if (updateDoc(doc, new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), newMatch)) {
                  console.log(`   ✓ Fixed`);
                }
              }
            }
          }
        }
      }
    } catch {}
  }

  if (diffs === 0) {
    console.log('✅ All counts match!\n');
  } else {
    console.log(`\n${fix ? '✅' : '📋'} Found ${diffs} difference(s)${fix ? ' and fixed them' : ''}\n`);
    if (!fix) console.log('Run with --fix to update automatically\n');
  }

} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
