/**
 * Hook Input Normalization
 *
 * Handles snake_case -> camelCase field mapping for Claude Code hook inputs.
 * Claude Code sends snake_case fields: tool_name, tool_input, tool_response,
 * session_id, cwd, hook_event_name. This module normalizes them to camelCase
 * with snake_case-first fallback.
 *
 * Uses Zod for structural validation to catch malformed inputs early.
 * Sensitive hooks use strict allowlists; others pass through unknown fields.
 */

import { z } from 'zod';
import type { HookInput } from './bridge-types.js';
import * as logger from '../lib/logger.js';
import { auditLog } from '../lib/auditLog.js';

// --- Zod schemas for hook input validation ---

/** Base schema fields */
const baseSchemaFields = {
  // snake_case fields from Claude Code
  tool_name: z.string().optional(),
  tool_input: z.unknown().optional(),
  tool_response: z.unknown().optional(),
  session_id: z.string().optional(),
  cwd: z.string().optional(),
  hook_event_name: z.string().optional(),

  // camelCase fields (fallback / already normalized)
  toolName: z.string().optional(),
  toolInput: z.unknown().optional(),
  toolOutput: z.unknown().optional(),
  toolResponse: z.unknown().optional(),
  sessionId: z.string().optional(),
  directory: z.string().optional(),
  hookEventName: z.string().optional(),

  // Fields that are the same in both conventions
  prompt: z.string().optional(),
  message: z.object({ content: z.string().optional() }).optional(),
  parts: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional(),

  // Stop hook fields
  stop_reason: z.string().optional(),
  stopReason: z.string().optional(),
  user_requested: z.boolean().optional(),
  userRequested: z.boolean().optional(),

  // Permission hook fields
  permission_mode: z.string().optional(),
  tool_use_id: z.string().optional(),
  transcript_path: z.string().optional(),

  // Subagent fields
  agent_id: z.string().optional(),
  agent_name: z.string().optional(),
  agent_type: z.string().optional(),
  parent_session_id: z.string().optional(),

  // Common extra fields
  input: z.unknown().optional(),
  output: z.unknown().optional(),
  result: z.unknown().optional(),
  error: z.unknown().optional(),
  status: z.string().optional(),
};

/** Schema for non-sensitive hooks (allows unknown fields) */
const HookInputSchema = z.object(baseSchemaFields).passthrough();

/** Strict schema for sensitive hooks (rejects unknown fields) */
const StrictHookInputSchema = z.object(baseSchemaFields).strict();

/**
 * Raw hook input as received from Claude Code (snake_case fields)
 */
interface RawHookInput {
  // snake_case fields from Claude Code
  tool_name?: string;
  tool_input?: unknown;
  tool_response?: unknown;
  session_id?: string;
  cwd?: string;
  hook_event_name?: string;

  // camelCase fields (fallback / already normalized)
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  toolResponse?: unknown;
  sessionId?: string;
  directory?: string;
  hookEventName?: string;

  // Fields that are the same in both conventions
  prompt?: string;
  message?: { content?: string };
  parts?: Array<{ type: string; text?: string }>;

  // Allow other fields to pass through
  [key: string]: unknown;
}

// --- Security: Hook sensitivity classification ---

/** Hooks where unknown fields are dropped (strict allowlist only) */
const SENSITIVE_HOOKS = new Set([
  'permission-request',
  'setup-init',
  'setup-maintenance',
  'session-end',
]);

/** Strict whitelist: allowed fields per HookType (camelCase, post-normalization) */
const STRICT_WHITELIST: Record<string, string[]> = {
  'permission-request': ['sessionId', 'toolName', 'toolInput', 'directory', 'permission_mode', 'tool_use_id', 'transcript_path', 'agent_id'],
  'setup-init': ['sessionId', 'directory'],
  'setup-maintenance': ['sessionId', 'directory'],
  'session-end': ['sessionId', 'directory'],
  'tool-call': ['toolName', 'toolInput', 'timestamp'],
  'tool-response': ['toolName', 'toolOutput', 'success', 'error', 'duration'],
  'agent-start': ['agent_type', 'agent_id', 'prompt'],
  'agent-stop': ['agent_id', 'success', 'output', 'duration'],
  'session-start': ['sessionId', 'directory', 'timestamp'],
  'message-sent': ['message', 'role', 'timestamp'],
  'state-change': ['mode', 'from_state', 'to_state', 'timestamp'],
  'error-occurred': ['error', 'context', 'timestamp', 'severity'],
  'file-read': ['file_path', 'success'],
  'file-write': ['file_path', 'success', 'bytes_written'],
  'custom-hook': ['hook_name', 'data'],
};

/** Required keys per HookType (camelCase, post-normalization) */
const REQUIRED_KEYS: Record<string, string[]> = {
  'session-end': ['sessionId', 'directory'],
  'permission-request': ['toolName'],
};

/** All known camelCase field names the system uses (post-normalization) */
const KNOWN_FIELDS = new Set([
  // Core normalized fields
  'sessionId', 'toolName', 'toolInput', 'toolOutput', 'directory',
  'prompt', 'message', 'parts', 'hookEventName',
  // Stop hook fields
  'stop_reason', 'stopReason', 'user_requested', 'userRequested',
  // Permission hook fields
  'permission_mode', 'tool_use_id', 'transcript_path',
  // Subagent fields
  'agent_id', 'agent_name', 'agent_type', 'parent_session_id',
  // Common extra fields from Claude Code
  'input', 'output', 'result', 'error', 'status',
]);

// --- Fast-path detection ---

/** Typical camelCase keys that indicate already-normalized input */
const CAMEL_CASE_MARKERS = new Set(['sessionId', 'toolName', 'directory']);

/** Check if any key in the object contains an underscore (snake_case indicator) */
function hasSnakeCaseKeys(obj: Record<string, unknown>): boolean {
  for (const key of Object.keys(obj)) {
    if (key.includes('_')) return true;
  }
  return false;
}

/** Check if input is already camelCase-normalized and can skip Zod parsing */
function isAlreadyCamelCase(obj: Record<string, unknown>): boolean {
  // Must have at least one camelCase marker key
  let hasMarker = false;
  for (const marker of CAMEL_CASE_MARKERS) {
    if (marker in obj) {
      hasMarker = true;
      break;
    }
  }
  if (!hasMarker) return false;
  // Must have no snake_case keys
  return !hasSnakeCaseKeys(obj);
}

/**
 * Handle fast-path normalization for already-camelCase input
 */
function normalizeFastPath(rawObj: Record<string, unknown>, hookType?: string): HookInput {
  const normalized = {
    sessionId: rawObj.sessionId as string | undefined,
    toolName: rawObj.toolName as string | undefined,
    toolInput: rawObj.toolInput,
    toolOutput: rawObj.toolOutput ?? rawObj.toolResponse,
    directory: rawObj.directory as string | undefined,
    prompt: rawObj.prompt as string | undefined,
    message: rawObj.message as HookInput['message'],
    parts: rawObj.parts as HookInput['parts'],
    ...filterPassthrough(rawObj, hookType),
  } as HookInput;

  if (hookType && REQUIRED_KEYS[hookType]) {
    validateRequiredKeys(normalized as Record<string, unknown>, hookType);
  }

  return normalized;
}

/**
 * Validate input with Zod schema
 */
function validateWithZod(input: unknown, isSensitive: boolean, hookType?: string): RawHookInput {
  const schema = isSensitive ? StrictHookInputSchema : HookInputSchema;
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    const errorMsg = `[bridge-normalize] Zod validation failed: ${parsed.error.issues.map(i => i.message).join(', ')}`;
    if (isSensitive) {
      throw new Error(`${errorMsg} (hook: ${hookType})`);
    }
    console.error(errorMsg);
  }

  return (parsed.success ? parsed.data : input) as RawHookInput;
}

/**
 * Map snake_case fields to camelCase
 */
function mapFieldsToCamelCase(input: RawHookInput, hookType?: string): HookInput {
  return {
    sessionId: input.session_id ?? input.sessionId,
    toolName: input.tool_name ?? input.toolName,
    toolInput: input.tool_input ?? input.toolInput,
    toolOutput: input.tool_response ?? input.toolOutput ?? input.toolResponse,
    directory: input.cwd ?? input.directory,
    prompt: input.prompt,
    message: input.message,
    parts: input.parts,
    ...filterPassthrough(input, hookType),
    cwd: input.cwd ?? input.directory,
  } as HookInput;
}

/**
 * Normalize hook input from Claude Code's snake_case format to the
 * camelCase HookInput interface used internally.
 *
 * Validates the input structure with Zod, then maps snake_case to camelCase.
 * Always reads snake_case first with camelCase fallback, per the
 * project convention documented in MEMORY.md.
 *
 * @param raw - Raw hook input (may be snake_case, camelCase, or mixed)
 * @param hookType - Optional hook type for sensitivity-aware filtering
 */
export function normalizeHookInput(raw: unknown, hookType?: string): HookInput {
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }

  const rawObj = raw as Record<string, unknown>;
  const isSensitive = hookType != null && SENSITIVE_HOOKS.has(hookType);

  // Fast path for already-camelCase non-sensitive input only
  // Sensitive hooks MUST go through full Zod validation + whitelist filtering
  if (!isSensitive && isAlreadyCamelCase(rawObj)) {
    return normalizeFastPath(rawObj, hookType);
  }

  // Audit suspicious camelCase input on sensitive hooks
  if (isSensitive && isAlreadyCamelCase(rawObj)) {
    auditLog('security', {
      timestamp: new Date().toISOString(),
      event: 'validation_failed',
      severity: 'medium',
      details: { hookType, reason: 'camelCase input on sensitive hook bypassed fast-path' },
    });
  }

  // Pre-filter sensitive hooks before validation
  const inputToValidate = isSensitive
    ? preFilterSensitiveInput(rawObj, hookType!)
    : raw;

  // Validate with Zod
  const input = validateWithZod(inputToValidate, isSensitive, hookType);

  // Map fields to camelCase
  const normalized = mapFieldsToCamelCase(input, hookType);

  // Validate required keys for sensitive hooks
  if (hookType && SENSITIVE_HOOKS.has(hookType)) {
    validateRequiredKeys(normalized as Record<string, unknown>, hookType);
  }

  return normalized;
}

/**
 * Validate required keys for sensitive hooks (post-normalization).
 * Throws if any required key is missing.
 */
function validateRequiredKeys(normalized: Record<string, unknown>, hookType: string): void {
  const required = REQUIRED_KEYS[hookType];
  if (!required) return;

  const missing = required.filter(key => !(key in normalized) || normalized[key] === undefined);
  if (missing.length > 0) {
    throw new Error(`[bridge-normalize] Missing required keys for ${hookType}: ${missing.join(', ')}`);
  }
}

/**
 * Pre-filter sensitive hook input to remove unknown fields before Zod validation.
 * This prevents Zod strict mode from throwing on unknown fields.
 * Also blocks prototype pollution attempts.
 */
function preFilterSensitiveInput(input: Record<string, unknown>, hookType: string): Record<string, unknown> {
  const whitelist = STRICT_WHITELIST[hookType] || [];
  const filtered: Record<string, unknown> = {};
  const droppedKeys: string[] = [];
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

  // Include all base schema fields (both snake_case and camelCase)
  const allowedKeys = new Set([
    ...Object.keys(baseSchemaFields),
    ...whitelist,
  ]);

  for (const [key, value] of Object.entries(input)) {
    // Block prototype pollution
    if (dangerousKeys.includes(key)) {
      auditLog('security', {
        timestamp: new Date().toISOString(),
        event: 'prototype_pollution_attempt',
        severity: 'high',
        details: { hookType, field: key },
      });
      droppedKeys.push(key);
      continue;
    }

    if (allowedKeys.has(key)) {
      filtered[key] = value;
    } else {
      droppedKeys.push(key);
    }
  }

  if (droppedKeys.length > 0) {
    console.warn(`[bridge-normalize] Dropped unknown fields for sensitive hook "${hookType}": ${droppedKeys.join(', ')}`);
  }

  return filtered;
}

/** Keys that are already mapped in normalization */
const MAPPED_KEYS = new Set([
  'tool_name', 'toolName',
  'tool_input', 'toolInput',
  'tool_response', 'toolOutput', 'toolResponse',
  'session_id', 'sessionId',
  'cwd', 'directory',
  'hook_event_name', 'hookEventName',
  'prompt', 'message', 'parts',
]);

/**
 * Check if a field should be included in passthrough
 */
function shouldIncludeField(key: string, value: unknown): boolean {
  return !MAPPED_KEYS.has(key) && value !== undefined;
}

/**
 * Handle sensitive hook field filtering
 */
function filterSensitiveField(key: string, value: unknown, hookType: string): [string, unknown] | null {
  const whitelist = STRICT_WHITELIST[hookType] || [];
  if (whitelist.includes(key)) {
    return [key, value];
  }
  logger.security('field_filtered', { hookType, field: key });
  console.warn(`[bridge-normalize] [SECURITY] Dropped unknown field "${key}" for hook "${hookType}"`);
  return null;
}

/**
 * Handle non-sensitive hook field filtering
 */
function filterNonSensitiveField(key: string, value: unknown, hookType?: string): [string, unknown] {
  if (!KNOWN_FIELDS.has(key)) {
    console.debug(`[bridge-normalize] Unknown field "${key}" passed through for hook "${hookType ?? 'unknown'}"`);
  }
  return [key, value];
}

/**
 * Filter passthrough fields based on hook type whitelist.
 *
 * - Hooks with defined whitelist: only allow STRICT_WHITELIST (drop everything else)
 * - Hooks without whitelist: pass through unknown fields with a debug warning
 */
function filterPassthrough(input: Record<string, unknown>, hookType?: string): Record<string, unknown> {
  const hasWhitelist = hookType != null && STRICT_WHITELIST[hookType] != null;
  const extra: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (!shouldIncludeField(key, value)) continue;

    const result = hasWhitelist
      ? filterSensitiveField(key, value, hookType!)
      : filterNonSensitiveField(key, value, hookType);

    if (result) {
      extra[result[0]] = result[1];
    }
  }
  return extra;
}

// --- Test helpers (exported for testing only) ---
export { SENSITIVE_HOOKS, KNOWN_FIELDS, STRICT_WHITELIST, REQUIRED_KEYS, isAlreadyCamelCase, HookInputSchema };
