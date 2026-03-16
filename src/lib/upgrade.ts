/**
 * Complete Upgrade Workflow
 * Handles all installation methods and cache clearing
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, rmSync, cpSync } from 'fs';
import { join } from 'path';
import { getConfigDir } from '../utils/config-dir.js';
import { getRuntimePackageVersion } from '../lib/version.js';

const CLAUDE_DIR = getConfigDir();

export interface UpgradeResult {
  success: boolean;
  version: string;
  method: string;
  message: string;
}

export async function performUpgrade(): Promise<UpgradeResult> {
  console.log('🚀 ultrapower Upgrade\n');

  const method = detectInstallMethod();
  const version = getRuntimePackageVersion();

  console.log(`📦 Install method: ${method}`);
  console.log(`🎯 Target version: ${version}\n`);

  // Step 1: Clear all caches
  clearAllCaches();

  // Step 2: Rebuild/reinstall based on method
  let installPath = '';

  if (method === 'npm-global') {
    console.log('📥 Updating npm global package...');
    execSync('npm update -g @liangjie559567/ultrapower', { stdio: 'inherit' });
    installPath = execSync('npm root -g', { encoding: 'utf-8' }).trim() + '/@liangjie559567/ultrapower';
  } else if (method === 'local') {
    console.log('🔨 Rebuilding local installation...');
    const cwd = process.cwd();
    const tsbuildinfo = join(cwd, '.tsbuildinfo');
    if (existsSync(tsbuildinfo)) {
      rmSync(tsbuildinfo, { force: true });
    }
    execSync('npm run build', { cwd, stdio: 'inherit' });
    execSync('npm install -g .', { cwd, stdio: 'inherit' });
    installPath = cwd;
  }

  // Step 3: Update metadata
  console.log('📝 Updating metadata...');
  updateAllMetadata(version, installPath);

  // Step 4: Refresh hooks
  console.log('🔄 Refreshing hooks...');
  refreshHooks(installPath);

  return {
    success: true,
    version,
    method,
    message: 'Upgrade complete. Please restart Claude Code.'
  };
}

function detectInstallMethod(): 'npm-global' | 'local' | 'marketplace' {
  const installed = join(CLAUDE_DIR, 'plugins', 'installed_plugins.json');
  if (existsSync(installed)) {
    const data = JSON.parse(readFileSync(installed, 'utf-8'));
    const plugin = data.plugins?.['ultrapower@omc']?.[0];
    if (plugin?.installPath?.includes('node_modules')) return 'npm-global';
    if (!plugin?.installPath?.includes('cache')) return 'local';
  }
  return 'marketplace';
}

function clearAllCaches(): void {
  console.log('🧹 Clearing caches...');
  [
    join(CLAUDE_DIR, 'plugins', 'cache', 'omc'),
    join(CLAUDE_DIR, 'plugins', 'cache', 'liangjie559567'),
    join(CLAUDE_DIR, 'plugins', 'npm-cache'),
    join(process.cwd(), '.tsbuildinfo')
  ].forEach(p => {
    if (existsSync(p)) {
      rmSync(p, { recursive: true, force: true });
      console.log(`  ✓ ${p}`);
    }
  });
}

function updateAllMetadata(version: string, installPath: string): void {
  const timestamp = new Date().toISOString();

  writeFileSync(join(CLAUDE_DIR, '.omc-version.json'), JSON.stringify({
    version,
    installedAt: timestamp,
    installMethod: 'upgrade',
    lastCheckAt: timestamp
  }, null, 2));

  const installedFile = join(CLAUDE_DIR, 'plugins', 'installed_plugins.json');
  if (existsSync(installedFile)) {
    const data = JSON.parse(readFileSync(installedFile, 'utf-8'));
    data.plugins = data.plugins || {};
    data.plugins['ultrapower@omc'] = [{
      scope: 'user',
      installPath,
      version,
      installedAt: timestamp,
      lastUpdated: timestamp
    }];
    writeFileSync(installedFile, JSON.stringify(data, null, 2));
  }

  const marketplaceFile = join(CLAUDE_DIR, 'plugins', 'marketplace.json');
  writeFileSync(marketplaceFile, JSON.stringify({
    version: 2,
    marketplaces: {
      omc: {
        name: 'ultrapower',
        displayName: 'ultrapower',
        version,
        description: 'Disciplined multi-agent orchestration: workflow enforcement + parallel execution',
        author: 'liangjie559567',
        homepage: 'https://github.com/liangjie559567/ultrapower#readme',
        repository: 'git+https://github.com/liangjie559567/ultrapower.git',
        installPath,
        lastUpdated: timestamp
      }
    }
  }, null, 2));
}

function refreshHooks(installPath: string): void {
  const hooksSource = join(installPath, 'hooks');
  const hooksTarget = join(CLAUDE_DIR, 'hooks');
  if (existsSync(hooksSource)) {
    cpSync(hooksSource, hooksTarget, { recursive: true, force: true });
  }
}
