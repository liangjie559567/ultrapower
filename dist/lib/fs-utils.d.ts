/**
 * Cross-platform file system utilities with Windows EPERM retry logic
 */
/**
 * Rename file with Windows EPERM retry logic
 * @param oldPath Source path
 * @param newPath Destination path
 * @param maxRetries Maximum retry attempts (default: 3)
 */
export declare function renameSyncWithRetry(oldPath: string, newPath: string, maxRetries?: number): void;
//# sourceMappingURL=fs-utils.d.ts.map