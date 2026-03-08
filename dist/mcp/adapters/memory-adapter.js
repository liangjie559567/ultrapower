import { projectMemoryReadTool, projectMemoryWriteTool, projectMemoryAddNoteTool, projectMemoryAddDirectiveTool, } from '../../tools/memory-tools.js';
export const memoryTools = [
    {
        name: projectMemoryReadTool.name,
        description: projectMemoryReadTool.description,
        inputSchema: {
            type: 'object',
            properties: {
                section: { type: 'string', enum: ['all', 'techStack', 'build', 'conventions', 'structure', 'notes', 'directives'], description: projectMemoryReadTool.schema.section._def.innerType.description },
                workingDirectory: { type: 'string', description: projectMemoryReadTool.schema.workingDirectory._def.innerType.description },
            },
        },
        handler: projectMemoryReadTool.handler,
    },
    {
        name: projectMemoryWriteTool.name,
        description: projectMemoryWriteTool.description,
        inputSchema: {
            type: 'object',
            properties: {
                memory: { type: 'object', description: projectMemoryWriteTool.schema.memory.description },
                merge: { type: 'boolean', description: projectMemoryWriteTool.schema.merge._def.innerType.description },
                workingDirectory: { type: 'string', description: projectMemoryWriteTool.schema.workingDirectory._def.innerType.description },
            },
            required: ['memory'],
        },
        handler: projectMemoryWriteTool.handler,
    },
    {
        name: projectMemoryAddNoteTool.name,
        description: projectMemoryAddNoteTool.description,
        inputSchema: {
            type: 'object',
            properties: {
                category: { type: 'string', description: projectMemoryAddNoteTool.schema.category.description },
                content: { type: 'string', description: projectMemoryAddNoteTool.schema.content.description },
                workingDirectory: { type: 'string', description: projectMemoryAddNoteTool.schema.workingDirectory._def.innerType.description },
            },
            required: ['category', 'content'],
        },
        handler: projectMemoryAddNoteTool.handler,
    },
    {
        name: projectMemoryAddDirectiveTool.name,
        description: projectMemoryAddDirectiveTool.description,
        inputSchema: {
            type: 'object',
            properties: {
                directive: { type: 'string', description: projectMemoryAddDirectiveTool.schema.directive.description },
                context: { type: 'string', description: projectMemoryAddDirectiveTool.schema.context._def.innerType.description },
                priority: { type: 'string', enum: ['high', 'normal'], description: projectMemoryAddDirectiveTool.schema.priority._def.innerType.description },
                workingDirectory: { type: 'string', description: projectMemoryAddDirectiveTool.schema.workingDirectory._def.innerType.description },
            },
            required: ['directive'],
        },
        handler: projectMemoryAddDirectiveTool.handler,
    },
];
//# sourceMappingURL=memory-adapter.js.map