/**
 * Tests for getRuntimePackageVersion()
 * Verifies the version helper locates and returns the correct package version.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getRuntimePackageVersion } from '../version.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('getRuntimePackageVersion', () => {
  it('returns a non-empty string', () => {
    const version = getRuntimePackageVersion();
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });

  it('returns a valid semver string or "unknown"', () => {
    const version = getRuntimePackageVersion();
    const isValidSemver = /^\d+\.\d+\.\d+/.test(version);
    const isUnknown = version === 'unknown';
    expect(isValidSemver || isUnknown).toBe(true);
  });

  it('matches the version field in package.json', () => {
    // Walk up from test file to find the package root
    const pkgPath = join(__dirname, '..', '..', '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const version = getRuntimePackageVersion();
    expect(version).toBe(pkg.version);
  });

  it('returns a stable value across multiple calls', () => {
    const v1 = getRuntimePackageVersion();
    const v2 = getRuntimePackageVersion();
    expect(v1).toBe(v2);
  });
});
