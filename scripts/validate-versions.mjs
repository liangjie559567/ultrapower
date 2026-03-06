#!/usr/bin/env node
// scripts/validate-versions.mjs
// Validates version consistency across all version-bearing files

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const files = [
  { path: 'package.json', extract: (c) => JSON.parse(c).version },
  { path: '.claude-plugin/plugin.json', extract: (c) => JSON.parse(c).version },
  { path: '.claude-plugin/marketplace.json', extract: (c) => JSON.parse(c).plugins?.[0]?.version },
  { path: 'marketplace.json', extract: (c) => JSON.parse(c).version },
];

function validateVersions() {
  const versions = new Map();
  const errors = [];

  for (const { path, extract } of files) {
    try {
      const content = readFileSync(resolve(path), 'utf-8');
      const version = extract(content);
      if (!version) {
        errors.push(`${path}: version not found`);
        continue;
      }
      versions.set(path, version);
    } catch (err) {
      errors.push(`${path}: ${err.message}`);
    }
  }

  if (errors.length > 0) {
    console.error('Version validation failed:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  const uniqueVersions = new Set(versions.values());
  if (uniqueVersions.size > 1) {
    console.error('Version mismatch detected:');
    versions.forEach((v, p) => console.error(`  ${p}: ${v}`));
    process.exit(1);
  }

  const version = Array.from(uniqueVersions)[0];
  console.log(`✓ All versions in sync: ${version}`);
  return version;
}

if (import.meta.url.startsWith('file:') && process.argv[1]) {
  validateVersions();
}

export { validateVersions };
