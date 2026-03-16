/**
 * Type converters for hook inputs
 * Converts normalized camelCase back to snake_case for handlers
 */
import type { SubagentStartInput, SubagentStopInput } from "./subagent-tracker/index.js";
import type { PermissionRequestInput } from "./permission-handler/index.js";
import type { SessionEndInput } from "./session-end/index.js";
import type { PreCompactInput } from "./pre-compact/index.js";
import type { SetupInput } from "./setup/index.js";
import type { WorkflowGateInput } from "./workflow-gate/index.js";
export declare function toSubagentStartInput(normalized: Record<string, unknown>): SubagentStartInput;
export declare function toSubagentStopInput(normalized: Record<string, unknown>): SubagentStopInput;
export declare function toPermissionRequestInput(normalized: Record<string, unknown>): PermissionRequestInput;
export declare function toSessionEndInput(normalized: Record<string, unknown>): SessionEndInput;
export declare function toPreCompactInput(normalized: Record<string, unknown>): PreCompactInput;
export declare function toSetupInput(normalized: Record<string, unknown>): SetupInput;
export declare function toWorkflowGateInput(normalized: Record<string, unknown>): WorkflowGateInput;
//# sourceMappingURL=bridge-converter.d.ts.map