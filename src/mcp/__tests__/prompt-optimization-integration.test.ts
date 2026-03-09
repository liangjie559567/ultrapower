import { describe, it, expect } from 'vitest';
import { buildPromptWithSystemContext } from '../prompt-injection';

describe('Prompt Optimization Integration', () => {
  it('should optimize redundant phrases in user prompts', () => {
    const verbosePrompt = 'Could you please analyze this code and help me understand it';
    const result = buildPromptWithSystemContext(verbosePrompt, undefined, undefined);

    expect(result).not.toContain('Could you please');
    expect(result).not.toContain('help me');
    expect(result).toContain('analyze this code');
  });

  it('should simplify instruction verbs', () => {
    const verbosePrompt = 'Please summarize the following document for me';
    const result = buildPromptWithSystemContext(verbosePrompt, undefined, undefined);

    expect(result).toContain('Summarize');
    expect(result).not.toContain('Please summarize the following');
  });

  it('should preserve system instructions and file context', () => {
    const userPrompt = 'Could you please analyze this';
    const systemPrompt = 'You are an expert';
    const fileContext = 'const x = 1;';

    const result = buildPromptWithSystemContext(userPrompt, fileContext, systemPrompt);

    expect(result).toContain('<system-instructions>');
    expect(result).toContain('You are an expert');
    expect(result).toContain('UNTRUSTED DATA');
    expect(result).toContain('const x = 1;');
    expect(result).toContain('analyze this');
  });
});
