/**
 * State File Encryption (AES-256-GCM)
 *
 * Encrypts sensitive state files with AES-256-GCM.
 * Key storage: environment variable OMC_ENCRYPTION_KEY (32 bytes hex)
 * Format: {iv}:{authTag}:{encryptedData} (all hex-encoded)
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const _AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer | null {
  const keyHex = process.env.OMC_ENCRYPTION_KEY;

  if (!keyHex) {
    return null;
  }

  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('OMC_ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
  }
  return key;
}

/**
 * Encrypt JSON data
 */
export function encryptState(data: unknown): string {
  const key = getEncryptionKey();

  // No encryption if key not set
  if (!key) {
    return JSON.stringify(data, null, 2);
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const jsonStr = JSON.stringify(data);
  const encrypted = Buffer.concat([
    cipher.update(jsonStr, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData (hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt encrypted state
 */
export function decryptState(encrypted: string): unknown {
  const key = getEncryptionKey();
  if (!key) {
    throw new Error('OMC_ENCRYPTION_KEY not set');
  }

  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedData = Buffer.from(parts[2], 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}

/**
 * Check if content is encrypted (starts with hex:hex:hex pattern)
 */
export function isEncrypted(content: string): boolean {
  return /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i.test(content.trim());
}

/**
 * Read and decrypt state file (backward compatible)
 */
export function readEncryptedState(content: string): unknown {
  const trimmed = content.trim();

  // Backward compatibility: if not encrypted, parse as JSON
  if (!isEncrypted(trimmed)) {
    return JSON.parse(trimmed);
  }

  return decryptState(trimmed);
}
