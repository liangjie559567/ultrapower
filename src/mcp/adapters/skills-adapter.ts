import { loadLocalTool, loadGlobalTool, listSkillsTool } from '../../tools/skills-tools.js';

export const skillsTools = [
  {
    name: loadLocalTool.name,
    description: loadLocalTool.description,
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectRoot: { type: 'string', description: loadLocalTool.schema.projectRoot?._def.innerType.description },
      },
    },
    handler: loadLocalTool.handler,
  },
  {
    name: loadGlobalTool.name,
    description: loadGlobalTool.description,
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
    handler: loadGlobalTool.handler,
  },
  {
    name: listSkillsTool.name,
    description: listSkillsTool.description,
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectRoot: { type: 'string', description: listSkillsTool.schema.projectRoot?._def.innerType.description },
      },
    },
    handler: listSkillsTool.handler,
  },
];
