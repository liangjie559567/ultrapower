export declare class ToolTracker {
    private _queue;
    startCall(opts: {
        session_id: string;
        tool_name: string;
        parent_run_id?: string;
    }): string;
    endCall(id: string, success: boolean, error_msg?: string): void;
}
export declare const toolTracker: ToolTracker;
//# sourceMappingURL=tool-tracker.d.ts.map