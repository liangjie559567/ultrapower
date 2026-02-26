/**
 * Mode parameter validation for ultrapower.
 * Prevents path traversal attacks by enforcing a strict whitelist of valid mode names.
 *
 * Security boundary: mode values are used to construct file paths like
 * `.omc/state/${mode}-state.json`. Direct string interpolation without
 * validation would allow path traversal (e.g., mode = "../../etc/passwd").
 *
 * Source of truth: src/hooks/mode-registry/index.ts
 * Spec: docs/standards/runtime-protection.md §2.4
 */

/**
 * All valid execution mode names (8 total).
 * Derived from src/hooks/mode-registry/index.ts.
 * Note (D-03): PRD originally listed 7 modes; 'swarm' was added, making 8.
 */
export const VALID_MODES = [
  'autopilot',
  'ultrapilot',
  'team',
  'pipeline',
  'ralph',
  'ultrawork',
  'ultraqa',
  'swarm',
] as const;

/** Union type of all valid mode strings. */
export type ValidMode = (typeof VALID_MODES)[number];

/**
 * Check whether a string is a valid mode name.
 *
 * @param mode - Untrusted input to validate
 * @returns `true` if `mode` is one of the 8 valid modes, `false` otherwise
 *
 * @example
 * validateMode('autopilot') // true
 * validateMode('../../etc') // false
 * validateMode('')          // false
 */
export function validateMode(mode: unknown): mode is ValidMode {
  return typeof mode === 'string' && (VALID_MODES as readonly string[]).includes(mode);
}

/**
 * Assert that a string is a valid mode name, throwing on invalid input.
 * Use this when constructing file paths from user-supplied mode values.
 *
 * @param mode - Untrusted input to validate
 * @returns The validated mode string (narrowed to `ValidMode`)
 * @throws {Error} If `mode` is not a valid mode name
 *
 * @example
 * // Safe path construction
 * const validMode = assertValidMode(mode);
 * const stateFilePath = `.omc/state/${validMode}-state.json`;
 *
 * // ❌ Never do this — path traversal risk:
 * // const stateFilePath = `.omc/state/${mode}-state.json`;
 */
export function assertValidMode(mode: unknown): ValidMode {
  if (!validateMode(mode)) {
    throw new Error(
      `Invalid mode: ${JSON.stringify(mode)}. ` +
        `Valid modes are: ${VALID_MODES.join(', ')}`
    );
  }
  return mode;
}
