import { readFileSync } from 'fs';
import { join } from 'path';
export class TemplateLoader {
    templatesDir;
    constructor(templatesDir = join(process.cwd(), 'templates', 'tasks')) {
        this.templatesDir = templatesDir;
    }
    load(templateName) {
        const filePath = join(this.templatesDir, `${templateName}.md`);
        const content = readFileSync(filePath, 'utf-8');
        return {
            name: templateName,
            description: this.extractDescription(content),
            content
        };
    }
    listTemplates() {
        return [
            'feature-development',
            'bug-fix',
            'code-review',
            'refactoring',
            'security-audit'
        ];
    }
    extractDescription(content) {
        const lines = content.split('\n');
        return lines[0]?.replace(/^#\s+/, '') || '';
    }
}
//# sourceMappingURL=index.js.map