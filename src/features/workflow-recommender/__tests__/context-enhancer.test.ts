import { describe, it, expect } from 'vitest';
import { ContextEnhancer } from '../context-enhancer.js';

describe('Context Enhancer', () => {
  it('should analyze project context', () => {
    const context = ContextEnhancer.analyzeProject(process.cwd());
    expect(context.hasTests).toBeDefined();
    expect(context.hasTypeScript).toBeDefined();
  });
});
