import { describe, it, expect } from 'vitest';
import { analyzeContext } from '../context-analyzer.js';

describe('Context Analyzer', () => {
  it('extracts file count', () => {
    const result = analyzeContext('Modified 15 files');
    expect(result.fileCount).toBe(15);
  });

  it('detects security context', () => {
    const result = analyzeContext('Update authentication logic');
    expect(result.hasSecurity).toBe(true);
  });

  it('detects UI context', () => {
    const result = analyzeContext('Add React component');
    expect(result.hasUI).toBe(true);
  });

  it('detects API context', () => {
    const result = analyzeContext('Create REST endpoint');
    expect(result.hasAPI).toBe(true);
  });

  it('detects architecture context', () => {
    const result = analyzeContext('Design system architecture');
    expect(result.hasArchitecture).toBe(true);
  });

  it('detects performance context', () => {
    const result = analyzeContext('Optimize slow queries');
    expect(result.hasPerformance).toBe(true);
  });
});
