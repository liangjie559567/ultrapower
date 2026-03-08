/**
 * Race Condition Detector
 *
 * 检测并发 Hook 执行中的竞态条件
 */
export interface RaceDetectorOptions {
    onRaceDetected?: (conflict: RaceConflict) => void;
    logPath?: string;
}
export interface RaceConflict {
    type: 'file-read-write' | 'file-write-write' | 'env-race';
    resource: string;
    hooks: string[];
    timestamp: number;
}
export declare class RaceDetector {
    private fileAccess;
    private envAccess;
    private conflicts;
    private onRaceDetected?;
    constructor(options?: RaceDetectorOptions);
    /**
     * 记录文件访问
     */
    recordFileAccess(hookType: string, filePath: string, accessType: 'read' | 'write'): void;
    /**
     * 记录环境变量访问
     */
    recordEnvAccess(hookType: string, envVar: string): void;
    /**
     * 检测文件访问冲突
     */
    private detectFileConflict;
    /**
     * 检测环境变量冲突
     */
    private detectEnvConflict;
    /**
     * 检查是否有竞态冲突
     */
    hasConflicts(): boolean;
    /**
     * 获取所有冲突
     */
    getConflicts(): RaceConflict[];
    /**
     * 清除记录
     */
    reset(): void;
}
//# sourceMappingURL=race-detector.d.ts.map