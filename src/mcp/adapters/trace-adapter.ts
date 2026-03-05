import { traceTimelineTool, traceSummaryTool } from '../../tools/trace-tools.js';

export const traceTools = [
  {
    name: traceTimelineTool.name,
    description: traceTimelineTool.description,
    inputSchema: {
      type: 'object' as const,
      properties: {
        sessionId: { type: 'string', description: traceTimelineTool.schema.sessionId._def.innerType.description },
        filter: { type: 'string', enum: traceTimelineTool.schema.filter._def.innerType._def.values, description: traceTimelineTool.schema.filter._def.innerType.description },
        last: { type: 'number', description: traceTimelineTool.schema.last._def.innerType.description },
        workingDirectory: { type: 'string', description: traceTimelineTool.schema.workingDirectory._def.innerType.description },
      },
    },
    handler: traceTimelineTool.handler,
  },
  {
    name: traceSummaryTool.name,
    description: traceSummaryTool.description,
    inputSchema: {
      type: 'object' as const,
      properties: {
        sessionId: { type: 'string', description: traceSummaryTool.schema.sessionId._def.innerType.description },
        workingDirectory: { type: 'string', description: traceSummaryTool.schema.workingDirectory._def.innerType.description },
      },
    },
    handler: traceSummaryTool.handler,
  },
];
