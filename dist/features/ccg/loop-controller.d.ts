export interface LoopConfig {
    maxRounds: number;
    timeout: number;
    convergenceCheck: (result: any) => boolean;
}
export interface LoopResult {
    completed: boolean;
    rounds: number;
    reason: 'converged' | 'max_rounds' | 'timeout';
}
export declare class LoopController {
    execute(config: LoopConfig, task: () => Promise<any>): Promise<LoopResult>;
}
//# sourceMappingURL=loop-controller.d.ts.map