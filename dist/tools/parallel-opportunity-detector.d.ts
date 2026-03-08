import { z } from 'zod';
declare const ParallelOpportunitySchema: z.ZodObject<{
    tasks: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        dependencies?: string[] | undefined;
    }, {
        id: string;
        dependencies?: string[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    tasks: {
        id: string;
        dependencies?: string[] | undefined;
    }[];
}, {
    tasks: {
        id: string;
        dependencies?: string[] | undefined;
    }[];
}>;
export declare const parallelOpportunityDetectorTool: {
    name: string;
    description: string;
    schema: {
        tasks: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            dependencies?: string[] | undefined;
        }, {
            id: string;
            dependencies?: string[] | undefined;
        }>, "many">;
    };
    handler: (args: z.infer<typeof ParallelOpportunitySchema>) => Promise<{
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
//# sourceMappingURL=parallel-opportunity-detector.d.ts.map