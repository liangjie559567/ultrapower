/**
 * Plugin marketplace: conditional activation (requires ≥5 third-party plugins).
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const REGISTRY_PATH = join(homedir(), '.claude', 'plugins', 'installed_plugins.json');
const MARKETPLACE_THRESHOLD = 5;

interface InstalledPluginsJson {
  version: 2;
  plugins: Record<string, unknown[]>;
}

/**
 * Count third-party plugins (excludes 'ultrapower@*').
 */
export function countThirdPartyPlugins(): number {
  if (!existsSync(REGISTRY_PATH)) return 0;
  try {
    const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8')) as InstalledPluginsJson;
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
