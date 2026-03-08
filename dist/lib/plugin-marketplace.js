/**
 * Plugin marketplace: conditional activation (requires ≥5 third-party plugins).
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
function getRegistryPath() {
    return process.env['OMC_REGISTRY_PATH'] ?? join(homedir(), '.claude', 'plugins', 'installed_plugins.json');
}
const MARKETPLACE_THRESHOLD = 5;
/**
 * Count third-party plugins (excludes 'ultrapower@*').
 */
export function countThirdPartyPlugins() {
    const registryPath = getRegistryPath();
    if (!existsSync(registryPath))
        return 0;
    try {
        const raw = JSON.parse(readFileSync(registryPath, 'utf-8'));
        if (!raw || typeof raw !== 'object' || !('plugins' in raw) || typeof raw.plugins !== 'object')
            return 0;
        const registry = raw;
        return Object.keys(registry.plugins).filter(k => !k.startsWith('ultrapower@')).length;
    }
    catch {
        return 0;
    }
}
/**
 * Returns true only when marketplace should be exposed to users.
 */
export function isMarketplaceEnabled() {
    return countThirdPartyPlugins() >= MARKETPLACE_THRESHOLD;
}
//# sourceMappingURL=plugin-marketplace.js.map