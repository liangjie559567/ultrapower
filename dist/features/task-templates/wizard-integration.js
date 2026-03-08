export class TemplateIntegration {
    context;
    constructor(context) {
        this.context = context;
    }
    getTemplateForMode(mode) {
        const templates = {
            'feature-dev': 'feature-development',
            'bug-fix': 'bug-fix',
            'code-review': 'code-review',
            'refactor': 'refactoring',
            'security': 'security-audit'
        };
        return templates[mode] || null;
    }
    applyTemplate(templateName, taskDescription) {
        const template = this.context.templateLoader.load(templateName);
        return `# ${taskDescription}\n\n${template.content}`;
    }
    listAvailableTemplates() {
        return this.context.templateLoader.listTemplates().map((name) => {
            const template = this.context.templateLoader.load(name);
            return { name, description: template.description };
        });
    }
}
//# sourceMappingURL=wizard-integration.js.map