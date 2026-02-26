#!/usr/bin/env node
/**
 * Plugin Post-Install Setup
 *
 * Configures HUD statusline when plugin is installed.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, chmodSync, renameSync, rmSync, cpSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLAUDE_DIR = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
const HUD_DIR = join(CLAUDE_DIR, 'hud');
const SETTINGS_FILE = join(CLAUDE_DIR, 'settings.json');

console.log('[OMC] Running post-install setup...');

// Fix: flatten nested cache directories caused by installer wrapping content in plugin-name subdir.
// The installer places npm package contents under cache/.../VERSION/ultrapower/ instead of cache/.../VERSION/
// This function detects and fixes that by moving contents up one level.
function fixNestedCacheDir() {
  try {
    const pluginCacheBase = join(CLAUDE_DIR, 'plugins/cache/ultrapower/ultrapower');
    if (!existsSync(pluginCacheBase)) return;
    const versions = readdirSync(pluginCacheBase);
    for (const version of versions) {
      const versionDir = join(pluginCacheBase, version);
      const nestedDir = join(versionDir, 'ultrapower');
      if (!existsSync(nestedDir)) continue;
      // Check if the nested dir itself has the actual plugin content (skills/, dist/, etc.)
      const nestedContents = readdirSync(nestedDir);
      // If nested dir is empty (leftover from previous fix), just remove it
      if (nestedContents.length === 0) {
        rmSync(nestedDir, { recursive: true, force: true });
        console.log(`[OMC] Removed empty nested dir for version ${version}`);
        continue;
      }
      const hasPluginContent = nestedContents.some(f => ['skills', 'dist', 'agents', 'hooks'].includes(f));
      if (!hasPluginContent) continue;
      console.log(`[OMC] Fixing nested cache dir for version ${version}...`);
      // Move contents of nestedDir up to versionDir, then remove nestedDir
      for (const item of nestedContents) {
        const src = join(nestedDir, item);
        const dest = join(versionDir, item);
        if (!existsSync(dest)) {
          renameSync(src, dest);
        }
      }
      rmSync(nestedDir, { recursive: true, force: true });
      console.log(`[OMC] Fixed nested cache dir for version ${version}`);
    }
  } catch (e) {
    console.log('[OMC] Warning: Could not fix nested cache dir:', e.message);
  }
}

fixNestedCacheDir();

// Fix: npm install strips hidden directories (starting with '.'), so .claude-plugin/plugin.json
// is never extracted to the plugin cache. We recreate it directly in the plugin cache.
// The postinstall script runs from the npm-cache node_modules dir, so we must target the
// plugin cache path explicitly rather than relying on __dirname.
function fixMissingPluginJson() {
  try {
    const pluginRoot = dirname(__dirname);
    const pkgPath = join(pluginRoot, 'package.json');
    if (!existsSync(pkgPath)) return;
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const version = pkg.version || '0.0.0';

    const pluginJson = {
      name: 'ultrapower',
      description: pkg.description || '',
      version,
      author: pkg.author ? { name: typeof pkg.author === 'string' ? pkg.author : pkg.author.name } : undefined,
      homepage: pkg.homepage || '',
      repository: pkg.repository?.url || pkg.repository || '',
      license: pkg.license || 'MIT',
      keywords: pkg.keywords || [],
      skills: './skills/',
      mcpServers: './.mcp.json'
    };
    const pluginJsonStr = JSON.stringify(pluginJson, null, 2);

    // 1. Write to current install location (npm-cache node_modules dir)
    const localPluginJsonDir = join(pluginRoot, '.claude-plugin');
    const localPluginJsonPath = join(localPluginJsonDir, 'plugin.json');
    if (!existsSync(localPluginJsonPath)) {
      mkdirSync(localPluginJsonDir, { recursive: true });
      writeFileSync(localPluginJsonPath, pluginJsonStr);
      console.log('[OMC] Created .claude-plugin/plugin.json in install dir');
    }

    // 2. Write directly to plugin cache (marketplace: ultrapower, plugin: ultrapower)
    // Claude Code copies from npm-cache but skips hidden dirs, so we patch the cache directly.
    const pluginCacheBase = join(CLAUDE_DIR, 'plugins/cache/ultrapower/ultrapower');
    if (existsSync(pluginCacheBase)) {
      const versions = readdirSync(pluginCacheBase);
      for (const v of versions) {
        const cacheVersionDir = join(pluginCacheBase, v);
        const cachePluginJsonDir = join(cacheVersionDir, '.claude-plugin');
        const cachePluginJsonPath = join(cachePluginJsonDir, 'plugin.json');
        if (!existsSync(cachePluginJsonPath)) {
          mkdirSync(cachePluginJsonDir, { recursive: true });
          // Use version-specific content for each cached version
          const versionedPkg = { ...pluginJson, version: v };
          writeFileSync(cachePluginJsonPath, JSON.stringify(versionedPkg, null, 2));
          console.log(`[OMC] Created .claude-plugin/plugin.json in plugin cache v${v}`);
        }
      }
    }
  } catch (e) {
    console.log('[OMC] Warning: Could not create .claude-plugin/plugin.json:', e.message);
  }
}

fixMissingPluginJson();

// 1. Create HUD directory
if (!existsSync(HUD_DIR)) {
  mkdirSync(HUD_DIR, { recursive: true });
}

// 2. Create HUD wrapper script
const hudScriptPath = join(HUD_DIR, 'omc-hud.mjs');
const hudScript = `#!/usr/bin/env node
/**
 * OMC HUD - Statusline Script
 * Wrapper that imports from plugin cache or development paths
 */

import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// Semantic version comparison: returns negative if a < b, positive if a > b, 0 if equal
function semverCompare(a, b) {
  // Use parseInt to handle pre-release suffixes (e.g. "0-beta" -> 0)
  const pa = a.replace(/^v/, "").split(".").map(s => parseInt(s, 10) || 0);
  const pb = b.replace(/^v/, "").split(".").map(s => parseInt(s, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na !== nb) return na - nb;
  }
  // If numeric parts equal, non-pre-release > pre-release
  const aHasPre = /-/.test(a);
  const bHasPre = /-/.test(b);
  if (aHasPre && !bHasPre) return -1;
  if (!aHasPre && bHasPre) return 1;
  return 0;
}

async function main() {
  const home = homedir();

  // 1. Try plugin cache first (marketplace: omc, plugin: ultrapower)
  const pluginCacheBase = join(home, ".claude/plugins/cache/omc/ultrapower");
  if (existsSync(pluginCacheBase)) {
    try {
      const versions = readdirSync(pluginCacheBase);
      if (versions.length > 0) {
        // Filter to only versions with built dist/hud/index.js
        const builtVersions = versions.filter(v => {
          const hudPath = join(pluginCacheBase, v, "dist/hud/index.js");
          return existsSync(hudPath);
        });
        if (builtVersions.length > 0) {
          const latestBuilt = builtVersions.sort(semverCompare).reverse()[0];
          const pluginPath = join(pluginCacheBase, latestBuilt, "dist/hud/index.js");
          await import(pathToFileURL(pluginPath).href);
          return;
        }
      }
    } catch { /* continue */ }
  }

  // 2. Development paths
  const devPaths = [
    join(home, "Workspace/ultrapower/dist/hud/index.js"),
    join(home, "workspace/ultrapower/dist/hud/index.js"),
    join(home, "Workspace/ultrapower/dist/hud/index.js"),
    join(home, "workspace/ultrapower/dist/hud/index.js"),
  ];

  for (const devPath of devPaths) {
    if (existsSync(devPath)) {
      try {
        await import(devPath);
        return;
      } catch { /* continue */ }
    }
  }

  // 3. Fallback
  console.log("[OMC] run /omc-setup to install properly");
}

main();
`;

writeFileSync(hudScriptPath, hudScript);
try {
  chmodSync(hudScriptPath, 0o755);
} catch { /* Windows doesn't need this */ }
console.log('[OMC] Installed HUD wrapper script');

// 3. Configure settings.json
try {
  let settings = {};
  if (existsSync(SETTINGS_FILE)) {
    settings = JSON.parse(readFileSync(SETTINGS_FILE, 'utf-8'));
  }

  // Update statusLine to use new HUD path
  settings.statusLine = {
    type: 'command',
    command: `node ${hudScriptPath}`
  };
  writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  console.log('[OMC] Configured HUD statusLine in settings.json');
} catch (e) {
  console.log('[OMC] Warning: Could not configure settings.json:', e.message);
}

console.log('[OMC] Setup complete! Restart Claude Code to activate HUD.');
