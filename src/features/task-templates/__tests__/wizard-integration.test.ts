import { describe, it, expect } from 'vitest';
import { TemplateIntegration } from '../wizard-integration';
import { TemplateLoader } from '../index';
import { join } from 'path';

describe('TemplateIntegration', () => {
  const templatesDir = join(process.cwd(), 'templates', 'tasks');
  const loader = new TemplateLoader(templatesDir);
  const integration = new TemplateIntegration({ templateLoader: loader });

  it('should map mode to template', () => {
    expect(integration.getTemplateForMode('feature-dev')).toBe('feature-development');
    expect(integration.getTemplateForMode('bug-fix')).toBe('bug-fix');
    expect(integration.getTemplateForMode('refactor')).toBe('refactoring');
  });

  it('should apply template with task description', () => {
    const result = integration.applyTemplate('feature-development', '添加用户登录');
    expect(result).toContain('添加用户登录');
    expect(result).toContain('功能开发模板');
  });

  it('should list available templates', () => {
    const templates = integration.listAvailableTemplates();
    expect(templates.length).toBe(5);
    expect(templates[0].name).toBe('feature-development');
    expect(templates[0].description).toBe('功能开发模板');
  });
});
