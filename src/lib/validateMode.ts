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

import { auditLogger } from '../audit/logger.js';

export { validatePath, SecurityError } from './path-validator.js';

/**
 * All valid execution mode names (9 total).
 * Derived from src/hooks/mode-registry/index.ts.
 * Note (D-03): PRD originally listed 7 modes; 'swarm' was added, making 8.
 * Note (SEC-H02): 'ralplan' added for path traversal protection.
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
  'ralplan',
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
  if (typeof mode === 'string' && mode.length > 100) {
    throw new Error('Mode name too long');
  }
  if (!validateMode(mode)) {
    const raw = typeof mode === 'string' ? mode : String(mode);
    const display = raw.length > 50 ? `${raw.slice(0, 50)}...(truncated)` : raw;

    // Additional path traversal detection
    if (typeof mode === 'string' && (
      mode.includes('..') ||
      mode.includes('/') ||
      mode.includes('\\') ||
      mode.startsWith('.') ||
      /^[a-zA-Z]:/.test(mode) // Windows absolute path
    )) {
      auditLogger.log({
        actor: 'system',
        action: 'path_validation_failed',
        resource: display,
        result: 'failure',
        metadata: { reason: 'path_traversal_attempt' }
      }).catch(() => {}); // Non-blocking

      throw new Error(
        `Path traversal attempt detected: "${display}". ` +
        `Valid modes are: ${VALID_MODES.join(', ')}`
      );
    }

    auditLogger.log({
      actor: 'system',
      action: 'path_validation_failed',
      resource: display,
      result: 'failure',
      metadata: { reason: 'invalid_mode' }
    }).catch(() => {}); // Non-blocking

    throw new Error(
      `Invalid mode: "${display}". ` +
        `Valid modes are: ${VALID_MODES.join(', ')}`
    );
  }
  return mode;
}

/**
 * Validate sessionId parameter to prevent path traversal.
 * SessionIds are used in paths like `.omc/state/sessions/${sessionId}/`.
 *
 * @param sessionId - Untrusted session identifier
 * @returns The validated sessionId string
 * @throws {Error} If sessionId contains path traversal sequences
 */
export function assertValidSessionId(sessionId: unknown): string {
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    throw new Error('Invalid sessionId: must be a non-empty string');
  }

  if (sessionId.length > 255) {
    throw new Error('Invalid sessionId: exceeds 255 characters');
  }

  const display = sessionId.length > 50 ? `${sessionId.slice(0, 50)}...(truncated)` : sessionId;

  if (
    sessionId.includes('..') ||
    sessionId.includes('/') ||
    sessionId.includes('\\') ||
    /^[a-zA-Z]:/.test(sessionId) ||
    !/^[a-zA-Z0-9_-]+$/.test(sessionId)
  ) {
    auditLogger.log({
      actor: 'system',
      action: 'path_validation_failed',
      resource: display,
      result: 'failure',
      metadata: { reason: 'invalid_session_id' }
    }).catch(() => {});

    throw new Error(`Invalid sessionId: "${display}". Must contain only alphanumeric, hyphens, and underscores`);
  }

  return sessionId;
}

/**
 * Validate directory parameter to prevent path traversal.
 * Directories are used in state operations and hook processing.
 *
 * @param directory - Untrusted directory path
 * @returns The validated directory string
 * @throws {Error} If directory contains path traversal sequences
 */
export function assertValidDirectory(directory: unknown): string {
  if (typeof directory !== 'string' || directory.length === 0) {
    throw new Error('Invalid directory: must be a non-empty string');
  }

  if (directory.length > 255) {
    throw new Error('Invalid directory: exceeds 255 characters');
  }

  const display = directory.length > 50 ? `${directory.slice(0, 50)}...(truncated)` : directory;

  if (directory.includes('..')) {
    auditLogger.log({
      actor: 'system',
      action: 'path_validation_failed',
      resource: display,
      result: 'failure',
      metadata: { reason: 'path_traversal_in_directory' }
    }).catch(() => {});

    throw new Error(`Path traversal detected in directory: "${display}"`);
  }

  return directory;
}

/**
 * Validate agentId parameter to prevent path traversal.
 * AgentIds are used in session replay paths.
 *
 * @param agentId - Untrusted agent identifier
 * @returns The validated agentId string
 * @throws {Error} If agentId contains path traversal sequences
 */
export function assertValidAgentId(agentId: unknown): string {
  if (typeof agentId !== 'string' || agentId.length === 0) {
    throw new Error('Invalid agentId: must be a non-empty string');
  }

  if (agentId.length > 255) {
    throw new Error('Invalid agentId: exceeds 255 characters');
  }

  const display = agentId.length > 50 ? `${agentId.slice(0, 50)}...(truncated)` : agentId;

  if (
    agentId.includes('..') ||
    agentId.includes('/') ||
    agentId.includes('\\') ||
    /^[a-zA-Z]:/.test(agentId) ||
    !/^[a-zA-Z0-9_:-]+$/.test(agentId)
  ) {
    auditLogger.log({
      actor: 'system',
      action: 'path_validation_failed',
      resource: display,
      result: 'failure',
      metadata: { reason: 'invalid_agent_id' }
    }).catch(() => {});

    throw new Error(`Invalid agentId: "${display}". Must contain only alphanumeric, hyphens, underscores, and colons`);
  }

  return agentId;
}
