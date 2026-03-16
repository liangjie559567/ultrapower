// 1. 文本清理（移除代码块、XML 标签、URL、文件路径）
export function sanitizeForKeywordDetection(text: string): string {
  let result = text.replace(/<(\w[\w-]*)[\s>][\s\S]*?<\/\1>/g, ''); // XML 标签
  result = result.replace(/<\w[\w-]*(?:\s[^>]*)?\s*\/>/g, '');      // 自闭合标签
  result = result.replace(/https?:\/\/\S+/g, '');                    // URL
  result = result.replace(/(^|[\s"'`(])(?:\.?\/(?:[\w.-]+\/)*[\w.-]+|(?:[\w.-]+\/)+[\w.-]+\.\w+)/gm, '$1'); // 文件路径
  result = removeCodeBlocks(result);                                 // 代码块
  return result;
}

// 2. 按优先级检测关键词
export function detectKeywordsWithType(text: string): DetectedKeyword[] {
  const detected: DetectedKeyword[] = [];
  const cleanedText = sanitizeForKeywordDetection(text);

  for (const type of KEYWORD_PRIORITY) {
    // 跳过禁用的 team 相关类型
    if ((type === 'team' || type === 'ultrapilot' || type === 'swarm') && !isTeamEnabled()) {
      continue;
    }

    const pattern = KEYWORD_PATTERNS[type];
    const match = cleanedText.match(pattern);

    if (match && match.index !== undefined) {
      detected.push({ type, keyword: match[0], position: match.index });

      // ultrapilot/swarm 也激活 team 模式
      if (type === 'ultrapilot' || type === 'swarm') {
        detected.push({ type: 'team', keyword: match[0], position: match.index });
      }
    }
  }

  return detected;
}

// 3. 冲突解决
export function getAllKeywords(text: string): KeywordType[] {
  const detected = detectKeywordsWithType(text);
  if (detected.length === 0) return [];

  let types = [...new Set(detected.map(d => d.type))];

  // cancel 压制所有其他关键词
  if (types.includes('cancel')) return ['cancel'];

  // team 击败 autopilot
  if (types.includes('team') && types.includes('autopilot')) {
    types = types.filter(t => t !== 'autopilot');
  }

  // 按优先级排序
  return KEYWORD_PRIORITY.filter(k => types.includes(k));
}
