export declare const astTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            pattern: {
                type: string;
                description: string | undefined;
            };
            language: {
                type: string;
                enum: [string, ...string[]];
                description: string | undefined;
            };
            path: {
                type: string;
                description: string | undefined;
            };
            context: {
                type: string;
                description: string | undefined;
            };
            maxResults: {
                type: string;
                description: string | undefined;
            };
            replacement?: undefined;
            dryRun?: undefined;
        };
        required: string[];
    };
    handler: (args: {
        pattern: string;
        language: string;
        path?: string | undefined;
        context?: number | undefined;
        maxResults?: number | undefined;
    }) => Promise<{
        content: Array<{
            type: "text";
            text: string;
        }>;
    }>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            pattern: {
                type: string;
                description: string | undefined;
            };
            replacement: {
                type: string;
                description: string | undefined;
            };
            language: {
                type: string;
                enum: [string, ...string[]];
                description: string | undefined;
            };
            path: {
                type: string;
                description: string | undefined;
            };
            dryRun: {
                type: string;
                description: string | undefined;
            };
            context?: undefined;
            maxResults?: undefined;
        };
        required: string[];
    };
    handler: (args: {
        pattern: string;
        language: string;
        replacement: string;
        path?: string | undefined;
        dryRun?: boolean | undefined;
    }) => Promise<{
        content: Array<{
            type: "text";
            text: string;
        }>;
    }>;
})[];
//# sourceMappingURL=ast-adapter.d.ts.map