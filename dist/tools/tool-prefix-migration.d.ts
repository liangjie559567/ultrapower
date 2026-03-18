/**
 * Tool Prefix Migration System
 *
 * Handles migration from legacy underscore names to ultrapower: prefix
 * Provides deprecation warnings and dual registration
 */
import { z } from 'zod';
export interface GenericToolDefinition {
    name: string;
    description: string;
    schema: z.ZodRawShape;
    handler: (args: unknown) => Promise<{
        content: Array<{
            type: 'text';
            text: string;
        }>;
        isError?: boolean;
    }>;
}
export interface DeprecationInfo {
    oldName: string;
    newName: string;
    deprecatedSince: string;
    removalVersion: string;
}
export declare function createDeprecationWarning(info: DeprecationInfo): string;
export declare function wrapWithDeprecation<T extends GenericToolDefinition>(tool: T): T;
export declare function createPrefixedTool<T extends GenericToolDefinition>(tool: T): T;
export declare function registerToolWithBothNames<T extends GenericToolDefinition>(tool: T): T[];
//# sourceMappingURL=tool-prefix-migration.d.ts.map