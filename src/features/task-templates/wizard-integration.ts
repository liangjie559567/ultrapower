import { TemplateLoader } from '../task-templates/index.js';

export interface WizardContext {
  templateLoader: TemplateLoader;
}

export class TemplateIntegration {
  constructor(private context: WizardContext) {}

  getTemplateForMode(mode: string): string | null {
    const templates: Record<string, string> = {
      'feature-dev': 'feature-development',
      'bug-fix': 'bug-fix',
      'code-review': 'code-review',
      'refactor': 'refactoring',
      'security': 'security-audit'
    };

    return templates[mode] || null;
  }

  applyTemplate(templateName: string, taskDescription: string): string {
    const template = this.context.templateLoader.load(templateName);
    return `# ${taskDescription}\n\n${template.content}`;
  }

  listAvailableTemplates(): Array<{ name: string; description: string }> {
    return this.context.templateLoader.listTemplates().map((name: string) => {
      const template = this.context.templateLoader.load(name);
      return { name, description: template.description };
    });
  }
}
