export type ProjectType = 'new' | 'old';
export interface DetectionResult {
    type: ProjectType;
    confidence: number;
    reason: string;
}
export declare function detectProjectType(workingDir: string, manualType?: ProjectType): Promise<DetectionResult>;
export declare function clearCache(): void;
//# sourceMappingURL=project-detector.d.ts.map