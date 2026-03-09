export interface TechStack {
    frontend?: 'react' | 'vue' | 'angular' | 'svelte' | 'none';
    backend?: 'express' | 'fastify' | 'nestjs' | 'none';
    language: 'typescript' | 'javascript' | 'mixed';
    buildTool?: 'vite' | 'webpack' | 'rollup';
}
export declare function detectTechStack(workingDir: string): Promise<TechStack>;
//# sourceMappingURL=tech-stack-detector.d.ts.map