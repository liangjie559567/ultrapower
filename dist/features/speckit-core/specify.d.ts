/**
 * Specification Generator - 基于 constitution 生成功能规范
 */
import type { Constitution, Specification } from './types.js';
export declare function generateSpecification(feature: string, constitution: Constitution, projectPath?: string): Promise<Specification>;
export declare function formatSpecification(spec: Specification): string;
//# sourceMappingURL=specify.d.ts.map