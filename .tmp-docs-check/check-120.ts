ast_grep_replace(
  pattern: string,
  replacement: string,
  language: SupportedLanguage,
  path?: string,
  dryRun?: boolean  // 默认 true
): { matches: number; preview: string }
