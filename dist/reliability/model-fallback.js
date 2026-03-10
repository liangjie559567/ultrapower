const MODEL_HIERARCHY = ['opus', 'sonnet', 'haiku'];
export class ModelFallback {
    currentModel;
    enableFallback;
    constructor(config = {}) {
        this.currentModel = config.initialModel ?? 'opus';
        this.enableFallback = config.enableFallback ?? true;
    }
    async execute(fn) {
        let fallbackCount = 0;
        let lastError;
        const startModel = this.currentModel;
        const startIndex = MODEL_HIERARCHY.indexOf(startModel);
        for (let i = startIndex; i < MODEL_HIERARCHY.length; i++) {
            const model = MODEL_HIERARCHY[i];
            try {
                const result = await fn(model);
                return {
                    success: true,
                    result,
                    modelUsed: model,
                    fallbackCount
                };
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (!this.enableFallback || i === MODEL_HIERARCHY.length - 1) {
                    break;
                }
                fallbackCount++;
            }
        }
        return {
            success: false,
            modelUsed: MODEL_HIERARCHY[startIndex + fallbackCount] ?? 'haiku',
            fallbackCount,
            error: lastError
        };
    }
    setModel(model) {
        this.currentModel = model;
    }
    getModel() {
        return this.currentModel;
    }
}
//# sourceMappingURL=model-fallback.js.map