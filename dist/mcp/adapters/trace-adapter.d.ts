export declare const traceTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            sessionId: {
                type: string;
                description: string | undefined;
            };
            filter: {
                type: string;
                enum: ["all", "hooks", "skills", "agents", "keywords", "tools", "modes"];
                description: string | undefined;
            };
            last: {
                type: string;
                description: string | undefined;
            };
            workingDirectory: {
                type: string;
                description: string | undefined;
            };
        };
    };
    handler: (args: {
        filter?: "skills" | "modes" | "tools" | "all" | "hooks" | "agents" | "keywords" | undefined;
        workingDirectory?: string | undefined;
        sessionId?: string | undefined;
        last?: number | undefined;
    }) => Promise<{
        content: Array<{
            type: "text";
            text: string;
        }>;
        isError?: boolean;
    }>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            sessionId: {
                type: string;
                description: string | undefined;
            };
            workingDirectory: {
                type: string;
                description: string | undefined;
            };
            filter?: undefined;
            last?: undefined;
        };
    };
    handler: (args: {
        workingDirectory?: string | undefined;
        sessionId?: string | undefined;
    }) => Promise<{
        content: Array<{
            type: "text";
            text: string;
        }>;
        isError?: boolean;
    }>;
})[];
//# sourceMappingURL=trace-adapter.d.ts.map