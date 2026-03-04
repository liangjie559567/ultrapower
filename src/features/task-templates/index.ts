import { readFileSync } from 'fs';
import { join } from 'path';

export interface TaskTemplate {
  name: string;
  description: string;
  content: string;
}

export class TemplateLoader {
  private templatesDir: string;

  constructor(templatesDir: string = join(process.cwd(), 'templates', 'tasks')) {
    this.templatesDir = templatesDir;
  }

  load(templateName: string): TaskTemplate {
    const filePath = join(this.templatesDir, `${templateName}.md`);
    const content = readFileSync(filePath, 'utf-8');

    return {
      name: templateName,
      description: this.extractDescription(content),
      content
    };
  }

  listTemplates(): string[] {
    return [
      'feature-development',
      'bug-fix',
      'code-review',
      'refactoring',
      'security-audit'
    ];
  }

  private extractDescription(content: string): string {
    const lines = content.split('\n');
    return lines[0]?.replace(/^#\s+/, '') || '';
  }
}
