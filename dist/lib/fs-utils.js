/**
 * Cross-platform file system utilities with Windows EPERM retry logic
 */
import { renameSync as fsRenameSync } from 'fs';
/**
 * Rename file with Windows EPERM retry logic
 * @param oldPath Source path
 * @param newPath Destination path
 * @param maxRetries Maximum retry attempts (default: 3)
 */
export function renameSyncWithRetry(oldPath, newPath, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            fsRenameSync(oldPath, newPath);
            return;
        }
        catch (err) {
            const error = err;
            if (error.code === 'EPERM' && attempt < maxRetries - 1) {
                const delayMs = 50 * (attempt + 1);
                const start = Date.now();
                while (Date.now() - start < delayMs) {
                    // Busy wait for Windows file lock retry
                }
            }
            else {
                throw err;
            }
        }
    }
}
//# sourceMappingURL=fs-utils.js.map