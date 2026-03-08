#!/usr/bin/env node
// Validate plugin.json files for completeness and consistency
import { readFileSync } from 'fs';
import { resolve } from 'path';

const REQUIRED_FIELDS = ['name', 'version', 'statusline'];
const PLUGIN_FILES = [
  '.claude-plugin/plugin.json',
  '.cursor-plugin/plugin.json'
];

let hasErrors = false;

// Read package.json version
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const expectedVersion = pkg.version;

console.log(`Validating plugin configs against version ${expectedVersion}\n`);

for (const file of PLUGIN_FILES) {
  try {
    const config = JSON.parse(readFileSync(resolve(file), 'utf-8'));

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!config[field]) {
        console.error(`❌ ${file}: Missing required field "${field}"`);
        hasErrors = true;
      }
    }

    // Check version consistency
    if (config.version !== expectedVersion) {
      console.error(`❌ ${file}: Version mismatch (${config.version} !== ${expectedVersion})`);
      hasErrors = true;
    }

    // Check statusline config
    if (config.statusline && (!config.statusline.command || !config.statusline.args)) {
      console.error(`❌ ${file}: Invalid statusline config`);
      hasErrors = true;
    }

    if (!hasErrors) {
      console.log(`✓ ${file}`);
    }
  } catch (err) {
    console.error(`❌ ${file}: ${err.message}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\n❌ Plugin config validation failed');
  process.exit(1);
} else {
  console.log('\n✅ All plugin configs valid');
}
