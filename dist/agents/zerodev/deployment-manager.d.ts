export interface DeploymentConfig {
    type: 'docker' | 'kubernetes' | 'serverless';
    config: Record<string, any>;
}
export declare function generateDeploymentConfig(platform: string, techStack: string[]): DeploymentConfig;
//# sourceMappingURL=deployment-manager.d.ts.map