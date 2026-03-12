/**
 * Type converters for hook inputs
 * Converts normalized camelCase back to snake_case for handlers
 */

import type { SubagentStartInput, SubagentStopInput } from "./subagent-tracker/index.js";
import type { PermissionRequestInput } from "./permission-handler/index.js";

export function toSubagentStartInput(normalized: Record<string, unknown>): SubagentStartInput {
  return {
    cwd: (normalized.directory ?? normalized.cwd) as string,
    session_id: (normalized.sessionId ?? normalized.session_id) as string,
    agent_id: normalized.agent_id as string,
    agent_type: normalized.agent_type as string,
    transcript_path: normalized.transcript_path as string,
    permission_mode: normalized.permission_mode as string,
    hook_event_name: "SubagentStart",
    prompt: normalized.prompt as string | undefined,
    model: normalized.model as string | undefined,
  };
}

export function toSubagentStopInput(normalized: Record<string, unknown>): SubagentStopInput {
  return {
    cwd: (normalized.directory ?? normalized.cwd) as string,
    session_id: (normalized.sessionId ?? normalized.session_id) as string,
    agent_id: normalized.agent_id as string,
    agent_type: normalized.agent_type as string,
    transcript_path: normalized.transcript_path as string,
    permission_mode: normalized.permission_mode as string,
    hook_event_name: "SubagentStop",
    output: normalized.output as string | undefined,
    success: normalized.success as boolean | undefined,
  };
}

export function toPermissionRequestInput(normalized: Record<string, unknown>): PermissionRequestInput {
  return {
    session_id: (normalized.sessionId ?? normalized.session_id) as string,
    cwd: (normalized.directory ?? normalized.cwd) as string,
    tool_name: (normalized.toolName ?? normalized.tool_name) as string,
    tool_input: (normalized.toolInput ?? normalized.tool_input) as PermissionRequestInput['tool_input'],
    tool_use_id: (normalized.toolUseId ?? normalized.tool_use_id) as string,
    transcript_path: (normalized.transcriptPath ?? normalized.transcript_path) as string,
    permission_mode: (normalized.permissionMode ?? normalized.permission_mode) as string,
    hook_event_name: 'PermissionRequest',
  };
}
