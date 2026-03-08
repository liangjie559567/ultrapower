/**
 * Plugin version rollback: snapshot + restore.
 */
export interface SnapshotMeta {
    plugin: string;
    version: string;
    snapshotAt: string;
    snapshotPath: string;
}
/**
 * Create a snapshot of a plugin's install directory before upgrade.
 */
export declare function createSnapshot(plugin: string, version: string, installPath: string): SnapshotMeta;
/**
 * Restore a plugin to a previously snapshotted version.
 */
export declare function restoreSnapshot(plugin: string, version: string, installPath: string): boolean;
/**
 * List available snapshots for a plugin.
 */
export declare function listSnapshots(plugin: string): SnapshotMeta[];
//# sourceMappingURL=plugin-rollback.d.ts.map