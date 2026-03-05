import { pythonReplTool } from '../../tools/python-repl/tool.js';

export const pythonTools = [
  {
    name: pythonReplTool.name,
    description: pythonReplTool.description,
    inputSchema: {
      type: 'object' as const,
      properties: {
        action: {
          type: 'string',
          enum: ['execute', 'interrupt', 'reset', 'get_state'],
          description: pythonReplTool.schema.action.description
        },
        researchSessionID: {
          type: 'string',
          description: pythonReplTool.schema.researchSessionID.description
        },
        code: {
          type: 'string',
          description: pythonReplTool.schema.code?._def.innerType.description
        },
        executionLabel: {
          type: 'string',
          description: pythonReplTool.schema.executionLabel?._def.innerType.description
        },
        executionTimeout: {
          type: 'number',
          description: pythonReplTool.schema.executionTimeout.description
        },
        queueTimeout: {
          type: 'number',
          description: pythonReplTool.schema.queueTimeout.description
        },
        projectDir: {
          type: 'string',
          description: pythonReplTool.schema.projectDir?._def.innerType.description
        },
      },
      required: ['action', 'researchSessionID'],
    },
    handler: pythonReplTool.handler,
  },
];
