/**
 * Path traversal protection for ultrapower.
 * Handles URL encoding, Unicode normalization, symlinks, null bytes, and double encoding.
 *
 * Spec: docs/standards/runtime-protection.md §2.1-2.3
 */
import * as path from 'path';
import * as fs from 'fs';
export class SecurityError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SecurityError';
    }
}
/**
 * Validate and resolve a user-provided path against a base directory.
 * Protects against 5 attack vectors:
 * 1. URL encoding (%2e%2e%2f)
 * 2. Unicode normalization (︰ vs :)
 * 3. Symlink traversal
 * 4. Null byte injection
 * 5. Double encoding (%252e)
 *
 * @param userPath - Untrusted user input path
 * @param baseDir - Trusted base directory (must be absolute)
 * @returns Validated absolute path within baseDir
 * @throws {SecurityError} If path traversal detected
 */
export function validatePath(userPath, baseDir) {
    // Vector 4: Null byte injection
    if (userPath.includes('\0')) {
        throw new SecurityError('Null byte detected in path');
    }
    // Block absolute paths early
    if (path.isAbsolute(userPath)) {
        throw new SecurityError('Absolute paths not allowed');
    }
    // Block Windows absolute paths (C:\, D:\, etc.) on all platforms
    if (/^[a-zA-Z]:[/\\]/.test(userPath)) {
        throw new SecurityError('Absolute paths not allowed');
    }
    // Block UNC paths (\\server\share)
    if (userPath.startsWith('\\\\') || userPath.startsWith('//')) {
        throw new SecurityError('UNC paths not allowed');
    }
    // Vector 5: Double encoding - decode twice
    let decoded = userPath;
    try {
        decoded = decodeURIComponent(decoded);
        decoded = decodeURIComponent(decoded);
    }
    catch {
        throw new SecurityError('Invalid URL encoding in path');
    }
    // Vector 2: Unicode normalization (NFC then replace fullwidth chars)
    let normalized = decoded.normalize('NFC');
    // Replace fullwidth dots and slashes with ASCII equivalents
    normalized = normalized.replace(/\uFF0E/g, '.').replace(/\uFF0F/g, '/');
    // Cross-platform: normalize backslashes to forward slashes before path.join
    // This ensures Windows-style paths (..\..\) are detected as traversal on all platforms
    normalized = normalized.replace(/\\/g, '/');
    // Vector 1: Path normalization (handles ../, ./, etc)
    const joined = path.join(baseDir, normalized);
    const resolvedBase = fs.realpathSync.native(baseDir);
    // Vector 3: Symlink resolution
    let resolved;
    try {
        resolved = fs.realpathSync.native(joined);
    }
    catch (_err) {
        // Path doesn't exist yet - validate parent directory
        const parent = path.dirname(joined);
        if (fs.existsSync(parent)) {
            const resolvedParent = fs.realpathSync.native(parent);
            if (!resolvedParent.startsWith(resolvedBase)) {
                throw new SecurityError('Path traversal detected via parent directory');
            }
            return path.normalize(joined);
        }
        resolved = path.normalize(joined);
    }
    // Boundary check
    if (!resolved.startsWith(resolvedBase)) {
        throw new SecurityError('Path traversal detected: path outside base directory');
    }
    return resolved;
}
//# sourceMappingURL=path-validator.js.map