interface VersionInfo {
    filename: string;
    version: string;
    major: number;
    minor: number;
    patch: number;
    createdAt: string;
}
export declare function parseVersion(filename: string, filePath?: string): Promise<VersionInfo | null>;
export declare function getLatestVersion(dir: string, baseName: string): Promise<VersionInfo | null>;
export {};
//# sourceMappingURL=versioning.d.ts.map