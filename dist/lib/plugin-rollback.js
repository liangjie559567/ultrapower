/**
 * Plugin version rollback: snapshot + restore.
 */
import { existsSync, mkdirSync, cpSync, rmSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { atomicWriteJsonSync } from './atomic-write.js';
function getSnapshotsDir() {
    return process.env['OMC_SNAPSHOTS_DIR'] ?? join(homedir(), '.claude', 'plugins', 'snapshots');
}
function snapshotDir(plugin, version) {
    return join(getSnapshotsDir(), `${plugin}@${version}`);
}
/**
 * Create a snapshot of a plugin's install directory before upgrade.
 */
export function createSnapshot(plugin, version, installPath) {
    const dest = snapshotDir(plugin, version);
    mkdirSync(dest, { recursive: true });
    if (existsSync(installPath)) {
        cpSync(installPath, dest, { recursive: true, force: true });
    }
    const meta = {
        plugin,
        version,
        snapshotAt: new Date().toISOString(),
        snapshotPath: dest,
    };
    atomicWriteJsonSync(join(dest, '_meta.json'), meta);
    return meta;
}
/**
 * Restore a plugin to a previously snapshotted version.
 */
export function restoreSnapshot(plugin, version, installPath) {
    const src = snapshotDir(plugin, version);
    if (!existsSync(src))
        return false;
    if (existsSync(installPath))
        rmSync(installPath, { recursive: true, force: true });
    mkdirSync(installPath, { recursive: true });
    cpSync(src, installPath, { recursive: true, force: true });
    return true;
}
/**
 * List available snapshots for a plugin.
 */
export function listSnapshots(plugin) {
    if (!existsSync(getSnapshotsDir()))
        return [];
    const results = [];
    for (const entry of readdirSync(getSnapshotsDir())) {
        if (!entry.startsWith(`${plugin}@`))
            continue;
        const metaPath = join(getSnapshotsDir(), entry, '_meta.json');
        if (!existsSync(metaPath))
            continue;
        try {
            const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
            results.push(meta);
        }
        catch { /* skip */ }
    }
    return results.sort((a, b) => b.snapshotAt.localeCompare(a.snapshotAt));
}
//# sourceMappingURL=plugin-rollback.js.map