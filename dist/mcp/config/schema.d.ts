/**
 * MCP Server Configuration Schema
 */
import { z } from 'zod';
export declare const MCPServerConfigSchema: z.ZodObject<{
    command: z.ZodString;
    args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    disabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    autoApprove: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    command: string;
    disabled: boolean;
    autoApprove: string[];
    env?: Record<string, string> | undefined;
    args?: string[] | undefined;
}, {
    command: string;
    env?: Record<string, string> | undefined;
    args?: string[] | undefined;
    disabled?: boolean | undefined;
    autoApprove?: string[] | undefined;
}>;
export type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>;
export declare const MCPConfigSchema: z.ZodObject<{
    mcpServers: z.ZodRecord<z.ZodString, z.ZodObject<{
        command: z.ZodString;
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        disabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        autoApprove: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    }, "strip", z.ZodTypeAny, {
        command: string;
        disabled: boolean;
        autoApprove: string[];
        env?: Record<string, string> | undefined;
        args?: string[] | undefined;
    }, {
        command: string;
        env?: Record<string, string> | undefined;
        args?: string[] | undefined;
        disabled?: boolean | undefined;
        autoApprove?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    mcpServers: Record<string, {
        command: string;
        disabled: boolean;
        autoApprove: string[];
        env?: Record<string, string> | undefined;
        args?: string[] | undefined;
    }>;
}, {
    mcpServers: Record<string, {
        command: string;
        env?: Record<string, string> | undefined;
        args?: string[] | undefined;
        disabled?: boolean | undefined;
        autoApprove?: string[] | undefined;
    }>;
}>;
export type MCPConfig = z.infer<typeof MCPConfigSchema>;
//# sourceMappingURL=schema.d.ts.map