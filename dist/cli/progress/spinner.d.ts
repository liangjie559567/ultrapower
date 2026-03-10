/**
 * 简单的 CLI 进度指示器
 */
export type SpinnerStatus = 'running' | 'success' | 'error' | 'info';
export declare class Spinner {
    private frames;
    private interval?;
    private frameIndex;
    private text;
    start(text: string): void;
    update(text: string): void;
    stop(status: SpinnerStatus, finalText?: string): void;
}
//# sourceMappingURL=spinner.d.ts.map