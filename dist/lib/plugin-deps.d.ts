/**
 * Plugin dependency resolution: recursive scan + version lock + conflict detection.
 */
export interface DepNode {
    name: string;
    version: string;
    depth: number;
    deps: DepNode[];
}
export interface ConflictReport {
    clean: boolean;
    conflicts: Array<{
        name: string;
        versions: string[];
    }>;
    tree: DepNode[];
}
/**
 * Recursively build dependency tree up to maxDepth (default 3).
 */
export declare function buildDepTree(pluginDir: string, name?: string, version?: string, depth?: number, maxDepth?: number, seen?: Set<string>): DepNode;
/**
 * Flatten tree and detect version conflicts (same package, different versions).
 */
export declare function detectConflicts(tree: DepNode): ConflictReport;
//# sourceMappingURL=plugin-deps.d.ts.map