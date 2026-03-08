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
//# sourceMappingURL=bridge-types.js.map