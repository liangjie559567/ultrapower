export declare const memoryTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            section: {
                type: string;
                enum: string[];
                description: string | undefined;
            };
            workingDirectory: {
                type: string;
                description: string | undefined;
            };
            memory?: undefined;
            merge?: undefined;
            category?: undefined;
            content?: undefined;
            directive?: undefined;
            context?: undefined;
            priority?: undefined;
        };
        required?: undefined;
    };
    handler: (args: {
        workingDirectory?: string | undefined;
        section?: "all" | "build" | "techStack" | "conventions" | "structure" | "notes" | "directives" | undefined;
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
            memory: {
                type: string;
                description: string | undefined;
            };
            merge: {
                type: string;
                description: string | undefined;
            };
            workingDirectory: {
                type: string;
                description: string | undefined;
            };
            section?: undefined;
            category?: undefined;
            content?: undefined;
            directive?: undefined;
            context?: undefined;
            priority?: undefined;
        };
        required: string[];
    };
    handler: (args: {
        memory: Record<string, unknown>;
        workingDirectory?: string | undefined;
        merge?: boolean | undefined;
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
            category: {
                type: string;
                description: string | undefined;
            };
            content: {
                type: string;
                description: string | undefined;
            };
            workingDirectory: {
                type: string;
                description: string | undefined;
            };
            section?: undefined;
            memory?: undefined;
            merge?: undefined;
            directive?: undefined;
            context?: undefined;
            priority?: undefined;
        };
        required: string[];
    };
    handler: (args: {
        content: string;
        category: string;
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
            directive: {
                type: string;
                description: string | undefined;
            };
            context: {
                type: string;
                description: string | undefined;
            };
            priority: {
                type: string;
                enum: string[];
                description: string | undefined;
            };
            workingDirectory: {
                type: string;
                description: string | undefined;
            };
            section?: undefined;
            memory?: undefined;
            merge?: undefined;
            category?: undefined;
            content?: undefined;
        };
        required: string[];
    };
    handler: (args: {
        directive: string;
        priority?: "high" | "normal" | undefined;
        context?: string | undefined;
        workingDirectory?: string | undefined;
    }) => Promise<{
        content: Array<{
            type: "text";
            text: string;
        }>;
        isError?: boolean;
    }>;
})[];
//# sourceMappingURL=memory-adapter.d.ts.map