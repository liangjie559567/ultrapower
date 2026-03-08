import { z } from 'zod';
declare const DependencyAnalyzerSchema: z.ZodObject<{
    filePath: z.ZodString;
    depth: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    filePath: string;
    depth?: number | undefined;
}, {
    filePath: string;
    depth?: number | undefined;
}>;
export declare const dependencyAnalyzerTool: {
    name: string;
    description: string;
    schema: {
        filePath: z.ZodString;
        depth: z.ZodOptional<z.ZodNumber>;
    };
    handler: (args: z.infer<typeof DependencyAnalyzerSchema>) => Promise<{
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
//# sourceMappingURL=dependency-analyzer.d.ts.map