export declare const stateTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            mode: {
                type: string;
                enum: string[];
                description: string | undefined;
            };
            workingDirectory: {
                type: string;
                description: string | undefined;
            };
            session_id: {
                type: string;
                description: string | undefined;
            };
            active?: undefined;
            iteration?: undefined;
            max_iterations?: undefined;
            current_phase?: undefined;
            task_description?: undefined;
            plan_path?: undefined;
            started_at?: undefined;
            completed_at?: undefined;
            error?: undefined;
            state?: undefined;
        };
        required: string[];
    };
    handler: (args: {
        mode: "autopilot" | "ultrapilot" | "swarm" | "pipeline" | "team" | "ralph" | "ultrawork" | "ultraqa" | "ralplan";
        session_id?: string | undefined;
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
            mode: {
                type: string;
                enum: string[];
                description: string | undefined;
            };
            active: {
                type: string;
                description: string | undefined;
            };
            iteration: {
                type: string;
                description: string | undefined;
            };
            max_iterations: {
                type: string;
                description: string | undefined;
            };
            current_phase: {
                type: string;
                description: string | undefined;
            };
            task_description: {
                type: string;
                description: string | undefined;
            };
            plan_path: {
                type: string;
                description: string | undefined;
            };
            started_at: {
                type: string;
                description: string | undefined;
            };
            completed_at: {
                type: string;
                description: string | undefined;
            };
            error: {
                type: string;
                description: string | undefined;
            };
            state: {
                type: string;
                description: string | undefined;
            };
            workingDirectory: {
                type: string;
                description: string | undefined;
            };
            session_id: {
                type: string;
                description: string | undefined;
            };
        };
        required: string[];
    };
    handler: (args: {
        mode: "autopilot" | "ultrapilot" | "swarm" | "pipeline" | "team" | "ralph" | "ultrawork" | "ultraqa" | "ralplan";
        error?: string | undefined;
        session_id?: string | undefined;
        active?: boolean | undefined;
        workingDirectory?: string | undefined;
        state?: Record<string, unknown> | undefined;
        iteration?: number | undefined;
        completed_at?: string | undefined;
        plan_path?: string | undefined;
        max_iterations?: number | undefined;
        current_phase?: string | undefined;
        task_description?: string | undefined;
        started_at?: string | undefined;
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
            session_id: {
                type: string;
                description: string | undefined;
            };
            mode?: undefined;
            active?: undefined;
            iteration?: undefined;
            max_iterations?: undefined;
            current_phase?: undefined;
            task_description?: undefined;
            plan_path?: undefined;
            started_at?: undefined;
            completed_at?: undefined;
            error?: undefined;
            state?: undefined;
        };
        required?: undefined;
    };
    handler: (args: {
        session_id?: string | undefined;
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
            mode: {
                type: string;
                enum: string[];
                description: string | undefined;
            };
            workingDirectory: {
                type: string;
                description: string | undefined;
            };
            session_id: {
                type: string;
                description: string | undefined;
            };
            active?: undefined;
            iteration?: undefined;
            max_iterations?: undefined;
            current_phase?: undefined;
            task_description?: undefined;
            plan_path?: undefined;
            started_at?: undefined;
            completed_at?: undefined;
            error?: undefined;
            state?: undefined;
        };
        required?: undefined;
    };
    handler: (args: {
        session_id?: string | undefined;
        workingDirectory?: string | undefined;
        mode?: "autopilot" | "ultrapilot" | "swarm" | "pipeline" | "team" | "ralph" | "ultrawork" | "ultraqa" | "ralplan" | undefined;
    }) => Promise<{
        content: Array<{
            type: "text";
            text: string;
        }>;
        isError?: boolean;
    }>;
})[];
//# sourceMappingURL=state-adapter.d.ts.map