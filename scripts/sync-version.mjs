#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const dryRun = process.argv.includes('--dry-run');

const files = [
  'AGENTS.md',
  'README.md',
  'docs/CLAUDE.md',
  '.claude/CLAUDE.md',
  'CLAUDE.md',
  'docs/standards/README.md',
  'docs/REFERENCE.md',
  'docs/INSTALL.md',
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  '.cursor-plugin/plugin.json',
  'marketplace.json',
  'packages/mcp-server/package.json'
];

const versionPatterns = [
  /ultrapower v\d+\.\d+\.\d+/g,
  /version \d+\.\d+\.\d+/gi,
  /OMC:VERSION:\d+\.\d+\.\d+/g,
  /@version \d+\.\d+\.\d+/g
];

try {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const version = pkg.version;

  console.log(`📦 Current version: ${version}\n`);

  let totalChanges = 0;

  for (const file of files) {
    try {
      const path = resolve(file);
      let content = readFileSync(path, 'utf8');
      let changed = false;
      let fileChanges = 0;

      for (const pattern of versionPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          for (const match of matches) {
            const updated = match.replace(/\d+\.\d+\.\d+/, version);
            if (match !== updated) {
              content = content.replace(match, updated);
              changed = true;
              fileChanges++;
            }
          }
        }
      }

      if (changed) {
        if (dryRun) {
          console.log(`✓ ${file} (${fileChanges} changes) [DRY RUN]`);
        } else {
          writeFileSync(path, content, 'utf8');
          console.log(`✓ ${file} (${fileChanges} changes)`);
        }
        totalChanges += fileChanges;
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  console.log(`\n${dryRun ? '📋' : '✅'} Total: ${totalChanges} version references ${dryRun ? 'would be' : ''} updated`);

} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
