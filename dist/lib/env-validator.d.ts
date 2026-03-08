/**
 * Environment variable validation for sensitive operations.
 * Prevents injection attacks and enforces whitelist policies.
 *
 * Spec: docs/standards/runtime-protection.md §2.5
 */
export interface ValidationResult {
    valid: boolean;
    reason?: string;
}
/**
 * Validate environment variable name against whitelist.
 */
export declare function validateEnvName(name: string): ValidationResult;
/**
 * Validate environment variable value for injection patterns.
 */
export declare function validateEnvValue(value: string, varName: string): ValidationResult;
/**
 * Safely get environment variable with validation.
 * @throws {Error} If variable name is not whitelisted or value contains injection patterns
 */
export declare function getValidatedEnv(name: string): string | undefined;
/**
 * Add custom environment variable to whitelist (for plugin/extension use).
 */
export declare function addToWhitelist(name: string): void;
//# sourceMappingURL=env-validator.d.ts.map