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

const MODEL_HIERARCHY: ModelTier[] = ['opus', 'sonnet', 'haiku'];

export class ModelFallback {
  private currentModel: ModelTier;
  private enableFallback: boolean;

  constructor(config: ModelFallbackConfig = {}) {
    this.currentModel = config.initialModel ?? 'opus';
    this.enableFallback = config.enableFallback ?? true;
  }

  async execute<T>(
    fn: (model: ModelTier) => Promise<T>
  ): Promise<FallbackResult<T>> {
    let fallbackCount = 0;
    let lastError: Error | undefined;
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
      } catch (error) {
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

  setModel(model: ModelTier): void {
    this.currentModel = model;
  }

  getModel(): ModelTier {
    return this.currentModel;
  }
}
