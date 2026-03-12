export function requiredKeysForHook(hookType: string): string[] {
  switch (hookType) {
    case "session-end":
    case "subagent-start":
    case "subagent-stop":
    case "pre-compact":
    case "setup-init":
    case "setup-maintenance":
    case "ralph":
    case "persistent-mode":
    case "session-start":
      return ["sessionId", "directory"];
    case "permission-request":
      return ["sessionId", "directory", "toolName"];
    case "pre-tool-use":
    case "post-tool-use":
      return ["directory", "toolName"];
    case "autopilot":
      return ["directory"];
    case "user-prompt-submit":
      return ["prompt", "directory"];
    case "keyword-detector":
    case "stop-continuation":
      return [];
    default:
      return [];
  }
}

export function validateHookInput<T>(
  input: unknown,
  requiredFields: string[],
  hookType?: string,
): input is T {
  if (typeof input !== "object" || input === null) return false;
  const obj = input as Record<string, unknown>;
  const missing = requiredFields.filter(
    (field) => !(field in obj) || obj[field] === undefined,
  );
  if (missing.length > 0) {
    console.error(
      `[hook-bridge] validateHookInput failed for "${hookType ?? "unknown"}": missing keys: ${missing.join(", ")}`,
    );
    return false;
  }
  return true;
}

let _cachedSkipHooks: string[] | null = null;

export function getSkipHooks(): string[] {
  if (_cachedSkipHooks === null) {
    _cachedSkipHooks = process.env.OMC_SKIP_HOOKS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  }
  return _cachedSkipHooks;
}

export function resetSkipHooksCache(): void {
  _cachedSkipHooks = null;
}
