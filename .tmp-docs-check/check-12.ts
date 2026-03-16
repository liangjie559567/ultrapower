export function sanitizeForKeywordDetection(text: string): string {
  // 1. 移除 XML 标签块
  result = text.replace(/<(\w[\w-]*)[\s>][\s\S]*?<\/\1>/g, '');

  // 2. 移除自闭合 XML 标签
  result = result.replace(/<\w[\w-]*(?:\s[^>]*)?\s*\/>/g, '');

  // 3. 移除 URL
  result = result.replace(/https?:\/\/\S+/g, '');

  // 4. 移除文件路径
  result = result.replace(/(^|[\s"'`(])(?:\.?\/(?:[\w.-]+\/)*[\w.-]+|(?:[\w.-]+\/)+[\w.-]+\.\w+)/gm, '$1');

  // 5. 移除代码块
  result = removeCodeBlocks(result);

  return result;
}
