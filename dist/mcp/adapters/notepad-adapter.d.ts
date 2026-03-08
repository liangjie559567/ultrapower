export declare const notepadTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            section: {
                type: string;
                enum: [string, ...string[]];
                description: string | undefined;
            };
            workingDirectory: {
                type: string;
                description: string | undefined;
            };
            content?: undefined;
            daysOld?: undefined;
        };
        required?: undefined;
    };
    handler: (args: {
        workingDirectory?: string | undefined;
        section?: string | undefined;
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
            content: {
                type: string;
                description: string | undefined;
            };
            workingDirectory: {
                type: string;
                description: string | undefined;
            };
            section?: undefined;
            daysOld?: undefined;
        };
        required: string[];
    };
    handler: (args: {
        content: string;
        workingDirectory?: string | undefined;
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
            daysOld: {
                type: string;
                description: string | undefined;
            };
            workingDirectory: {
                type: string;
                description: string | undefined;
            };
            section?: undefined;
            content?: undefined;
        };
        required?: undefined;
    };
    handler: (args: {
        workingDirectory?: string | undefined;
        daysOld?: number | undefined;
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
            workingDirectory: {
                type: string;
                description: string | undefined;
            };
            section?: undefined;
            content?: undefined;
            daysOld?: undefined;
        };
        required?: undefined;
    };
    handler: (args: {
        workingDirectory?: string | undefined;
    }) => Promise<{
        content: Array<{
            type: "text";
            text: string;
        }>;
        isError?: boolean;
    }>;
})[];
//# sourceMappingURL=notepad-adapter.d.ts.map