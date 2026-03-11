export declare function archiveOldDocuments(sourceDir: string, archiveBaseDir: string, maxCount?: number): Promise<{
    archived: string[];
    errors: string[];
}>;
export declare function archiveByAge(sourceDir: string, archiveBaseDir: string): Promise<{
    archived: string[];
    errors: string[];
}>;
//# sourceMappingURL=archiver.d.ts.map