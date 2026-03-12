/**
 * Workflow Gate Hook
 *
 * Enforces superpowers workflow discipline by detecting when users
 * skip required steps and automatically injecting the correct skill.
 *
 * Workflow stages:
 * 1. brainstorming (required before any implementation)
 * 2. writing-plans (required after brainstorming)
 * 3. using-git-worktrees (recommended before execution)
 * 4. execution (subagent-driven-development or executing-plans)
 * 5. requesting-code-review (required before completion)
 * 6. verification-before-completion (required before merge)
 */
export interface WorkflowState {
    brainstormingComplete: boolean;
    planWritten: boolean;
    worktreeCreated: boolean;
    testsWritten: boolean;
    executionStarted: boolean;
    reviewRequested: boolean;
    codeReviewComplete: boolean;
    securityReviewComplete: boolean;
    performanceReviewComplete: boolean;
    verificationComplete: boolean;
    lastStage: string;
    timestamp: number;
}
export interface WorkflowGateInput {
    type: 'UserPromptSubmit';
    prompt: string;
    workingDirectory: string;
}
export interface WorkflowGateOutput {
    success: boolean;
    shouldBlock: boolean;
    injectedSkill?: string;
    message?: string;
}
/**
 * Get workflow state file path
 */
export declare function getWorkflowStatePath(workingDir: string): string;
/**
 * Read current workflow state
 */
export declare function readWorkflowState(workingDir: string): WorkflowState | null;
/**
 * Write workflow state
 */
export declare function writeWorkflowState(workingDir: string, state: WorkflowState): void;
/**
 * Initialize workflow state
 */
export declare function initWorkflowState(workingDir: string): WorkflowState;
/**
 * Detect implementation keywords that require brainstorming first
 */
export declare function detectImplementationIntent(prompt: string): boolean;
/**
 * Detect plan execution keywords
 */
export declare function detectExecutionIntent(prompt: string): boolean;
/**
 * Check if brainstorming skill was just completed
 */
export declare function detectBrainstormingComplete(prompt: string): boolean;
/**
 * Check if plan was just written
 */
export declare function detectPlanComplete(prompt: string): boolean;
/**
 * Check if tests were just written
 */
export declare function detectTestsComplete(prompt: string): boolean;
/**
 * Check if code review was completed
 */
export declare function detectCodeReviewComplete(prompt: string): boolean;
/**
 * Check if security review was completed
 */
export declare function detectSecurityReviewComplete(prompt: string): boolean;
/**
 * Check if performance review was completed
 */
export declare function detectPerformanceReviewComplete(prompt: string): boolean;
/**
 * Detect if prompt contains security-sensitive keywords
 */
export declare function detectSecuritySensitive(prompt: string): boolean;
/**
 * Detect if prompt contains performance-sensitive keywords
 */
export declare function detectPerformanceSensitive(prompt: string): boolean;
/**
 * Detect if user is trying to use executing-plans or subagent-driven-development
 */
export declare function detectPlanExecutionSkill(prompt: string): boolean;
/**
 * Detect if user is asking a vague question that needs brainstorming
 */
export declare function detectVagueRequest(prompt: string): boolean;
/**
 * Suggest next step based on current workflow state
 */
export declare function suggestNextStep(state: WorkflowState): string | null;
/**
 * Process workflow gate check
 */
export declare function processWorkflowGate(input: WorkflowGateInput): WorkflowGateOutput;
/**
 * Clear workflow state (for testing or manual reset)
 */
export declare function clearWorkflowState(workingDir: string): void;
//# sourceMappingURL=index.d.ts.map