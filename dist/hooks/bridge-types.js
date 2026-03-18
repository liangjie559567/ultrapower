/**
 * Shared types for hook bridge system
 * Extracted to break circular dependency between bridge.ts and bridge-normalize.ts
 */
/**
 * Hook severity levels for error handling
 */
export var HookSeverity;
(function (HookSeverity) {
    HookSeverity["CRITICAL"] = "critical";
    HookSeverity["HIGH"] = "high";
    HookSeverity["LOW"] = "low"; // Failure can continue
})(HookSeverity || (HookSeverity = {}));
/**
 * Severity mapping for each hook type
 */
export const HOOK_SEVERITY = {
    'permission-request': HookSeverity.CRITICAL,
    'pre-tool-use': HookSeverity.CRITICAL,
    'session-end': HookSeverity.HIGH,
    'subagent-start': HookSeverity.HIGH,
    'subagent-stop': HookSeverity.HIGH,
    'setup-init': HookSeverity.HIGH,
    'setup-maintenance': HookSeverity.HIGH,
    'post-tool-use': HookSeverity.LOW,
    'session-start': HookSeverity.LOW,
    'pre-compact': HookSeverity.LOW,
    'keyword-detector': HookSeverity.LOW,
    'stop-continuation': HookSeverity.LOW,
    'ralph': HookSeverity.LOW,
    'persistent-mode': HookSeverity.LOW,
    'autopilot': HookSeverity.LOW,
    'delegation-enforcer': HookSeverity.LOW,
    'omc-orchestrator-pre-tool': HookSeverity.LOW,
    'omc-orchestrator-post-tool': HookSeverity.LOW,
    'user-prompt-submit': HookSeverity.LOW,
    'file-save': HookSeverity.LOW,
    'setup': HookSeverity.HIGH,
    'agent-execution-complete': HookSeverity.LOW,
};
/**
 * Type guard: Check if value is a valid HookType
 */
export function isHookType(value) {
    return typeof value === 'string' && value in HOOK_SEVERITY;
}
/**
 * Type guard: Check if value is a valid HookInput
 */
export function isHookInput(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/**
 * Type guard: Check if value is a valid HookOutput
 */
export function isHookOutput(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const obj = value;
    return typeof obj.continue === 'boolean';
}
/**
 * Type guard: Check if value is a string
 */
export function isString(value) {
    return typeof value === 'string';
}
/**
 * Type guard: Check if value is a non-null object
 */
export function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
//# sourceMappingURL=bridge-types.js.map