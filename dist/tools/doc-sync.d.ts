import { z } from 'zod';
declare const DocSyncSchema: z.ZodObject<{
    sourceFile: z.ZodString;
    targetDoc: z.ZodString;
    section: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sourceFile: string;
    targetDoc: string;
    section?: string | undefined;
}, {
    sourceFile: string;
    targetDoc: string;
    section?: string | undefined;
}>;
export declare const docSyncTool: {
    name: string;
    description: string;
    schema: {
        sourceFile: z.ZodString;
        targetDoc: z.ZodString;
        section: z.ZodOptional<z.ZodString>;
    };
    handler: (args: z.infer<typeof DocSyncSchema>) => Promise<{
        content: {
            type: "text";
            text: string;
        }[];
        isError?: undefined;
    } | {
        content: {
            type: "text";
            text: string;
        }[];
        isError: boolean;
    }>;
};
export {};
//# sourceMappingURL=doc-sync.d.ts.map