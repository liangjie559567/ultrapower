import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCode, ValidationError } from '../gate.js';

describe('validateCode', () => {
  it('空代码通过验证', async () => {
    await expect(validateCode('')).resolves.toBeUndefined();
  });

  it('无外部依赖的代码通过验证', async () => {
    const code = `const x = 1;\nfunction foo() { return x + 1; }`;
    await expect(validateCode(code)).resolves.toBeUndefined();
  });

  it('低置信度依赖抛出 ValidationError', async () => {
    const code = `import unknown from 'unknown-package';`;
    await expect(validateCode(code)).rejects.toThrow(ValidationError);
  });

  it('ValidationError 包含依赖信息', async () => {
    const code = `import test from 'test-pkg';`;
    try {
      await validateCode(code);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).dependency).toBe('test-pkg');
      expect((err as ValidationError).reason).toBeDefined();
    }
  });
});

describe('ValidationError', () => {
  it('创建带格式化消息的错误', () => {
    const err = new ValidationError('react', '版本不匹配');
    expect(err.message).toContain('react');
    expect(err.message).toContain('版本不匹配');
    expect(err.dependency).toBe('react');
    expect(err.reason).toBe('版本不匹配');
  });
});
