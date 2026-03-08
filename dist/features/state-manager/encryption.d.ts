/**
 * State File Encryption (AES-256-GCM)
 *
 * Encrypts sensitive state files with AES-256-GCM.
 * Key storage: environment variable OMC_ENCRYPTION_KEY (32 bytes hex)
 * Format: {iv}:{authTag}:{encryptedData} (all hex-encoded)
 */
/**
 * Encrypt JSON data
 */
export declare function encryptState(data: unknown): string;
/**
 * Decrypt encrypted state
 */
export declare function decryptState(encrypted: string): unknown;
/**
 * Check if content is encrypted (starts with hex:hex:hex pattern)
 */
export declare function isEncrypted(content: string): boolean;
/**
 * Read and decrypt state file (backward compatible)
 */
export declare function readEncryptedState(content: string): unknown;
//# sourceMappingURL=encryption.d.ts.map