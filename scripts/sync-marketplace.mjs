#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const marketplace = JSON.parse(readFileSync('.claude-plugin/marketplace.json', 'utf8'));
const plugin = JSON.parse(readFileSync('.claude-plugin/plugin.json', 'utf8'));

// 同步版本号
marketplace.plugins[0].version = pkg.version;
plugin.version = pkg.version;

writeFileSync('.claude-plugin/marketplace.json', JSON.stringify(marketplace, null, 2) + '\n');
writeFileSync('.claude-plugin/plugin.json', JSON.stringify(plugin, null, 2) + '\n');

console.log(`✅ Marketplace & plugin version synced to ${pkg.version}`);
