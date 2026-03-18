export interface LibraryAnalysis {
    name: string;
    license: string;
    compatible: boolean;
    risk: 'low' | 'medium' | 'high';
}
export declare function analyzeLibrary(libraryName: string, projectLicense?: string): LibraryAnalysis;
//# sourceMappingURL=opensource-analyzer.d.ts.map