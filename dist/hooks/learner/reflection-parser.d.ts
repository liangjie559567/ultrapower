/**
 * reflection-parser.ts — 反思日志块解析器
 *
 * 将 .omc/axiom/reflection_log.md 按 "## 反思" 块边界解析，
 * 返回按日期倒序排列的 ReflectionBlock 数组。
 */
export interface ReflectionBlock {
    /** "## 反思 - YYYY-MM-DD ..." 标题行 */
    header: string;
    /** 该块的原始内容（含 --- 分隔符） */
    rawContent: string;
    /** 从标题提取的日期字符串 "YYYY-MM-DD" */
    date: string;
    /** 是否为空条目 */
    isEmpty: boolean;
}
/**
 * 解析反思日志文本，返回按日期倒序排列的块数组。
 *
 * 块边界规则：
 * - 以 /^## 反思/m 开头的行作为块起始
 * - 块之间的 --- 分隔符归属前一块（包含在前一块的 rawContent 中）
 * - 文件头部非 "## 反思" 的内容（如 "# Reflection Log"）被跳过
 */
export declare function parseReflectionLog(text: string): ReflectionBlock[];
//# sourceMappingURL=reflection-parser.d.ts.map