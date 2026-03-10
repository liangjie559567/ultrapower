export type ModelTier = 'opus' | 'sonnet' | 'haiku';
export interface ModelFallbackConfig {
    initialModel?: ModelTier;
    enableFallback?: boolean;
}
export interface FallbackResult<T> {
    success: boolean;
    result?: T;
    modelUsed: ModelTier;
    fallbackCount: number;
    error?: Error;
}
export declare class ModelFallback {
    private currentModel;
    private enableFallback;
    constructor(config?: ModelFallbackConfig);
    execute<T>(fn: (model: ModelTier) => Promise<T>): Promise<FallbackResult<T>>;
    setModel(model: ModelTier): void;
    getModel(): ModelTier;
}
//# sourceMappingURL=model-fallback.d.ts.map