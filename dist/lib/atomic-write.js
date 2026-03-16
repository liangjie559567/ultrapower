/**
 * Atomic, durable file writes for ultrapower.
 * Self-contained module with no external dependencies.
 */
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import * as crypto from "crypto";
/**
 * Create directory recursively (inline implementation).
 * Ensures parent directories exist before creating the target directory.
 *
 * @param dir Directory path to create
 */
export function ensureDirSync(dir) {
    if (fsSync.existsSync(dir)) {
        return;
    }
    try {
        fsSync.mkdirSync(dir, { recursive: true });
    }
    catch (err) {
        // If directory was created by another process between exists check and mkdir,
        // that's fine - verify it exists now
        if (err.code === "EEXIST") {
            return;
        }
        throw err;
    }
}
/**
 * Write JSON data atomically to a file.
 * Uses temp file + atomic rename pattern to ensure durability.
 *
 * @param filePath Target file path
 * @param data Data to serialize as JSON
 * @throws Error if JSON serialization fails or write operation fails
 */
export async function atomicWriteJson(filePath, data) {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);
    const tempPath = path.join(dir, `.${base}.tmp.${crypto.randomUUID()}`);
    let success = false;
    try {
        // Ensure parent directory exists
        ensureDirSync(dir);
        // Serialize data to JSON
        const jsonContent = JSON.stringify(data, null, 2);
        // Write to temp file with exclusive creation (wx = O_CREAT | O_EXCL | O_WRONLY)
        const fd = await fs.open(tempPath, "wx", 0o600);
        try {
            await fd.write(jsonContent, 0, "utf-8");
            // Sync file data to disk before rename
            await fd.sync();
        }
        finally {
            await fd.close();
        }
        // Atomic rename - replaces target file if it exists
        // On Windows, fs.rename uses MoveFileExW with MOVEFILE_REPLACE_EXISTING
        await fs.rename(tempPath, filePath);
        success = true;
        // Best-effort directory fsync to ensure rename is durable
        try {
            const dirFd = await fs.open(dir, "r");
            try {
                await dirFd.sync();
            }
            finally {
                await dirFd.close();
            }
        }
        catch {
            // Some platforms don't support directory fsync - that's okay
        }
    }
    finally {
        // Clean up temp file on error
        if (!success) {
            await fs.unlink(tempPath).catch(() => { });
        }
    }
}
/**
 * Write text content atomically to a file (synchronous version).
 * Uses temp file + atomic rename pattern to ensure durability.
 *
 * @param filePath Target file path
 * @param content Text content to write
 * @throws Error if write operation fails
 */
export function atomicWriteSync(filePath, content) {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);
    const tempPath = path.join(dir, `.${base}.tmp.${crypto.randomUUID()}`);
    let success = false;
    try {
        // Ensure parent directory exists
        ensureDirSync(dir);
        // Write to temp file with exclusive creation
        const fd = fsSync.openSync(tempPath, 'wx', 0o600);
        try {
            fsSync.writeSync(fd, content, 0, 'utf-8');
            // Sync file data to disk before rename
            fsSync.fsyncSync(fd);
        }
        finally {
            fsSync.closeSync(fd);
        }
        // Atomic rename with retry on Windows EPERM
        let renamed = false;
        for (let attempt = 0; attempt < 3 && !renamed; attempt++) {
            try {
                fsSync.renameSync(tempPath, filePath);
                renamed = true;
            }
            catch (err) {
                const error = err;
                if (error.code === 'EPERM' && attempt < 2) {
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
        success = true;
        // Best-effort directory fsync to ensure rename is durable
        try {
            const dirFd = fsSync.openSync(dir, 'r');
            try {
                fsSync.fsyncSync(dirFd);
            }
            finally {
                fsSync.closeSync(dirFd);
            }
        }
        catch {
            // Some platforms don't support directory fsync - that's okay
        }
    }
    finally {
        // Clean up temp file on error
        if (!success) {
            try {
                fsSync.unlinkSync(tempPath);
            }
            catch {
                // Ignore cleanup errors
            }
        }
    }
}
/**
 * Read and parse JSON file with error handling.
 * Returns null if file doesn't exist or on parse errors.
 *
 * @param filePath Path to JSON file
 * @returns Parsed JSON data or null on error
 */
/**
 * Write string data atomically to a file (synchronous version).
 * Uses temp file + atomic rename pattern with fsync for durability.
 *
 * @param filePath Target file path
 * @param content String content to write
 * @throws Error if write operation fails
 */
export function atomicWriteFileSync(filePath, content) {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);
    const tempPath = path.join(dir, `.${base}.tmp.${crypto.randomUUID()}`);
    let fd = null;
    let success = false;
    try {
        // Ensure parent directory exists
        ensureDirSync(dir);
        // Open temp file with exclusive creation (O_CREAT | O_EXCL | O_WRONLY)
        fd = fsSync.openSync(tempPath, "wx", 0o600);
        // Write content
        fsSync.writeSync(fd, content, 0, "utf-8");
        // Sync file data to disk before rename
        fsSync.fsyncSync(fd);
        // Close before rename
        fsSync.closeSync(fd);
        fd = null;
        // Ensure target directory exists before rename (Windows race condition fix)
        ensureDirSync(dir);
        // Atomic rename with retry on Windows EPERM
        let renamed = false;
        for (let attempt = 0; attempt < 3 && !renamed; attempt++) {
            try {
                fsSync.renameSync(tempPath, filePath);
                renamed = true;
            }
            catch (err) {
                const error = err;
                if (error.code === 'EPERM' && attempt < 2) {
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
        success = true;
        // Best-effort directory fsync to ensure rename is durable
        try {
            const dirFd = fsSync.openSync(dir, "r");
            try {
                fsSync.fsyncSync(dirFd);
            }
            finally {
                fsSync.closeSync(dirFd);
            }
        }
        catch {
            // Some platforms don't support directory fsync - that's okay
        }
    }
    finally {
        // Close fd if still open
        if (fd !== null) {
            try {
                fsSync.closeSync(fd);
            }
            catch {
                // Ignore close errors
            }
        }
        // Clean up temp file on error
        if (!success) {
            try {
                fsSync.unlinkSync(tempPath);
            }
            catch {
                // Ignore cleanup errors
            }
        }
    }
}
/**
 * Write JSON data atomically to a file (synchronous version).
 * Uses temp file + atomic rename pattern with fsync for durability.
 *
 * @param filePath Target file path
 * @param data Data to serialize as JSON
 * @throws Error if JSON serialization fails or write operation fails
 */
export function atomicWriteJsonSync(filePath, data) {
    const jsonContent = JSON.stringify(data, null, 2);
    atomicWriteFileSync(filePath, jsonContent);
}
export async function safeReadJson(filePath) {
    try {
        // Read file content (throws ENOENT if file doesn't exist)
        const content = await fs.readFile(filePath, "utf-8");
        // Parse JSON (throws SyntaxError if content is corrupted)
        return JSON.parse(content);
    }
    catch (err) {
        const error = err;
        // File doesn't exist - expected absence, return null silently
        if (error.code === "ENOENT") {
            return null;
        }
        // File exists but is corrupted (parse error, permission error, etc.)
        // Re-throw so callers can distinguish corruption from absence
        throw err;
    }
}
/**
 * Write JSON data atomically with retry mechanism (synchronous version).
 * Retries up to 3 times with exponential backoff on failure.
 *
 * @param filePath Target file path
 * @param data Data to serialize as JSON
 * @param maxRetries Maximum retry attempts (default: 3)
 * @throws Error if all retry attempts fail
 */
export function atomicWriteJsonSyncWithRetry(filePath, data, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            atomicWriteJsonSync(filePath, data);
            return;
        }
        catch (error) {
            if (attempt === maxRetries - 1) {
                throw error;
            }
            // Exponential backoff: 100ms, 200ms, 400ms
            const delayMs = 100 * Math.pow(2, attempt);
            const start = Date.now();
            while (Date.now() - start < delayMs) {
                // Busy wait (sync sleep)
            }
        }
    }
}
//# sourceMappingURL=atomic-write.js.map