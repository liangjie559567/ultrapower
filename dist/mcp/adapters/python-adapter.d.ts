export declare const pythonTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            action: {
                type: string;
                enum: string[];
                description: string | undefined;
            };
            researchSessionID: {
                type: string;
                description: string | undefined;
            };
            code: {
                type: string;
                description: string | undefined;
            };
            executionLabel: {
                type: string;
                description: string | undefined;
            };
            executionTimeout: {
                type: string;
                description: string | undefined;
            };
            queueTimeout: {
                type: string;
                description: string | undefined;
            };
            projectDir: {
                type: string;
                description: string | undefined;
            };
        };
        required: string[];
    };
    handler: (args: unknown) => Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
}[];
//# sourceMappingURL=python-adapter.d.ts.map