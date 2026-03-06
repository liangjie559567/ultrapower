import { validateEnvName, validateEnvValue } from '../../lib/env-validator.js';

/**
 * Replace environment variables in string
 * Supports ${VAR_NAME} syntax
 */
export function replaceEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, varName) => {
    // Validate variable name (whitelist check)
    const nameValidation = validateEnvName(varName);
    if (!nameValidation.valid) return '';

    const envValue = process.env[varName];
    if (!envValue) return '';

    // Validate value for injection patterns
    const valueValidation = validateEnvValue(envValue, varName);
    return valueValidation.valid ? envValue : '';
  });
}

/**
 * Replace environment variables in object recursively
 */
export function replaceEnvVarsInObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return replaceEnvVars(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(replaceEnvVarsInObject) as T;
  }

  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceEnvVarsInObject(value);
    }
    return result as T;
  }

  return obj;
}
