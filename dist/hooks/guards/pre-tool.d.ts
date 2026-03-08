/**
 * pre-tool.ts — PreToolUse 守卫
 *
 * 注册 PreToolUse 事件，执行权限检查和范围验证。
 */
export interface PreToolContext {
    toolName: string;
    toolInput: Record<string, unknown>;
    sessionId?: string;
}
export interface PreToolResult {
    allowed: boolean;
    reason?: string;
}
export declare function checkPreTool(ctx: PreToolContext): PreToolResult;
export declare function isRestrictedTool(toolName: string): boolean;
//# sourceMappingURL=pre-tool.d.ts.map