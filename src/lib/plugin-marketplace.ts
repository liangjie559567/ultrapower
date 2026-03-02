/**
 * Plugin marketplace: conditional activation (requires ≥5 third-party plugins).
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

function getRegistryPath(): string {
  return process.env['OMC_REGISTRY_PATH'] ?? join(homedir(), '.claude', 'plugins', 'installed_plugins.json');
}
const MARKETPLACE_THRESHOLD = 5;

interface InstalledPluginsJson {
  version: 2;
  plugins: Record<string, unknown[]>;
}

/**
 * Count third-party plugins (excludes 'ultrapower@*').
 */
export function countThirdPartyPlugins(): number {
  const registryPath = getRegistryPath();
  if (!existsSync(registryPath)) return 0;
  try {
    const raw = JSON.parse(readFileSync(registryPath, 'utf-8')) as unknown;
    if (!raw || typeof raw !== 'object' || !('plugins' in raw) || typeof (raw as Record<string, unknown>).plugins !== 'object') return 0;
    const registry = raw as InstalledPluginsJson;
    return Object.keys(registry.plugins).filter(k => !k.startsWith('ultrapower@')).length;
  } catch {
    return 0;
  }
}

/**
 * Returns true only when marketplace should be exposed to users.
 */
export function isMarketplaceEnabled(): boolean {
  return countThirdPartyPlugins() >= MARKETPLACE_THRESHOLD;
}
