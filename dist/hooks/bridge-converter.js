/**
 * Type converters for hook inputs
 * Converts normalized camelCase back to snake_case for handlers
 */
export function toSubagentStartInput(normalized) {
    return {
        cwd: (normalized.directory ?? normalized.cwd),
        session_id: (normalized.sessionId ?? normalized.session_id),
        agent_id: normalized.agent_id,
        agent_type: normalized.agent_type,
        transcript_path: normalized.transcript_path,
        permission_mode: normalized.permission_mode,
        hook_event_name: "SubagentStart",
        prompt: normalized.prompt,
        model: normalized.model,
    };
}
export function toSubagentStopInput(normalized) {
    return {
        cwd: (normalized.directory ?? normalized.cwd),
        session_id: (normalized.sessionId ?? normalized.session_id),
        agent_id: normalized.agent_id,
        agent_type: normalized.agent_type,
        transcript_path: normalized.transcript_path,
        permission_mode: normalized.permission_mode,
        hook_event_name: "SubagentStop",
        output: normalized.output,
        success: normalized.success,
    };
}
export function toPermissionRequestInput(normalized) {
    return {
        session_id: (normalized.sessionId ?? normalized.session_id),
        cwd: (normalized.directory ?? normalized.cwd),
        tool_name: (normalized.toolName ?? normalized.tool_name),
        tool_input: (normalized.toolInput ?? normalized.tool_input),
        tool_use_id: (normalized.toolUseId ?? normalized.tool_use_id),
        transcript_path: (normalized.transcriptPath ?? normalized.transcript_path),
        permission_mode: (normalized.permissionMode ?? normalized.permission_mode),
        hook_event_name: 'PermissionRequest',
    };
}
//# sourceMappingURL=bridge-converter.js.map