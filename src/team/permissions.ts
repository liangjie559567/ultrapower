// src/team/permissions.ts

/**
 * RBAC-compatible advisory permission scoping for workers.
 *
 * NOTE: This is an advisory layer only. MCP workers run in full-auto mode
 * and cannot be mechanically restricted. Permissions are injected into
 * prompts as instructions for the LLM to follow.
 */

import { relative, resolve } from 'node:path';

export interface WorkerPermissions {
  workerName: string;
  allowedPaths: string[];   // glob patterns relative to workingDirectory
  deniedPaths: string[];    // glob patterns that override allowed
  allowedCommands: string[]; // command prefixes (e.g., 'npm test', 'tsc')
  maxFileSize: number;      // max bytes per file write
}

/**
 * Simple glob matching for path patterns.
 * Supports: * (any non-/ chars), ** (any depth including /), ? (single non-/ char), exact match.
 *
 * Uses iterative character-by-character matching to avoid ReDoS risk from regex.
 */
function matchGlob(pattern: string, path: string): boolean {
  // Normalize Windows backslashes
  const p = path.replace(/\\/g, '/');
  return matchGlobRecursive(pattern, p, 0, 0);
}

function matchGlobRecursive(pattern: string, path: string, pi: number, si: number): boolean {
  while (pi < pattern.length) {
    // '**' matches zero or more path segments
    if (pattern[pi] === '*' && pattern[pi + 1] === '*') {
      pi += 2;
      if (pi < pattern.length && pattern[pi] === '/') pi++;
      // Try matching from every position in the remaining path
      for (let i = si; i <= path.length; i++) {
        if (matchGlobRecursive(pattern, path, pi, i)) return true;
        // Advance to next segment
        if (i < path.length && path[i] !== '/') continue;
        if (i < path.length) continue;
        break;
      }
      return false;
    }

    // Single '*' matches any non-'/' sequence
    if (pattern[pi] === '*') {
      pi++;
      while (si <= path.length) {
        if (matchGlobRecursive(pattern, path, pi, si)) return true;
        if (si >= path.length || path[si] === '/') break;
        si++;
      }
      return false;
    }

    // '?' matches single non-'/' char
    if (pattern[pi] === '?') {
      if (si >= path.length || path[si] === '/') return false;
      pi++; si++;
      continue;
    }

    // Exact char match
    if (si >= path.length || pattern[pi] !== path[si]) return false;
    pi++; si++;
  }

  return si === path.length;
}

/**
 * Check if a worker is allowed to modify a given path.
 * Denied paths override allowed paths.
 */
export function isPathAllowed(
  permissions: WorkerPermissions,
  filePath: string,
  workingDirectory: string
): boolean {
  // Normalize to relative path
  const absPath = resolve(workingDirectory, filePath);
  const relPath = relative(workingDirectory, absPath);

  // If path escapes working directory, always deny
  if (relPath.startsWith('..')) return false;

  // Check denied paths first (they override)
  for (const pattern of permissions.deniedPaths) {
    if (matchGlob(pattern, relPath)) return false;
  }

  // If no allowed paths specified, allow all within workingDirectory
  if (permissions.allowedPaths.length === 0) return true;

  // Check allowed paths
  for (const pattern of permissions.allowedPaths) {
    if (matchGlob(pattern, relPath)) return true;
  }

  return false;
}

/**
 * Check if a worker is allowed to run a given command.
 * Empty allowedCommands means all commands are allowed.
 */
export function isCommandAllowed(
  permissions: WorkerPermissions,
  command: string
): boolean {
  if (permissions.allowedCommands.length === 0) return true;

  const trimmed = command.trim();
  return permissions.allowedCommands.some(prefix =>
    trimmed.startsWith(prefix)
  );
}

/**
 * Generate permission instructions for inclusion in worker prompt.
 */
export function formatPermissionInstructions(
  permissions: WorkerPermissions
): string {
  const lines: string[] = [];
  lines.push('PERMISSION CONSTRAINTS:');

  if (permissions.allowedPaths.length > 0) {
    lines.push(`- You may ONLY modify files matching: ${permissions.allowedPaths.join(', ')}`);
  }

  if (permissions.deniedPaths.length > 0) {
    lines.push(`- You must NOT modify files matching: ${permissions.deniedPaths.join(', ')}`);
  }

  if (permissions.allowedCommands.length > 0) {
    lines.push(`- You may ONLY run commands starting with: ${permissions.allowedCommands.join(', ')}`);
  }

  if (Number.isFinite(permissions.maxFileSize)) {
    lines.push(`- Maximum file size: ${Math.round(permissions.maxFileSize / 1024)}KB per file`);
  }

  if (lines.length === 1) {
    lines.push('- No restrictions (full access within working directory)');
  }

  return lines.join('\n');
}

/**
 * Default permissions (allow all within working directory).
 */
export function getDefaultPermissions(workerName: string): WorkerPermissions {
  return {
    workerName,
    allowedPaths: [],     // empty = allow all
    deniedPaths: [],
    allowedCommands: [],  // empty = allow all
    maxFileSize: Infinity,
  };
}

/**
 * Secure deny-defaults that are always enforced regardless of caller config.
 * These protect sensitive files from being modified by any worker.
 */
const SECURE_DENY_DEFAULTS: string[] = [
  '.git/**',
  '.env*',
  '**/.env*',
  '**/secrets/**',
  '**/.ssh/**',
  '**/node_modules/.cache/**',
];

/**
 * Merge caller-provided permissions with secure deny-defaults.
 * The deny-defaults are always prepended to deniedPaths so they cannot be overridden.
 */
export function getEffectivePermissions(base?: Partial<WorkerPermissions> & { workerName: string }): WorkerPermissions {
  const perms = base
    ? { ...getDefaultPermissions(base.workerName), ...base }
    : getDefaultPermissions('default');

  // Prepend secure defaults (deduplicating against existing deniedPaths)
  const existingSet = new Set(perms.deniedPaths);
  const merged = [
    ...SECURE_DENY_DEFAULTS.filter(p => !existingSet.has(p)),
    ...perms.deniedPaths,
  ];
  perms.deniedPaths = merged;

  return perms;
}

/** A single permission violation */
export interface PermissionViolation {
  path: string;
  reason: string;
}

/**
 * Check a list of changed file paths against permissions.
 * Returns an array of violations (empty = all paths allowed).
 *
 * @param changedPaths - relative or absolute paths of files that were modified
 * @param permissions - effective permissions to check against
 * @param cwd - working directory for resolving relative paths
 */
export function findPermissionViolations(
  changedPaths: string[],
  permissions: WorkerPermissions,
  cwd: string
): PermissionViolation[] {
  const violations: PermissionViolation[] = [];

  for (const filePath of changedPaths) {
    if (!isPathAllowed(permissions, filePath, cwd)) {
      // Determine which deny pattern matched for the reason
      const absPath = resolve(cwd, filePath);
      const relPath = relative(cwd, absPath);

      let reason: string;
      if (relPath.startsWith('..')) {
        reason = `Path escapes working directory: ${relPath}`;
      } else {
        // Find which deny pattern matched
        const matchedDeny = permissions.deniedPaths.find(p => matchGlob(p, relPath));
        if (matchedDeny) {
          reason = `Matches denied pattern: ${matchedDeny}`;
        } else {
          reason = `Not in allowed paths: ${permissions.allowedPaths.join(', ') || '(none configured)'}`;
        }
      }

      violations.push({ path: relPath.replace(/\\/g, '/'), reason });
    }
  }

  return violations;
}
