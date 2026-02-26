/**
 * Usage Tracker
 *
 * Tracks agent/skill usage counts and persists metrics to
 * .omc/axiom/evolution/usage_metrics.json
 */

import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { atomicWriteJson } from '../../lib/atomic-write.js';
import { isAxiomEnabled } from '../axiom-boot/storage.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UsageEvent {
  toolName: string;
  agentRole?: string;
  skillName?: string;
  timestamp: number;
  sessionId: string;
}

export interface AgentStats {
  totalCalls: number;
  lastUsed: string;
  sessions: string[]; // de-duped sessionId list, max 50
}

export interface ToolStats {
  totalCalls: number;
  lastUsed: string;
}

export interface UsageMetrics {
  version: 1;
  lastUpdated: string;
  agents: Record<string, AgentStats>;
  skills: Record<string, AgentStats>;
  tools: Record<string, ToolStats>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const METRICS_RELATIVE_PATH = '.omc/axiom/evolution/usage_metrics.json';
const MAX_SESSIONS = 50;
const MAX_KEY_LENGTH = 128;
const MAX_TOOL_ENTRIES = 500;
const MAX_AGENT_ENTRIES = 200;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMetricsPath(directory: string): string {
  return join(directory, METRICS_RELATIVE_PATH);
}

function createEmptyMetrics(): UsageMetrics {
  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    agents: {},
    skills: {},
    tools: {},
  };
}

function loadMetrics(metricsPath: string): UsageMetrics {
  try {
    if (!existsSync(metricsPath)) {
      return createEmptyMetrics();
    }
    const raw = readFileSync(metricsPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<UsageMetrics>;
    // Ensure all required keys exist (forward-compat guard)
    return {
      version: 1,
      lastUpdated: parsed.lastUpdated ?? new Date().toISOString(),
      agents: parsed.agents ?? {},
      skills: parsed.skills ?? {},
      tools: parsed.tools ?? {},
    };
  } catch {
    return createEmptyMetrics();
  }
}

function sanitizeKey(key: string): string {
  return key.slice(0, MAX_KEY_LENGTH);
}

function upsertAgentStats(
  record: Record<string, AgentStats>,
  key: string,
  sessionId: string,
  now: string,
  maxEntries: number
): void {
  const safeKey = sanitizeKey(key);
  if (!(safeKey in record) && Object.keys(record).length >= maxEntries) {
    return; // cap total entries
  }
  const existing = record[safeKey] ?? { totalCalls: 0, lastUsed: now, sessions: [] };
  existing.totalCalls += 1;
  existing.lastUsed = now;

  // De-duplicate and cap sessions list, keeping the most recently seen sessionIds.
  // Delete-then-add ensures the current sessionId moves to the end of insertion order.
  const sessionSet = new Set(existing.sessions);
  sessionSet.delete(sessionId);
  sessionSet.add(sessionId);
  const sessionsArray = Array.from(sessionSet);
  existing.sessions = sessionsArray.length > MAX_SESSIONS
    ? sessionsArray.slice(sessionsArray.length - MAX_SESSIONS)
    : sessionsArray;

  record[safeKey] = existing;
}

function upsertToolStats(
  record: Record<string, ToolStats>,
  key: string,
  now: string
): void {
  const safeKey = sanitizeKey(key);
  if (!(safeKey in record) && Object.keys(record).length >= MAX_TOOL_ENTRIES) {
    return; // cap total entries
  }
  const existing = record[safeKey] ?? { totalCalls: 0, lastUsed: now };
  existing.totalCalls += 1;
  existing.lastUsed = now;
  record[safeKey] = existing;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract agent role from tool input.
 * Strips the "ultrapower:" prefix if present.
 */
export function extractAgentRole(
  _toolName: string,
  toolInput: unknown
): string | undefined {
  if (toolInput === null || typeof toolInput !== 'object') return undefined;
  const input = toolInput as Record<string, unknown>;

  const raw =
    (typeof input['subagent_type'] === 'string' ? input['subagent_type'] : undefined) ??
    (typeof input['agent_role'] === 'string' ? input['agent_role'] : undefined);

  if (!raw) return undefined;
  return raw.startsWith('ultrapower:') ? raw.slice('ultrapower:'.length) : raw;
}

/**
 * Extract skill name from tool input.
 * Only applies when toolName === 'Task' and toolInput.skill is present.
 */
export function extractSkillName(
  toolName: string,
  toolInput: unknown
): string | undefined {
  if (toolName !== 'Task') return undefined;
  if (toolInput === null || typeof toolInput !== 'object') return undefined;
  const input = toolInput as Record<string, unknown>;
  return typeof input['skill'] === 'string' ? input['skill'] : undefined;
}

/**
 * Record a usage event to disk.
 * Silently swallows all errors.
 */
export async function recordUsage(
  directory: string,
  event: UsageEvent
): Promise<void> {
  try {
    if (!isAxiomEnabled(directory)) return;

    const metricsPath = getMetricsPath(directory);

    const metrics = loadMetrics(metricsPath);
    const now = new Date(event.timestamp).toISOString();

    // Track tool
    upsertToolStats(metrics.tools, event.toolName, now);

    // Track agent role
    if (event.agentRole) {
      upsertAgentStats(metrics.agents, event.agentRole, event.sessionId, now, MAX_AGENT_ENTRIES);
    }

    // Track skill
    if (event.skillName) {
      upsertAgentStats(metrics.skills, event.skillName, event.sessionId, now, MAX_AGENT_ENTRIES);
    }

    metrics.lastUpdated = now;

    await atomicWriteJson(metricsPath, metrics);
  } catch {
    // Silent failure — usage tracking must never break the main flow
  }
}
