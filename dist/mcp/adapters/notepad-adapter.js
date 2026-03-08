import { notepadReadTool, notepadWritePriorityTool, notepadWriteWorkingTool, notepadWriteManualTool, notepadPruneTool, notepadStatsTool, } from '../../tools/notepad-tools.js';
export const notepadTools = [
    {
        name: notepadReadTool.name,
        description: notepadReadTool.description,
        inputSchema: {
            type: 'object',
            properties: {
                section: { type: 'string', enum: notepadReadTool.schema.section._def.innerType._def.values, description: notepadReadTool.schema.section._def.innerType.description },
                workingDirectory: { type: 'string', description: notepadReadTool.schema.workingDirectory._def.innerType.description },
            },
        },
        handler: notepadReadTool.handler,
    },
    {
        name: notepadWritePriorityTool.name,
        description: notepadWritePriorityTool.description,
        inputSchema: {
            type: 'object',
            properties: {
                content: { type: 'string', description: notepadWritePriorityTool.schema.content.description },
                workingDirectory: { type: 'string', description: notepadWritePriorityTool.schema.workingDirectory._def.innerType.description },
            },
            required: ['content'],
        },
        handler: notepadWritePriorityTool.handler,
    },
    {
        name: notepadWriteWorkingTool.name,
        description: notepadWriteWorkingTool.description,
        inputSchema: {
            type: 'object',
            properties: {
                content: { type: 'string', description: notepadWriteWorkingTool.schema.content.description },
                workingDirectory: { type: 'string', description: notepadWriteWorkingTool.schema.workingDirectory._def.innerType.description },
            },
            required: ['content'],
        },
        handler: notepadWriteWorkingTool.handler,
    },
    {
        name: notepadWriteManualTool.name,
        description: notepadWriteManualTool.description,
        inputSchema: {
            type: 'object',
            properties: {
                content: { type: 'string', description: notepadWriteManualTool.schema.content.description },
                workingDirectory: { type: 'string', description: notepadWriteManualTool.schema.workingDirectory._def.innerType.description },
            },
            required: ['content'],
        },
        handler: notepadWriteManualTool.handler,
    },
    {
        name: notepadPruneTool.name,
        description: notepadPruneTool.description,
        inputSchema: {
            type: 'object',
            properties: {
                daysOld: { type: 'number', description: notepadPruneTool.schema.daysOld._def.innerType.description },
                workingDirectory: { type: 'string', description: notepadPruneTool.schema.workingDirectory._def.innerType.description },
            },
        },
        handler: notepadPruneTool.handler,
    },
    {
        name: notepadStatsTool.name,
        description: notepadStatsTool.description,
        inputSchema: {
            type: 'object',
            properties: {
                workingDirectory: { type: 'string', description: notepadStatsTool.schema.workingDirectory._def.innerType.description },
            },
        },
        handler: notepadStatsTool.handler,
    },
];
//# sourceMappingURL=notepad-adapter.js.map