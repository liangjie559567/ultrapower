/**
 * Plugin dependency resolution: recursive scan + version lock + conflict detection.
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
function readPackageJson(dir) {
    const p = join(dir, 'package.json');
    if (!existsSync(p))
        return {};
    try {
        const pkg = JSON.parse(readFileSync(p, 'utf-8'));
        return { ...pkg.dependencies, ...pkg.peerDependencies };
    }
    catch {
        return {};
    }
}
/**
 * Recursively build dependency tree up to maxDepth (default 3).
 */
export function buildDepTree(pluginDir, name = 'root', version = '0.0.0', depth = 0, maxDepth = 3, seen = new Set()) {
    const node = { name, version, depth, deps: [] };
    if (depth >= maxDepth)
        return node;
    const deps = readPackageJson(pluginDir);
    for (const [depName, depVersion] of Object.entries(deps)) {
        const key = `${depName}@${depVersion}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        const depDir = join(pluginDir, 'node_modules', depName);
        node.deps.push(buildDepTree(depDir, depName, depVersion, depth + 1, maxDepth, seen));
    }
    return node;
}
/**
 * Flatten tree and detect version conflicts (same package, different versions).
 */
export function detectConflicts(tree) {
    const versionMap = new Map();
    function walk(node) {
        if (node.name !== 'root') {
            const s = versionMap.get(node.name) ?? new Set();
            s.add(node.version);
            versionMap.set(node.name, s);
        }
        for (const child of node.deps)
            walk(child);
    }
    walk(tree);
    const conflicts = [];
    for (const [name, versions] of versionMap) {
        if (versions.size > 1) {
            conflicts.push({ name, versions: [...versions] });
        }
    }
    return { clean: conflicts.length === 0, conflicts, tree: [tree] };
}
//# sourceMappingURL=plugin-deps.js.map