#!/usr/bin/env node
// scripts/bump-version.mjs
// 用法: node scripts/bump-version.mjs <new-version>
// 统一更新 package.json / plugin.json / marketplace.json 并校验一致性

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FILES = {
  pkg: resolve('package.json'),
  plugin: resolve('.claude-plugin/plugin.json'),
  marketplace: resolve('.claude-plugin/marketplace.json'),
};

export function readVersions() {
  const pkg = JSON.parse(readFileSync(FILES.pkg, 'utf-8'));
  const plugin = JSON.parse(readFileSync(FILES.plugin, 'utf-8'));
  const market = JSON.parse(readFileSync(FILES.marketplace, 'utf-8'));
  return {
    pkg: pkg.version,
    plugin: plugin.version,
    marketplace: market.plugins?.[0]?.version,
  };
}

export function assertVersionsSync() {
  const v = readVersions();
  const versions = Object.values(v);
  if (new Set(versions).size !== 1) {
    throw new Error(`Version mismatch: ${JSON.stringify(v)}`);
  }
  return versions[0];
}

export function bumpVersion(newVersion) {
  if (!/^\d+\.\d+\.\d+/.test(newVersion)) {
    throw new Error(`Invalid version format: ${newVersion}`);
  }
  // package.json
  const pkg = JSON.parse(readFileSync(FILES.pkg, 'utf-8'));
  pkg.version = newVersion;
  writeFileSync(FILES.pkg, JSON.stringify(pkg, null, 2) + '\n');

  // plugin.json
  const plugin = JSON.parse(readFileSync(FILES.plugin, 'utf-8'));
  plugin.version = newVersion;
  writeFileSync(FILES.plugin, JSON.stringify(plugin, null, 2) + '\n');

  // marketplace.json
  const market = JSON.parse(readFileSync(FILES.marketplace, 'utf-8'));
  for (const p of market.plugins ?? []) {
    p.version = newVersion;
    if (p.source) p.source.version = newVersion;
  }
  writeFileSync(FILES.marketplace, JSON.stringify(market, null, 2) + '\n');

  console.log(`Bumped all version files to ${newVersion}`);
}

// CLI
const newVersion = process.argv[2];
if (newVersion) {
  bumpVersion(newVersion);
} else {
  const v = readVersions();
  console.log('Current versions:', v);
  try { assertVersionsSync(); console.log('✓ All in sync'); }
  catch (e) { console.error('✗', e.message); process.exit(1); }
}
