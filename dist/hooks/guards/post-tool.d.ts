/**
 * post-tool.ts — PostToolUse 守卫
 *
 * 注册 PostToolUse 事件，更新 .omc/axiom/active_context.md。
 */
export interface PostToolContext {
    toolName: string;
    toolInput: Record<string, unknown>;
    toolResponse?: unknown;
    sessionId?: string;
}
export declare class PostToolGuard {
    private readonly activeContextFile;
    constructor(baseDir?: string);
    onToolUse(ctx: PostToolContext): Promise<void>;
    private appendActivity;
}
//# sourceMappingURL=post-tool.d.ts.map