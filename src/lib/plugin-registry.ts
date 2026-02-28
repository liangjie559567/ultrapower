/**
 * Plugin registry synchronization utilities for ultrapower.
 *
 * IMPORTANT: This module must NOT import from auto-update.ts or installer/index.ts
 * to prevent circular dependencies. Callers must pass any context (e.g. isProjectScoped)
 * as parameters. See installer/index.ts lines 97-98 for context.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { atomicWriteJsonSync } from './atomic-write.js';

// ---- Data structures ----

interface PluginRegistryEntry {
  scope: 'user' | 'project';
  installPath: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
  gitCommitSha?: string;
}

interface InstalledPluginsJson {
  version: 2;
  plugins: Record<string, PluginRegistryEntry[]>;
}

export interface SyncOptions {
  newVersion: string;
  /** If true, skip sync (caller determined plugin is project-scoped). */
  skipIfProjectScoped?: boolean;
}

export interface SyncResult {
  success: boolean;
  skipped?: boolean;
  previousVersion?: string;
  newVersion: string;
  registryPath: string;
  errors?: string[];
}

export interface ConsistencyReport {
  consistent: boolean;
  packageJsonVersion: string;
  versionMetadataVersion: string | null;
  registryVersion: string | null;
  discrepancies: string[];
  fixCommand?: string;
  isUpdating?: boolean;
}

// ---- Constants ----

const REGISTRY_PATH = join(homedir(), '.claude', 'plugins', 'installed_plugins.json');

/**
 * Find the actual registry key for ultrapower.
 * Claude Code uses the format `{pluginName}@{marketplaceName}`.
 * The marketplace name varies (e.g. "omc", "ultrapower"), so we search dynamically.
 */
function findPluginKey(registry: InstalledPluginsJson): string | null {
  for (const key of Object.keys(registry.plugins)) {
    if (key.startsWith('ultrapower@')) {
      return key;
    }
  }
  return null;
}

// ---- Internal helpers ----

/**
 * Read the installed_plugins.json entry for ultrapower.
 * Returns null if file doesn't exist or entry not found.
 */
function getInstalledPluginEntry(): PluginRegistryEntry | null {
  try {
    if (!existsSync(REGISTRY_PATH)) {
      return null;
    }
    const raw = readFileSync(REGISTRY_PATH, 'utf-8');
    const registry = JSON.parse(raw) as InstalledPluginsJson;
    const key = findPluginKey(registry);
    if (!key) return null;
    const entries = registry.plugins[key];
    if (!Array.isArray(entries) || entries.length === 0) {
      return null;
    }
    return entries[0];
  } catch {
    return null;
  }
}

/**
 * Get the runtime package.json version.
 * Walks up from __dirname to find package.json.
 */
function getPackageJsonVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dir = dirname(__filename);
    for (let i = 0; i < 5; i++) {
      const candidate = join(__dir, ...Array(i + 1).fill('..'), 'package.json');
      try {
        const pkg = JSON.parse(readFileSync(candidate, 'utf-8')) as { name?: string; version?: string };
        if (pkg.name && pkg.version) {
          return pkg.version;
        }
      } catch {
        continue;
      }
    }
  } catch {
    // ignore
  }
  return 'unknown';
}

/**
 * Read version from version metadata file in plugin cache.
 * Derives path from the registry entry's installPath instead of hardcoding.
 */
function getVersionMetadataVersion(entry: PluginRegistryEntry | null): string | null {
  if (!entry?.installPath) return null;
  try {
    const versionJsonPath = join(entry.installPath, 'version.json');
    if (!existsSync(versionJsonPath)) return null;
    const raw = readFileSync(versionJsonPath, 'utf-8');
    const data = JSON.parse(raw) as { version?: string };
    return data?.version ?? null;
  } catch {
    return null;
  }
}

// ---- Public API ----

/**
 * Sync the version field in installed_plugins.json for ultrapower.
 * Only updates `version` and `lastUpdated`; does not modify `installPath`.
 */
export function syncPluginRegistry(options: SyncOptions): SyncResult {
  const { newVersion, skipIfProjectScoped } = options;

  if (skipIfProjectScoped) {
    return { success: true, skipped: true, newVersion, registryPath: REGISTRY_PATH };
  }

  const entry = getInstalledPluginEntry();

  if (entry === null) {
    // File doesn't exist or key not found — check which case
    if (!existsSync(REGISTRY_PATH)) {
      return { success: true, skipped: true, newVersion, registryPath: REGISTRY_PATH };
    }
    // File exists but key not found
    return {
      success: false,
      newVersion,
      registryPath: REGISTRY_PATH,
      errors: [`No 'ultrapower@*' entry found in registry`],
    };
  }

  const previousVersion = entry.version;

  try {
    const raw = readFileSync(REGISTRY_PATH, 'utf-8');
    const registry = JSON.parse(raw) as InstalledPluginsJson;
    const key = findPluginKey(registry)!;
    const entries = registry.plugins[key];
    entries[0].version = newVersion;
    entries[0].lastUpdated = new Date().toISOString();
    atomicWriteJsonSync(REGISTRY_PATH, registry);
    return { success: true, previousVersion, newVersion, registryPath: REGISTRY_PATH };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, newVersion, registryPath: REGISTRY_PATH, errors: [msg] };
  }
}

/**
 * Check version consistency across three sources:
 * 1. package.json (runtime)
 * 2. installed_plugins.json (registry)
 * 3. version.json in plugin cache
 */
export function checkVersionConsistency(): ConsistencyReport {
  const packageJsonVersion = getPackageJsonVersion();
  const entry = getInstalledPluginEntry();
  const registryVersion = entry?.version ?? null;
  const versionMetadataVersion = getVersionMetadataVersion(entry);

  const sources: Array<[string, string | null]> = [
    ['package.json', packageJsonVersion],
    ['installed_plugins.json', registryVersion],
    ['version metadata', versionMetadataVersion],
  ];

  const knownVersions = sources
    .map(([, v]) => v)
    .filter((v): v is string => v !== null && v !== 'unknown');

  const allSame = knownVersions.length > 0 && knownVersions.every(v => v === knownVersions[0]);
  const consistent = allSame && knownVersions.length === sources.length;

  const discrepancies: string[] = [];
  if (!consistent) {
    for (const [label, v] of sources) {
      if (v === null) {
        discrepancies.push(`${label}: not found`);
      } else if (v !== packageJsonVersion) {
        discrepancies.push(`${label}: ${v} (expected ${packageJsonVersion})`);
      }
    }
  }

  // isUpdating: registry version differs from package.json (update in progress)
  const isUpdating = registryVersion !== null && registryVersion !== packageJsonVersion;

  const fixCommand = consistent
    ? undefined
    : '/plugin install ultrapower  # or: /update (if installed via npm)';

  return {
    consistent,
    packageJsonVersion,
    versionMetadataVersion,
    registryVersion,
    discrepancies,
    fixCommand: consistent ? undefined : fixCommand,
    isUpdating,
  };
}
