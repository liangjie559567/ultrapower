import { removeCodeBlocks, getAllKeywords } from "../keyword-detector/index.js";
export async function processKeywordDetector(input) {
    const text = input.text || "";
    const cleanText = removeCodeBlocks(text);
    const keywords = getAllKeywords(cleanText);
    return { continue: true, message: JSON.stringify({ keywords }) };
}
//# sourceMappingURL=keywordDetector.js.map