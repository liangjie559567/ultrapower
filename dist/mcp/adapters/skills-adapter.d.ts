export declare const skillsTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            projectRoot: {
                type: string;
                description: string | undefined;
            };
        };
    };
    handler: (args: {
        projectRoot?: string;
    }) => Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            projectRoot?: undefined;
        };
    };
    handler: (_args: Record<string, never>) => Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
})[];
//# sourceMappingURL=skills-adapter.d.ts.map