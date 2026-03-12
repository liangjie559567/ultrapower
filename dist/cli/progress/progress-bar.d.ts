/**
 * 简单的进度条
 */
export interface ProgressOptions {
    total: number;
    width?: number;
    format?: string;
}
export declare class ProgressBar {
    private current;
    private readonly total;
    private readonly width;
    constructor(options: ProgressOptions);
    update(current: number, text?: string): void;
    increment(text?: string): void;
}
//# sourceMappingURL=progress-bar.d.ts.map