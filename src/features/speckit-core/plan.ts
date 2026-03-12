/**
 * Plan Generator - 规范转技术方案
 */

import type { Specification, TechnicalPlan, Component, Risk } from './types.js';

export async function generatePlan(spec: Specification): Promise<TechnicalPlan> {
  return {
    approach: `Implement ${spec.feature} using modular architecture`,
    components: identifyComponents(spec),
    dependencies: [],
    risks: identifyRisks(spec)
  };
}

function identifyComponents(spec: Specification): Component[] {
  return [
    {
      name: 'Core Module',
      purpose: `Main ${spec.feature} implementation`,
      files: [`src/features/${spec.feature}/index.ts`]
    },
    {
      name: 'Tests',
      purpose: 'Unit and integration tests',
      files: [`src/features/${spec.feature}/__tests__/index.test.ts`]
    }
  ];
}

function identifyRisks(spec: Specification): Risk[] {
  return [
    {
      description: 'Implementation complexity',
      mitigation: 'Break into smaller tasks'
    }
  ];
}

export function formatPlan(plan: TechnicalPlan): string {
  let output = `# Technical Plan\n\n## Approach\n${plan.approach}\n\n`;
  output += `## Components\n`;
  plan.components.forEach(c => {
    output += `### ${c.name}\n${c.purpose}\n`;
    output += `Files:\n${c.files.map(f => `- ${f}`).join('\n')}\n\n`;
  });
  output += `## Risks\n`;
  plan.risks.forEach(r => {
    output += `- **${r.description}**: ${r.mitigation}\n`;
  });
  return output;
}
