/**
 * Prompt Optimizer - 优化 LLM prompt 以减少 token 使用
 */

// 预编译正则表达式（性能优化）
const REDUNDANT_PHRASES = [
  /could you please /gi,
  /I would like you to /gi,
  /can you help me /gi,
  / and help me understand it$/gi,
  /help me /gi,
];

const INSTRUCTION_SIMPLIFIERS = [
  { pattern: /Please summarize the following/gi, replacement: 'Summarize' },
  { pattern: /Could you analyze/gi, replacement: 'Analyze' },
  { pattern: /^please /gi, replacement: '' },
];

export interface OptimizationOptions {
  maxContextFiles?: number;
  preferInterfaces?: boolean;
  structuredOutput?: boolean;
  limitExamples?: number;
}

export interface OptimizedPrompt {
  prompt: string;
  contextFiles: string[];
  estimatedTokens: number;
  optimizations: string[];
}

/**
 * 优化 prompt 文本
 */
export function optimizePromptText(prompt: string): { text: string; changes: string[] } {
  const changes: string[] = [];
  let optimized = prompt;

  // 1. 移除冗余短语（使用预编译的正则）
  REDUNDANT_PHRASES.forEach(pattern => {
    if (pattern.test(optimized)) {
      optimized = optimized.replace(pattern, '');
      changes.push('移除冗余短语');
    }
  });

  // 2. 简化指令（使用预编译的正则）
  const originalOptimized = optimized;
  INSTRUCTION_SIMPLIFIERS.forEach(({ pattern, replacement }) => {
    optimized = optimized.replace(pattern, replacement);
  });

  if (optimized !== originalOptimized) {
    changes.push('简化指令动词');
  }

  return { text: optimized.trim(), changes };
}

/**
 * 优化上下文文件列表
 */
export function optimizeContextFiles(
  files: string[],
  options: OptimizationOptions = {}
): { files: string[]; changes: string[] } {
  const { maxContextFiles = 5, preferInterfaces = true } = options;
  const changes: string[] = [];
  let optimized = [...files];

  // 1. 优先选择接口定义文件
  if (preferInterfaces) {
    const interfaces = optimized.filter(f => f.endsWith('.d.ts') || f.includes('types'));
    const others = optimized.filter(f => !f.endsWith('.d.ts') && !f.includes('types'));
    optimized = [...interfaces, ...others];
    if (interfaces.length > 0) {
      changes.push(`优先 ${interfaces.length} 个接口文件`);
    }
  }

  // 2. 限制文件数量
  if (optimized.length > maxContextFiles) {
    optimized = optimized.slice(0, maxContextFiles);
    changes.push(`限制为 ${maxContextFiles} 个文件`);
  }

  return { files: optimized, changes };
}

/**
 * 估算 token 数量（粗略估计：1 token ≈ 4 字符）
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * 完整优化流程
 */
export function optimizePrompt(
  prompt: string,
  contextFiles: string[],
  options: OptimizationOptions = {}
): OptimizedPrompt {
  const optimizations: string[] = [];

  // 优化 prompt 文本
  const { text: optimizedText, changes: textChanges } = optimizePromptText(prompt);
  optimizations.push(...textChanges);

  // 优化上下文文件
  const { files: optimizedFiles, changes: fileChanges } = optimizeContextFiles(contextFiles, options);
  optimizations.push(...fileChanges);

  // 估算 token
  const estimatedTokens = estimateTokens(optimizedText);

  return {
    prompt: optimizedText,
    contextFiles: optimizedFiles,
    estimatedTokens,
    optimizations,
  };
}
