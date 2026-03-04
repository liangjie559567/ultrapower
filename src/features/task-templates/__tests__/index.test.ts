import { describe, it, expect } from 'vitest';
import { TemplateLoader } from '../index';
import { join } from 'path';

describe('TemplateLoader', () => {
  const templatesDir = join(process.cwd(), 'templates', 'tasks');
  const loader = new TemplateLoader(templatesDir);

  it('should load feature-development template', () => {
    const template = loader.load('feature-development');
    expect(template.name).toBe('feature-development');
    expect(template.content).toContain('功能开发模板');
  });

  it('should load bug-fix template', () => {
    const template = loader.load('bug-fix');
    expect(template.name).toBe('bug-fix');
    expect(template.content).toContain('Bug 修复模板');
  });

  it('should list all templates', () => {
    const templates = loader.listTemplates();
    expect(templates).toContain('feature-development');
    expect(templates).toContain('bug-fix');
    expect(templates).toContain('code-review');
    expect(templates).toContain('refactoring');
    expect(templates).toContain('security-audit');
    expect(templates.length).toBe(5);
  });

  it('should extract description from template', () => {
    const template = loader.load('feature-development');
    expect(template.description).toBe('功能开发模板');
  });
});
