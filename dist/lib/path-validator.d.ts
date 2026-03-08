/**
 * Path traversal protection for ultrapower.
 * Handles URL encoding, Unicode normalization, symlinks, null bytes, and double encoding.
 *
 * Spec: docs/standards/runtime-protection.md §2.1-2.3
 */
export declare class SecurityError extends Error {
    constructor(message: string);
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
export declare function validatePath(userPath: string, baseDir: string): string;
//# sourceMappingURL=path-validator.d.ts.map