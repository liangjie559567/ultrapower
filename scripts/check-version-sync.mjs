#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join } from 'path';

const files = [
  { path: 'package.json', extract: (c) => JSON.parse(c).version },
  { path: 'marketplace.json', extract: (c) => JSON.parse(c).version },
  { path: 'docs/CLAUDE.md', extract: (c) => c.match(/OMC:VERSION:(\S+)/)?.[1] },
  { path: 'CLAUDE.md', extract: (c) => c.match(/ultrapower v(\S+)/)?.[1] }
];

const versions = files.map(({ path, extract }) => {
  try {
    const content = readFileSync(path, 'utf-8');
    return { path, version: extract(content) };
  } catch (e) {
    return { path, version: null, error: e.message };
  }
});

const reference = versions[0].version;
const mismatches = versions.filter(v => v.version !== reference);

if (mismatches.length > 0) {
  console.error('❌ Version mismatch detected:');
  console.error(`   Reference: ${reference} (package.json)`);
  mismatches.forEach(({ path, version }) => {
    console.error(`   ${path}: ${version || 'NOT FOUND'}`);
  });
  process.exit(1);
}

console.log(`✅ All versions synchronized: ${reference}`);
