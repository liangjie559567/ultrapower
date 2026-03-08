import { astGrepSearchTool, astGrepReplaceTool } from '../../tools/ast-tools.js';
export const astTools = [
    {
        name: astGrepSearchTool.name,
        description: astGrepSearchTool.description,
        inputSchema: {
            type: 'object',
            properties: {
                pattern: { type: 'string', description: astGrepSearchTool.schema.pattern.description },
                language: { type: 'string', enum: astGrepSearchTool.schema.language._def.values, description: astGrepSearchTool.schema.language.description },
                path: { type: 'string', description: astGrepSearchTool.schema.path?._def.innerType.description },
                context: { type: 'number', description: astGrepSearchTool.schema.context?._def.innerType.description },
                maxResults: { type: 'number', description: astGrepSearchTool.schema.maxResults?._def.innerType.description },
            },
            required: ['pattern', 'language'],
        },
        handler: astGrepSearchTool.handler,
    },
    {
        name: astGrepReplaceTool.name,
        description: astGrepReplaceTool.description,
        inputSchema: {
            type: 'object',
            properties: {
                pattern: { type: 'string', description: astGrepReplaceTool.schema.pattern.description },
                replacement: { type: 'string', description: astGrepReplaceTool.schema.replacement.description },
                language: { type: 'string', enum: astGrepReplaceTool.schema.language._def.values, description: astGrepReplaceTool.schema.language.description },
                path: { type: 'string', description: astGrepReplaceTool.schema.path?._def.innerType.description },
                dryRun: { type: 'boolean', description: astGrepReplaceTool.schema.dryRun?._def.innerType.description },
            },
            required: ['pattern', 'replacement', 'language'],
        },
        handler: astGrepReplaceTool.handler,
    },
];
//# sourceMappingURL=ast-adapter.js.map