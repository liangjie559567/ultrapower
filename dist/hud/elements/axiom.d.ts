/**
 * OMC HUD - Axiom State Element
 *
 * Reads and renders Axiom system state from .omc/axiom/ directory.
 * Displays: current task status, learning queue, workflow metrics, knowledge base count.
 */
export interface AxiomState {
    /** Current state machine status: IDLE / EXECUTING / BLOCKED / PLANNING etc. */
    status: string;
    /** Current goal/task description */
    currentGoal: string | null;
    /** Number of pending items in learning queue */
    learningQueueCount: number;
    /** Highest priority in learning queue (P0/P1/P2/P3) */
    learningQueueTopPriority: string | null;
    /** Number of knowledge base entries */
    knowledgeBaseCount: number;
    /** Overall workflow success rate (0-100) */
    workflowSuccessRate: number | null;
    /** Number of in-progress tasks */
    inProgressCount: number;
    /** Number of pending tasks */
    pendingCount: number;
}
/**
 * Read Axiom state from .omc/axiom/ directory.
 * Returns null if Axiom is not initialized.
 */
export declare function readAxiomStateForHud(directory: string): AxiomState | null;
/**
 * Render Axiom state as a single status line.
 *
 * Format: Axiom:执行中 | 目标:HUD重设计 | 学习队列:3(P1) | 知识库:12条
 */
export declare function renderAxiom(axiom: AxiomState): string | null;
//# sourceMappingURL=axiom.d.ts.map