interface PackageInfo {
    type: 'npm' | 'uvx' | 'docker';
    name: string;
}
export declare class MCPInstaller {
    isOfficialServer(packageName: string): boolean;
    getInstallCommand(pkg: PackageInfo): string;
}
export {};
//# sourceMappingURL=installer.d.ts.map