/**
 * Encrypt specified string fields in an object.
 * @param data - Object containing fields to encrypt
 * @param fields - Array of field names to encrypt
 * @returns Object with encrypted fields
 */
export declare function encryptSensitiveFields<T>(data: T, fields: string[]): T;
/**
 * Decrypt specified string fields in an object.
 * @param data - Object containing fields to decrypt
 * @param fields - Array of field names to decrypt
 * @returns Object with decrypted fields
 */
export declare function decryptSensitiveFields<T>(data: T, fields: string[]): T;
//# sourceMappingURL=crypto.d.ts.map