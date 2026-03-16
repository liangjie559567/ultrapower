interface HookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_response?: Record<string, unknown>;
  session_id: string;
  cwd: string;
  hook_event_name: HookEventType;
}
