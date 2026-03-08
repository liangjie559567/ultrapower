export declare class ProgressBar {
    private current;
    private total;
    private label;
    start(total: number, label: string): void;
    increment(step?: number): void;
    complete(): void;
    private render;
}
export declare const progressBar: ProgressBar;
//# sourceMappingURL=progress-bar.d.ts.map