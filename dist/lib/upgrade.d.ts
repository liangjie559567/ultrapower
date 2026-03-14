/**
 * Complete Upgrade Workflow
 * Handles all installation methods and cache clearing
 */
export interface UpgradeResult {
    success: boolean;
    version: string;
    method: string;
    message: string;
}
export declare function performUpgrade(): Promise<UpgradeResult>;
//# sourceMappingURL=upgrade.d.ts.map