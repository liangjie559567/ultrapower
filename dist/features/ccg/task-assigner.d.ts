export type ModelType = 'claude' | 'codex' | 'gemini';
export type ChangeType = 'feature' | 'bugfix' | 'refactor';
export interface TaskAssignment {
    model: ModelType;
    reason: string;
    confidence: number;
}
export declare function assignTask(files: string[], changeType: ChangeType): TaskAssignment;
//# sourceMappingURL=task-assigner.d.ts.map