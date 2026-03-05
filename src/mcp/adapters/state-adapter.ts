import {
  stateReadTool,
  stateWriteTool,
  stateClearTool,
  stateListActiveTool,
  stateGetStatusTool,
} from '../../tools/state-tools.js';

const STATE_MODES = ['autopilot', 'ultrapilot', 'swarm', 'pipeline', 'team', 'ralph', 'ultrawork', 'ultraqa', 'ralplan'];

export const stateTools = [
  {
    name: stateReadTool.name,
    description: stateReadTool.description,
    inputSchema: {
      type: 'object' as const,
      properties: {
        mode: { type: 'string', enum: STATE_MODES, description: stateReadTool.schema.mode.description },
        workingDirectory: { type: 'string', description: stateReadTool.schema.workingDirectory._def.innerType.description },
        session_id: { type: 'string', description: stateReadTool.schema.session_id._def.innerType.description },
      },
      required: ['mode'],
    },
    handler: stateReadTool.handler,
  },
  {
    name: stateWriteTool.name,
    description: stateWriteTool.description,
    inputSchema: {
      type: 'object' as const,
      properties: {
        mode: { type: 'string', enum: STATE_MODES, description: stateWriteTool.schema.mode.description },
        active: { type: 'boolean', description: stateWriteTool.schema.active._def.innerType.description },
        iteration: { type: 'number', description: stateWriteTool.schema.iteration._def.innerType.description },
        max_iterations: { type: 'number', description: stateWriteTool.schema.max_iterations._def.innerType.description },
        current_phase: { type: 'string', description: stateWriteTool.schema.current_phase._def.innerType.description },
        task_description: { type: 'string', description: stateWriteTool.schema.task_description._def.innerType.description },
        plan_path: { type: 'string', description: stateWriteTool.schema.plan_path._def.innerType.description },
        started_at: { type: 'string', description: stateWriteTool.schema.started_at._def.innerType.description },
        completed_at: { type: 'string', description: stateWriteTool.schema.completed_at._def.innerType.description },
        error: { type: 'string', description: stateWriteTool.schema.error._def.innerType.description },
        state: { type: 'object', description: stateWriteTool.schema.state._def.innerType.description },
        workingDirectory: { type: 'string', description: stateWriteTool.schema.workingDirectory._def.innerType.description },
        session_id: { type: 'string', description: stateWriteTool.schema.session_id._def.innerType.description },
      },
      required: ['mode'],
    },
    handler: stateWriteTool.handler,
  },
  {
    name: stateClearTool.name,
    description: stateClearTool.description,
    inputSchema: {
      type: 'object' as const,
      properties: {
        mode: { type: 'string', enum: STATE_MODES, description: stateClearTool.schema.mode.description },
        workingDirectory: { type: 'string', description: stateClearTool.schema.workingDirectory._def.innerType.description },
        session_id: { type: 'string', description: stateClearTool.schema.session_id._def.innerType.description },
      },
      required: ['mode'],
    },
    handler: stateClearTool.handler,
  },
  {
    name: stateListActiveTool.name,
    description: stateListActiveTool.description,
    inputSchema: {
      type: 'object' as const,
      properties: {
        workingDirectory: { type: 'string', description: stateListActiveTool.schema.workingDirectory._def.innerType.description },
        session_id: { type: 'string', description: stateListActiveTool.schema.session_id._def.innerType.description },
      },
    },
    handler: stateListActiveTool.handler,
  },
  {
    name: stateGetStatusTool.name,
    description: stateGetStatusTool.description,
    inputSchema: {
      type: 'object' as const,
      properties: {
        mode: { type: 'string', enum: STATE_MODES, description: stateGetStatusTool.schema.mode._def.innerType.description },
        workingDirectory: { type: 'string', description: stateGetStatusTool.schema.workingDirectory._def.innerType.description },
        session_id: { type: 'string', description: stateGetStatusTool.schema.session_id._def.innerType.description },
      },
    },
    handler: stateGetStatusTool.handler,
  },
];
