/**
 * Plugin registry synchronization utilities for ultrapower.
 *
 * IMPORTANT: This module must NOT import from auto-update.ts or installer/index.ts
 * to prevent circular dependencies. Callers must pass any context (e.g. isProjectScoped)
 * as parameters. See installer/index.ts lines 97-98 for context.
 */
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
/**
 * Sync the version field in installed_plugins.json for ultrapower.
 * Only updates `version` and `lastUpdated`; does not modify `installPath`.
 */
export declare function syncPluginRegistry(options: SyncOptions): SyncResult;
/**
 * Check version consistency across three sources:
 * 1. package.json (runtime)
 * 2. installed_plugins.json (registry)
 * 3. version.json in plugin cache
 */
export declare function checkVersionConsistency(): ConsistencyReport;
//# sourceMappingURL=plugin-registry.d.ts.map