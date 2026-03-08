export interface TaskTemplate {
    name: string;
    description: string;
    content: string;
}
export declare class TemplateLoader {
    private templatesDir;
    constructor(templatesDir?: string);
    load(templateName: string): TaskTemplate;
    listTemplates(): string[];
    private extractDescription;
}
//# sourceMappingURL=index.d.ts.map