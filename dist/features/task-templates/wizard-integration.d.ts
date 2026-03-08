import { TemplateLoader } from '../task-templates/index.js';
export interface WizardContext {
    templateLoader: TemplateLoader;
}
export declare class TemplateIntegration {
    private context;
    constructor(context: WizardContext);
    getTemplateForMode(mode: string): string | null;
    applyTemplate(templateName: string, taskDescription: string): string;
    listAvailableTemplates(): Array<{
        name: string;
        description: string;
    }>;
}
//# sourceMappingURL=wizard-integration.d.ts.map