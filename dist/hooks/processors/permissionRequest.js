import * as logger from "../../lib/logger.js";
export async function processPermissionRequest(input) {
    // D-05: Fail-safe logic - only allow if explicitly successful
    if (input.result && input.result.success === true) {
        return { continue: true };
    }
    // Block on: null, undefined, success !== true, or missing result
    logger.security('permission_blocked', { result: input.result });
    const errorDetails = input.result?.error;
    const reason = errorDetails
        ? `权限验证失败: ${JSON.stringify(errorDetails)}`
        : '权限验证失败，操作已阻止';
    return {
        continue: false,
        reason,
        message: '❌ 权限验证失败，操作已阻止。请检查文件权限或联系管理员。'
    };
}
//# sourceMappingURL=permissionRequest.js.map