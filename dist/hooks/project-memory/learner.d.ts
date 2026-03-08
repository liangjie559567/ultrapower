/**
 * Project Memory Learner
 * Incrementally learns from PostToolUse events
 */
type FileToolInput = {
    file_path?: string;
    filePath?: string;
};
type PathToolInput = {
    path?: string;
};
type BashToolInput = {
    command?: string;
};
type ToolInput = FileToolInput | PathToolInput | BashToolInput | Record<string, unknown>;
/**
 * Learn from tool output and update project memory
 *
 * @param toolName - Name of the tool that was executed
 * @param toolInput - Input parameters to the tool
 * @param toolOutput - Output from the tool
 * @param projectRoot - Project root directory
 * @param userMessage - Optional user message for directive detection
 */
export declare function learnFromToolOutput(toolName: string, toolInput: ToolInput, toolOutput: string, projectRoot: string, userMessage?: string): Promise<void>;
/**
 * Manually add a custom note to project memory
 *
 * @param projectRoot - Project root directory
 * @param category - Note category (build, test, deploy, env, etc.)
 * @param content - Note content
 */
export declare function addCustomNote(projectRoot: string, category: string, content: string): Promise<void>;
export {};
//# sourceMappingURL=learner.d.ts.map