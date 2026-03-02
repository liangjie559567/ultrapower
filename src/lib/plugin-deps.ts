/**
 * Plugin dependency resolution: recursive scan + version lock + conflict detection.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface DepNode {
  name: string;
  version: string;
  depth: number;
  deps: DepNode[];
}

export interface ConflictReport {
  clean: boolean;
  conflicts: Array<{ name: string; versions: string[] }>;
  tree: DepNode[];
}

function readPackageJson(dir: string): Record<string, string> {
  const p = join(dir, 'package.json');
  if (!existsSync(p)) return {};
  try {
    const pkg = JSON.parse(readFileSync(p, 'utf-8')) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    return { ...pkg.dependencies, ...pkg.peerDependencies };
  } catch {
    return {};
  }
}

/**
 * Recursively build dependency tree up to maxDepth (default 3).
 */
export function buildDepTree(
  pluginDir: string,
  name = 'root',
  version = '0.0.0',
  depth = 0,
  maxDepth = 3,
  seen = new Set<string>(),
): DepNode {
  const node: DepNode = { name, version, depth, deps: [] };
  if (depth >= maxDepth) return node;

  const deps = readPackageJson(pluginDir);
  for (const [depName, depVersion] of Object.entries(deps)) {
    const key = `${depName}@${depVersion}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const depDir = join(pluginDir, 'node_modules', depName);
    node.deps.push(buildDepTree(depDir, depName, depVersion, depth + 1, maxDepth, seen));
  }
  return node;
}

/**
 * Flatten tree and detect version conflicts (same package, different versions).
 */
export function detectConflicts(tree: DepNode): ConflictReport {
  const versionMap = new Map<string, Set<string>>();

  function walk(node: DepNode) {
    if (node.name !== 'root') {
      const s = versionMap.get(node.name) ?? new Set();
      s.add(node.version);
      versionMap.set(node.name, s);
    }
    for (const child of node.deps) walk(child);
  }
  walk(tree);

  const conflicts: Array<{ name: string; versions: string[] }> = [];
  for (const [name, versions] of versionMap) {
    if (versions.size > 1) {
      conflicts.push({ name, versions: [...versions] });
    }
  }
  return { clean: conflicts.length === 0, conflicts, tree: [tree] };
}
