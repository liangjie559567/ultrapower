export interface HookInput {
  sessionId?: string;
  session_id?: string;
  prompt?: string;
  message?: { content?: string };
  parts?: Array<{ type: string; text?: string }>;
  toolName?: string;
  tool_name?: string;
  toolInput?: unknown;
  tool_input?: unknown;
  toolOutput?: unknown;
  tool_response?: unknown;
  directory?: string;
  cwd?: string;
  hook_event_name?: string;
  [key: string]: unknown;
}
