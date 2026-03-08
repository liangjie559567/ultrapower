/**
 * reflection-parser.ts — 反思日志块解析器
 *
 * 将 .omc/axiom/reflection_log.md 按 "## 反思" 块边界解析，
 * 返回按日期倒序排列的 ReflectionBlock 数组。
 */
/**
 * 解析反思日志文本，返回按日期倒序排列的块数组。
 *
 * 块边界规则：
 * - 以 /^## 反思/m 开头的行作为块起始
 * - 块之间的 --- 分隔符归属前一块（包含在前一块的 rawContent 中）
 * - 文件头部非 "## 反思" 的内容（如 "# Reflection Log"）被跳过
 */
export function parseReflectionLog(text) {
    const lines = text.split('\n');
    // 找到所有 "## 反思" 块起始行索引
    const blockStarts = [];
    for (let i = 0; i < lines.length; i++) {
        if (/^## 反思/.test(lines[i])) {
            blockStarts.push(i);
        }
    }
    if (blockStarts.length === 0) {
        return [];
    }
    const blocks = [];
    for (let bi = 0; bi < blockStarts.length; bi++) {
        const startLine = blockStarts[bi];
        // 块结束：下一个 "## 反思" 块起始行之前（不含），或文件末尾
        const endLine = bi + 1 < blockStarts.length ? blockStarts[bi + 1] : lines.length;
        const header = lines[startLine];
        const rawContent = lines.slice(startLine, endLine).join('\n');
        const date = extractDate(header);
        const isEmpty = isEmptyBlock(rawContent);
        blocks.push({ header, rawContent, date, isEmpty });
    }
    // 按日期倒序排列（最新的在前）
    blocks.sort((a, b) => {
        if (a.date > b.date)
            return -1;
        if (a.date < b.date)
            return 1;
        return 0;
    });
    return blocks;
}
/**
 * 从标题行提取日期字符串 "YYYY-MM-DD"。
 * 标题格式示例：
 *   "## 反思 - 2026-02-27 15:28（会话：xxx）"
 *   "## 2026-02-11 Reflection (Session: xxx)"
 */
function extractDate(header) {
    const m = header.match(/(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : '';
}
/**
 * 判断一个块是否为空条目。
 *
 * 三个核心小节均无有效内容时返回 true：
 *   - "### ✅ 做得好的" 或 "### 做得好的"
 *   - "### ⚠️ 待改进" 或 "### 待改进"
 *   - "### 💡 学到了什么" 或 "### 学到了什么"
 *
 * 有效内容 = 排除以下内容后仍有文本：
 *   - 空行
 *   - 纯 "-" 占位符（只有 "-" 的行）
 *   - "(无)" 占位符
 *   - HTML 注释 <!-- ... -->
 */
function isEmptyBlock(rawContent) {
    const sectionPatterns = [
        /^### (?:✅\s*)?做得好的/m,
        /^### (?:⚠️\s*)?待改进/m,
        /^### (?:💡\s*)?学到了什么/m,
    ];
    for (const pattern of sectionPatterns) {
        if (hasSectionContent(rawContent, pattern)) {
            return false;
        }
    }
    return true;
}
/**
 * 检查指定小节是否有有效内容。
 *
 * 查找小节起始行，收集到下一个 ### 标题或块末尾之间的行，
 * 过滤掉无效内容后判断是否还有文本。
 */
function hasSectionContent(rawContent, sectionPattern) {
    const lines = rawContent.split('\n');
    // 找到小节起始行
    let sectionStart = -1;
    for (let i = 0; i < lines.length; i++) {
        if (sectionPattern.test(lines[i])) {
            sectionStart = i;
            break;
        }
    }
    if (sectionStart === -1) {
        // 小节不存在，视为无内容
        return false;
    }
    // 收集小节内容（从小节标题行之后到下一个 ### 标题行之前）
    const contentLines = [];
    for (let i = sectionStart + 1; i < lines.length; i++) {
        const line = lines[i];
        // 遇到下一个同级或更高级标题停止
        if (/^#{1,3} /.test(line)) {
            break;
        }
        contentLines.push(line);
    }
    // 过滤无效内容行，判断是否还有有效文本
    return contentLines.some(line => isValidContentLine(line));
}
/**
 * 判断一行是否为有效内容（排除占位符和空行）。
 */
function isValidContentLine(line) {
    const trimmed = line.trim();
    // 空行
    if (trimmed === '')
        return false;
    // 纯 "-" 占位符（只有 "-" 的行）
    if (trimmed === '-')
        return false;
    // "(无)" 占位符（含可能的列表前缀，如 "- (无)"）
    if (trimmed === '(无)')
        return false;
    if (/^-\s*\(无\)$/.test(trimmed))
        return false;
    // HTML 注释 <!-- ... -->（整行都是注释）
    if (/^<!--[\s\S]*-->$/.test(trimmed))
        return false;
    return true;
}
//# sourceMappingURL=reflection-parser.js.map