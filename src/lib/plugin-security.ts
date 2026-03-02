/**
 * Plugin security validation: static analysis + runtime permission model.
 * Sandbox strategy: Worker Threads (Node.js built-in, no extra deps).
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Dangerous API patterns to flag in static analysis
const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\brequire\s*\(\s*['"]child_process['"]\s*\)/, label: 'child_process' },
  { pattern: /\bimport\s+.*from\s+['"]child_process['"]/, label: 'child_process' },
  { pattern: /\bexecSync\s*\(|\bspawnSync\s*\(|\bexec\s*\(|\bspawn\s*\(/, label: 'shell execution' },
  { pattern: /\beval\s*\(/, label: 'eval' },
  { pattern: /\bnew\s+Function\s*\(/, label: 'Function constructor' },
  { pattern: /\bprocess\.env\b/, label: 'process.env access' },
  { pattern: /\bfs\.(?:writeFile|unlink|rmdir|rm|chmod|chown)\b/, label: 'destructive fs' },
  { pattern: /\brequire\s*\(\s*['"]net['"]\s*\)/, label: 'net module' },
  { pattern: /\brequire\s*\(\s*['"]http['"]\s*\)/, label: 'http module' },
  { pattern: /\bimport\s+.*from\s+['"](?:net|http|https)['"]/, label: 'network module' },
];

export interface SecurityViolation {
  file: string;
  line: number;
  label: string;
  snippet: string;
}

export interface SecurityReport {
  safe: boolean;
  violations: SecurityViolation[];
}

/**
 * Scan a single file for dangerous API usage.
 */
function scanFile(filePath: string): SecurityViolation[] {
  const violations: SecurityViolation[] = [];
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return violations;
  }
  const lines = content.split('\n');
  // Per-line scan (precise line numbers)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    for (const { pattern, label } of DANGEROUS_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({ file: filePath, line: i + 1, label, snippet: line.trim().slice(0, 120) });
        break;
      }
    }
  }
  // Full-content scan catches multi-line patterns (e.g. split across lines)
  for (const { pattern, label } of DANGEROUS_PATTERNS) {
    if (pattern.test(content) && !violations.some(v => v.label === label && v.file === filePath)) {
      violations.push({ file: filePath, line: 0, label, snippet: '(multi-line pattern)' });
    }
  }
  return violations;
}

/**
 * Recursively collect JS/TS/MJS files under a directory (max depth 5).
 */
function collectFiles(dir: string, depth = 0): string[] {
  if (depth > 5 || !existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let st: ReturnType<typeof statSync>;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory() && entry !== 'node_modules' && !entry.startsWith('.')) {
      files.push(...collectFiles(full, depth + 1));
    } else if (st.isFile() && /\.(js|ts|mjs|cjs)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Run static analysis on a plugin directory.
 */
export function analyzePlugin(pluginDir: string): SecurityReport {
  const files = collectFiles(pluginDir);
  const violations: SecurityViolation[] = [];
  for (const f of files) {
    violations.push(...scanFile(f));
  }
  return { safe: violations.length === 0, violations };
}
