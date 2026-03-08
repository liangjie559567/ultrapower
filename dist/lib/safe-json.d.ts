/**
 * Safe JSON parsing with error handling
 */
export interface SafeJsonResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}
/**
 * Safely parse JSON with error handling
 * @param content - JSON string to parse
 * @param filePath - Optional file path for error messages
 * @returns Parsed data or error information
 */
export declare function safeJsonParse<T = unknown>(content: string, filePath?: string): SafeJsonResult<T>;
//# sourceMappingURL=safe-json.d.ts.map