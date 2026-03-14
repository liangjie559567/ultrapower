#!/usr/bin/env node
/**
 * ultrapower Upgrade Script
 *
 * Handles complete upgrade workflow:
 * - Detects installation method (npm global, marketplace, local)
 * - Updates all components (dist, bridge, cache, config)
 * - Clears Claude Code caches
 * - Updates version metadata
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const CLAUDE_DIR = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');

function log(msg) {
  console.log(`[OMC Upgrade] ${msg}`);
}

function detectInstallMethod() {
  const installedPlugins = join(CLAUDE_DIR, 'plugins', 'installed_plugins.json');
  if (existsSync(installedPlugins)) {
    const data = JSON.parse(readFileSync(installedPlugins, 'utf-8'));
    const plugin = data.plugins?.['ultrapower@omc']?.[0];
    if (plugin) {
      if (plugin.installPath.includes('Desktop') || plugin.installPath.includes('dev')) {
        return 'local';
      }
      return 'marketplace';
    }
  }

  try {
    execSync('npm list -g @liangjie559567/ultrapower', { stdio: 'pipe' });
    return 'npm-global';
  } catch {
    return 'unknown';
  }
}

function getCurrentVersion() {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  return pkg.version;
}

function clearCaches() {
  log('Clearing caches...');

  const cachePaths = [
    join(CLAUDE_DIR, 'plugins', 'cache', 'omc'),
    join(CLAUDE_DIR, 'plugins', 'cache', 'liangjie559567'),
    join(CLAUDE_DIR, 'plugins', 'npm-cache'),
    join(ROOT, '.tsbuildinfo')
  ];

  for (const path of cachePaths) {
    if (existsSync(path)) {
      rmSync(path, { recursive: true, force: true });
      log(`  Cleared: ${path}`);
    }
  }
}

function rebuild() {
  log('Rebuilding project...');
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
}

function updateMetadata(version, installPath) {
  log('Updating metadata...');

  // Update .omc-version.json
  const versionFile = join(CLAUDE_DIR, '.omc-version.json');
  writeFileSync(versionFile, JSON.stringify({
    version,
    installedAt: new Date().toISOString(),
    installMethod: 'upgrade',
    lastCheckAt: new Date().toISOString()
  }, null, 2));

  // Update installed_plugins.json
  const installedFile = join(CLAUDE_DIR, 'plugins', 'installed_plugins.json');
  if (existsSync(installedFile)) {
    const data = JSON.parse(readFileSync(installedFile, 'utf-8'));
    if (!data.plugins) data.plugins = {};
    data.plugins['ultrapower@omc'] = [{
      scope: 'user',
      installPath,
      version,
      installedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }];
    writeFileSync(installedFile, JSON.stringify(data, null, 2));
  }
}

async function main() {
  log('Starting upgrade...');

  const method = detectInstallMethod();
  const version = getCurrentVersion();

  log(`Install method: ${method}`);
  log(`Target version: ${version}`);

  // Step 1: Clear caches
  clearCaches();

  // Step 2: Rebuild
  rebuild();

  // Step 3: Install based on method
  let installPath = ROOT;

  if (method === 'npm-global') {
    log('Installing globally...');
    execSync('npm install -g .', { cwd: ROOT, stdio: 'inherit' });
  } else if (method === 'marketplace') {
    log('Updating marketplace installation...');
    const marketplacePath = join(CLAUDE_DIR, 'plugins', 'marketplaces', 'omc');
    if (existsSync(marketplacePath)) {
      // Update package.json version
      const pkgPath = join(marketplacePath, 'package.json');
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        pkg.version = version;
        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      }
      // Update plugin.json version
      const pluginPath = join(marketplacePath, '.claude-plugin', 'plugin.json');
      if (existsSync(pluginPath)) {
        const plugin = JSON.parse(readFileSync(pluginPath, 'utf-8'));
        plugin.version = version;
        writeFileSync(pluginPath, JSON.stringify(plugin, null, 2));
      }
      log('  Updated marketplace files');
    }
  }

  // Step 4: Update metadata
  updateMetadata(version, installPath);

  log('✅ Upgrade complete!');
  log('Please restart Claude Code for changes to take effect.');
}

main().catch(err => {
  console.error('[OMC Upgrade] Error:', err);
  process.exit(1);
});
