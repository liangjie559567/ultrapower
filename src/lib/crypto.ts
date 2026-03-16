import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey(): Buffer {
  const key = process.env.OMC_ENCRYPTION_KEY;
  if (!key) throw new Error('OMC_ENCRYPTION_KEY not set');
  return Buffer.from(key, 'hex');
}

function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function decrypt(encrypted: string): string {
  const key = getKey();
  const buffer = Buffer.from(encrypted, 'base64');

  if (buffer.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted data');
  }

  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const data = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch (err) {
    throw new Error('Decryption failed: data may be corrupted or tampered');
  }
}

function processFields(obj: any, fields: string[], fn: (val: string) => string): any {
  if (!obj || typeof obj !== 'object') return obj;

  const result = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const field of fields) {
    if (field in result && typeof result[field] === 'string') {
      try {
        result[field] = fn(result[field]);
      } catch (err) {
        throw err;
      }
    }
  }

  return result;
}

export function encryptSensitiveFields(data: any, fields: string[]): any {
  return processFields(data, fields, encrypt);
}

export function decryptSensitiveFields(data: any, fields: string[]): any {
  return processFields(data, fields, decrypt);
}
