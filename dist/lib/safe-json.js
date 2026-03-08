/**
 * Safe JSON parsing with error handling
 */
/**
 * Safely parse JSON with error handling
 * @param content - JSON string to parse
 * @param filePath - Optional file path for error messages
 * @returns Parsed data or error information
 */
export function safeJsonParse(content, filePath) {
    try {
        const data = JSON.parse(content);
        return { success: true, data };
    }
    catch (error) {
        const errorMsg = filePath
            ? `Failed to parse JSON from ${filePath}: ${error instanceof Error ? error.message : String(error)}`
            : `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`;
        return { success: false, error: errorMsg };
    }
}
//# sourceMappingURL=safe-json.js.map