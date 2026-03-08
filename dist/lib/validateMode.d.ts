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
 *
 * For general path validation, use validatePath() from ./path-validator.ts
 */
export { validatePath, SecurityError } from './path-validator.js';
/**
 * All valid execution mode names (9 total).
 * Derived from src/hooks/mode-registry/index.ts.
 * Note (D-03): PRD originally listed 7 modes; 'swarm' was added, making 8.
 * Note (SEC-H02): 'ralplan' added for path traversal protection.
 */
export declare const VALID_MODES: readonly ["autopilot", "ultrapilot", "team", "pipeline", "ralph", "ultrawork", "ultraqa", "swarm", "ralplan"];
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
export declare function validateMode(mode: unknown): mode is ValidMode;
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
export declare function assertValidMode(mode: unknown): ValidMode;
/**
 * Validate sessionId parameter to prevent path traversal.
 * SessionIds are used in paths like `.omc/state/sessions/${sessionId}/`.
 *
 * @param sessionId - Untrusted session identifier
 * @returns The validated sessionId string
 * @throws {Error} If sessionId contains path traversal sequences
 */
export declare function assertValidSessionId(sessionId: unknown): string;
/**
 * Validate directory parameter to prevent path traversal.
 * Directories are used in state operations and hook processing.
 *
 * @param directory - Untrusted directory path
 * @returns The validated directory string
 * @throws {Error} If directory contains path traversal sequences
 */
export declare function assertValidDirectory(directory: unknown): string;
/**
 * Validate agentId parameter to prevent path traversal.
 * AgentIds are used in session replay paths.
 *
 * @param agentId - Untrusted agent identifier
 * @returns The validated agentId string
 * @throws {Error} If agentId contains path traversal sequences
 */
export declare function assertValidAgentId(agentId: unknown): string;
//# sourceMappingURL=validateMode.d.ts.map