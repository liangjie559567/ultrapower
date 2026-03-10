/**
 * Type converters for hook inputs
 * Converts normalized camelCase back to snake_case for handlers
 */
import type { SubagentStartInput, SubagentStopInput } from "./subagent-tracker/index.js";
import type { PermissionRequestInput } from "./permission-handler/index.js";
export declare function toSubagentStartInput(normalized: Record<string, unknown>): SubagentStartInput;
export declare function toSubagentStopInput(normalized: Record<string, unknown>): SubagentStopInput;
export declare function toPermissionRequestInput(normalized: Record<string, unknown>): PermissionRequestInput;
//# sourceMappingURL=bridge-converter.d.ts.map