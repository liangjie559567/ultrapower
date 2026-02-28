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

// Migration: rename marketplaces/ultrapower/ -> marketplaces/omc/ after marketplace name change.
// Users who added the marketplace via GitHub URL have it registered as 'ultrapower' (old name).
// Claude Code looks up marketplaces by directory name, so we rename to match new name 'omc'.
function migrateMarketplaceName() {
  try {
    const marketplacesDir = join(CLAUDE_DIR, 'plugins/marketplaces');
    const oldDir = join(marketplacesDir, 'ultrapower');
    const newDir = join(marketplacesDir, 'omc');
    if (existsSync(oldDir) && !existsSync(newDir)) {
      renameSync(oldDir, newDir);
      console.log('[OMC] Migrated marketplace directory: ultrapower -> omc');
    }
    // Patch marketplace.json name field if it still says 'ultrapower'
    const mktJsonPath = join(existsSync(newDir) ? newDir : oldDir, '.claude-plugin', 'marketplace.json');
    if (existsSync(mktJsonPath)) {
      const mkt = JSON.parse(readFileSync(mktJsonPath, 'utf-8'));
      if (mkt.name === 'ultrapower') {
        mkt.name = 'omc';
        writeFileSync(mktJsonPath, JSON.stringify(mkt, null, 2));
        console.log('[OMC] Patched marketplace.json name: ultrapower -> omc');
      }
    }

    // Patch known_marketplaces.json: rename key 'ultrapower' -> 'omc'
    const knownMktPath = join(CLAUDE_DIR, 'plugins/known_marketplaces.json');
    if (existsSync(knownMktPath)) {
      const known = JSON.parse(readFileSync(knownMktPath, 'utf-8'));
      if (known['ultrapower'] && !known['omc']) {
        known['omc'] = { ...known['ultrapower'], installLocation: known['ultrapower'].installLocation.replace(/\\ultrapower$/, '\\omc').replace(/\/ultrapower$/, '/omc') };
        delete known['ultrapower'];
        writeFileSync(knownMktPath, JSON.stringify(known, null, 2));
        console.log('[OMC] Patched known_marketplaces.json: ultrapower -> omc');
      }
    }

    // Patch installed_plugins.json: rename key 'ultrapower@ultrapower' -> 'ultrapower@omc'
    const installedPath = join(CLAUDE_DIR, 'plugins/installed_plugins.json');
    if (existsSync(installedPath)) {
      const installed = JSON.parse(readFileSync(installedPath, 'utf-8'));
      if (installed.plugins?.['ultrapower@ultrapower'] && !installed.plugins?.['ultrapower@omc']) {
        installed.plugins['ultrapower@omc'] = installed.plugins['ultrapower@ultrapower'];
        delete installed.plugins['ultrapower@ultrapower'];
        writeFileSync(installedPath, JSON.stringify(installed, null, 2));
        console.log('[OMC] Patched installed_plugins.json: ultrapower@ultrapower -> ultrapower@omc');
      }
    }
  } catch (e) {
    console.log('[OMC] Warning: Could not migrate marketplace directory:', e.message);
  }
}

migrateMarketplaceName();

// Fix: flatten nested cache directories caused by Claude Code installer bug.
// Root cause: Claude Code copies npm package contents into cache/omc/, but the package
// itself contains an 'ultrapower/' subdirectory, causing infinite nesting on each restart.
// Two known nesting patterns:
//   Pattern A (flat root): cache/omc/ultrapower/5.0.23/ultrapower/5.0.23/...
//   Pattern B (versioned): cache/omc/ultrapower/VERSION/ultrapower/VERSION/...
// This function handles both by detecting and removing the nested 'ultrapower/' subtree
// directly under cache/omc/ (Pattern A), which is the primary observed pattern.
function fixNestedCacheDir() {
  try {
    // Pattern A: cache/omc/ultrapower/ exists but is NOT the legitimate
    // marketplace/plugin path. Only remove if it contains no version dirs
    // and no plugin markers — i.e. it's a stale empty nesting artifact.
    const pluginCacheRoot = join(CLAUDE_DIR, 'plugins/cache/omc');
    const nestedRootDir = join(pluginCacheRoot, 'ultrapower');
    if (existsSync(nestedRootDir)) {
      const nestedContents = readdirSync(nestedRootDir);
      const PLUGIN_MARKERS = ['skills', 'dist', 'agents', 'hooks'];
      const hasVersionDirs = nestedContents.some(f => /^\d+\.\d+/.test(f));
      const hasPluginMarkers = nestedContents.some(f => PLUGIN_MARKERS.includes(f));
      if (!hasVersionDirs && !hasPluginMarkers) {
        console.log('[OMC] Detected stale nested cache dir at plugins/cache/omc/ultrapower/ — removing...');
        rmSync(nestedRootDir, { recursive: true, force: true });
        console.log('[OMC] Removed stale nested cache dir (Pattern A)');
      }
    }

    // Pattern B: cache/omc/ultrapower/VERSION/ (versioned nesting)
    const pluginCacheBase = join(CLAUDE_DIR, 'plugins/cache/omc/ultrapower');
    if (!existsSync(pluginCacheBase)) return;
    const versions = readdirSync(pluginCacheBase);
    for (const version of versions) {
      const versionDir = join(pluginCacheBase, version);
      const nestedDir = join(versionDir, 'ultrapower');
      if (!existsSync(nestedDir)) continue;

      // Walk down the nesting to find the real plugin content (arbitrary depth)
      // Real content has skills/, dist/, agents/, or hooks/ directly inside
      const PLUGIN_MARKERS = ['skills', 'dist', 'agents', 'hooks'];
      let realContentDir = null;
      let searchDir = nestedDir;
      let depth = 0;
      while (depth < 20) {
        const contents = readdirSync(searchDir);
        if (contents.length === 0) {
          rmSync(nestedDir, { recursive: true, force: true });
          console.log(`[OMC] Removed empty nested dir for version ${version}`);
          break;
        }
        if (contents.some(f => PLUGIN_MARKERS.includes(f))) {
          realContentDir = searchDir;
          break;
        }
        const nextDir = join(searchDir, 'ultrapower');
        const nextVerDir = join(searchDir, version);
        if (existsSync(nextDir)) {
          searchDir = nextDir;
        } else if (existsSync(nextVerDir)) {
          searchDir = nextVerDir;
        } else {
          break;
        }
        depth++;
      }

      if (!realContentDir) continue;

      console.log(`[OMC] Fixing nested cache dir for version ${version} (depth ${depth})...`);
      const realContents = readdirSync(realContentDir);
      for (const item of realContents) {
        const src = join(realContentDir, item);
        const dest = join(versionDir, item);
        if (!existsSync(dest)) {
          renameSync(src, dest);
        }
      }
      rmSync(nestedDir, { recursive: true, force: true });
      console.log(`[OMC] Fixed nested cache dir for version ${version} (Pattern B)`);
    }
  } catch (e) {
    console.log('[OMC] Warning: Could not fix nested cache dir:', e.message);
  }
}

fixNestedCacheDir();

// Fix: Claude Code plugin cache does not include templates/ directory when installed via npm,
// because npm install runs from a temp node_modules dir and Claude Code copies files to cache
// after postinstall. We copy templates/hooks/ directly to the plugin cache so that
// hooks/hooks.json paths (${CLAUDE_PLUGIN_ROOT}/templates/hooks/*.mjs) resolve correctly.
function copyTemplatesToCache() {
  try {
    const pluginCacheBase = join(CLAUDE_DIR, 'plugins/cache/omc/ultrapower');
    if (!existsSync(pluginCacheBase)) return;

    // __dirname = <pkg-root>/scripts/, so dirname(__dirname) = <pkg-root>/
    // This assumes the postinstall script lives one level below the package root.
    // If the script is ever moved, update this path accordingly.
    const pluginRoot = dirname(__dirname);
    const srcTemplatesHooks = join(pluginRoot, 'templates', 'hooks');
    if (!existsSync(srcTemplatesHooks)) {
      console.log('[OMC] Warning: templates/hooks/ not found in package root:', srcTemplatesHooks);
      return;
    }

    // Collect version directories to copy into.
    // If the cache base exists but is empty (Claude Code hasn't populated it yet),
    // fall back to the package version so we can pre-populate the correct directory.
    let versions = readdirSync(pluginCacheBase, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name);

    if (versions.length === 0) {
      // Cache dir exists but is empty — read version from package.json and create the dir
      try {
        const pkgPath = join(pluginRoot, 'package.json');
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        const pkgVersion = pkg.version;
        if (pkgVersion) {
          const versionDir = join(pluginCacheBase, pkgVersion);
          mkdirSync(versionDir, { recursive: true });
          versions = [pkgVersion];
          console.log(`[OMC] Plugin cache was empty — created version dir for v${pkgVersion}`);
        }
      } catch (pkgErr) {
        console.log('[OMC] Warning: Could not read package.json to determine version:', pkgErr.message);
      }
    }

    for (const version of versions) {
      const cacheVersionDir = join(pluginCacheBase, version);
      const destTemplatesHooks = join(cacheVersionDir, 'templates', 'hooks');
      if (!existsSync(destTemplatesHooks)) {
        mkdirSync(destTemplatesHooks, { recursive: true });
        try {
          cpSync(srcTemplatesHooks, destTemplatesHooks, { recursive: true });
          console.log(`[OMC] Copied templates/hooks/ to plugin cache v${version}`);
        } catch (copyErr) {
          // Clean up empty dir so next install can retry
          rmSync(destTemplatesHooks, { recursive: true, force: true });
          console.log(`[OMC] Warning: Failed to copy templates/hooks/ to cache v${version}:`, copyErr.message);
        }
      }
    }
  } catch (e) {
    console.log('[OMC] Warning: Could not copy templates/hooks/ to plugin cache:', e.message);
  }
}

copyTemplatesToCache();

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

    // Metadata-only plugin manifest. Per the Claude Code plugin schema:
    // - hooks/hooks.json is auto-discovered from the hooks/ directory
    // - agents/ directory is auto-discovered automatically
    // - The 'hooks' field is only for ADDITIONAL hooks files (must end with .json)
    // - The 'agents' field is only for ADDITIONAL individual agent .md files (must end with .md)
    // Declaring hooks/agents directory paths here causes Zod validation failures because
    // the schema expects .md files for agents and .json files for hooks, NOT directory paths.
    const pluginJson = {
      name: 'ultrapower',
      description: pkg.description || '',
      version,
      author: pkg.author ? { name: typeof pkg.author === 'string' ? pkg.author : pkg.author.name } : undefined,
      homepage: pkg.homepage || '',
      repository: pkg.repository?.url || pkg.repository || '',
      license: pkg.license || 'MIT',
      keywords: pkg.keywords || [],
    };
    const pluginJsonStr = JSON.stringify(pluginJson, null, 2);

    // Detect cache entries that need repair:
    // - Old invalid inline object/array formats from v5.3.x (hooks as object, agents as array)
    // - Old invalid path formats from v5.4.1-v5.4.4 (agents as directory path like './agents/')
    // NOTE: Missing hooks/agents fields is NOT a problem — auto-discovery handles them.
    function needsRepair(jsonPath) {
      try {
        const content = JSON.parse(readFileSync(jsonPath, 'utf-8'));
        // agents must NOT be a directory path (./agents/ fails r48() which requires .md files)
        if (content.agents && (typeof content.agents !== 'string' || !content.agents.endsWith('.md'))) return true;
        // hooks must NOT be an object/array (inline format is invalid; string path or absent is OK)
        if (content.hooks && typeof content.hooks === 'object') return true;
        return false;
      } catch { return false; }
    }

    // 1. Write to current install location (npm-cache node_modules dir)
    // Also overwrite if existing file has missing or incorrectly formatted component paths.
    const localPluginJsonDir = join(pluginRoot, '.claude-plugin');
    const localPluginJsonPath = join(localPluginJsonDir, 'plugin.json');
    if (!existsSync(localPluginJsonPath) || needsRepair(localPluginJsonPath)) {
      mkdirSync(localPluginJsonDir, { recursive: true });
      writeFileSync(localPluginJsonPath, pluginJsonStr);
      console.log('[OMC] Wrote .claude-plugin/plugin.json with correct component paths in install dir');
    }

    // 2. Write directly to plugin cache (marketplace: omc, plugin: ultrapower)
    // Claude Code copies from npm-cache but skips hidden dirs, so we patch the cache directly.
    // Also repair any existing cache entries with missing or invalid component path formats.
    const pluginCacheBase = join(CLAUDE_DIR, 'plugins/cache/omc/ultrapower');
    if (existsSync(pluginCacheBase)) {
      const versions = readdirSync(pluginCacheBase);
      for (const v of versions) {
        const cacheVersionDir = join(pluginCacheBase, v);
        const cachePluginJsonDir = join(cacheVersionDir, '.claude-plugin');
        const cachePluginJsonPath = join(cachePluginJsonDir, 'plugin.json');
        if (!existsSync(cachePluginJsonPath) || needsRepair(cachePluginJsonPath)) {
          mkdirSync(cachePluginJsonDir, { recursive: true });
          // Use version-specific content for each cached version
          const versionedPkg = { ...pluginJson, version: v };
          writeFileSync(cachePluginJsonPath, JSON.stringify(versionedPkg, null, 2));
          console.log(`[OMC] Wrote .claude-plugin/plugin.json with correct component paths in plugin cache v${v}`);
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
