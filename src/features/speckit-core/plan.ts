/**
 * Plan Generator - 规范转技术方案
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Specification, TechnicalPlan, Component, Risk } from './types.js';

export async function generatePlan(spec: Specification, projectPath?: string): Promise<TechnicalPlan> {
  const existingFiles = projectPath ? scanExistingFiles(projectPath, spec.feature) : [];

  return {
    approach: generateApproach(spec),
    components: identifyComponents(spec, existingFiles),
    dependencies: extractDependencies(spec),
    risks: identifyRisks(spec)
  };
}

function generateApproach(spec: Specification): string {
  const hasHighPriorityReqs = spec.requirements.some(r => r.priority === 'high');
  const approach = `Implement ${spec.feature} using modular architecture`;

  if (hasHighPriorityReqs) {
    return `${approach}. Focus on high-priority requirements first, then iterate on medium/low priority items.`;
  }
  return approach;
}

function scanExistingFiles(projectPath: string, feature: string): string[] {
  const existing: string[] = [];
  const featurePath = path.join(projectPath, 'src', 'features', feature);

  try {
    if (fs.existsSync(featurePath)) {
      const files = fs.readdirSync(featurePath, { recursive: true });
      files.forEach(f => {
        if (typeof f === 'string' && (f.endsWith('.ts') || f.endsWith('.tsx'))) {
          existing.push(path.join('src', 'features', feature, f));
        }
      });
    }
  } catch {}

  return existing;
}

function identifyComponents(spec: Specification, existingFiles: string[]): Component[] {
  const components: Component[] = [];
  const featureName = spec.feature.toLowerCase().replace(/\s+/g, '-');

  if (existingFiles.length > 0) {
    components.push({
      name: 'Existing Code Updates',
      purpose: `Modify existing ${spec.feature} implementation`,
      files: existingFiles
    });
  } else {
    components.push({
      name: 'Core Module',
      purpose: `Main ${spec.feature} implementation`,
      files: [`src/features/${featureName}/index.ts`]
    });
  }

  const hasTypeReqs = spec.requirements.some(r => r.description.toLowerCase().includes('type'));
  if (hasTypeReqs) {
    components.push({
      name: 'Type Definitions',
      purpose: 'TypeScript interfaces and types',
      files: [`src/features/${featureName}/types.ts`]
    });
  }

  components.push({
    name: 'Tests',
    purpose: 'Unit and integration tests',
    files: [`src/features/${featureName}/__tests__/index.test.ts`]
  });

  return components;
}

function extractDependencies(spec: Specification): string[] {
  const deps: string[] = [];
  const reqText = spec.requirements.map(r => r.description.toLowerCase()).join(' ');

  if (reqText.includes('api') || reqText.includes('http')) deps.push('axios or fetch');
  if (reqText.includes('validation')) deps.push('zod or yup');
  if (reqText.includes('state')) deps.push('zustand or redux');

  return deps;
}

function identifyRisks(spec: Specification): Risk[] {
  const risks: Risk[] = [];

  const highPriorityCount = spec.requirements.filter(r => r.priority === 'high').length;
  if (highPriorityCount > 3) {
    risks.push({
      description: 'High complexity with multiple critical requirements',
      mitigation: 'Break into smaller phases, implement incrementally'
    });
  }

  const hasSecurityReqs = spec.requirements.some(r =>
    r.description.toLowerCase().includes('auth') ||
    r.description.toLowerCase().includes('security')
  );
  if (hasSecurityReqs) {
    risks.push({
      description: 'Security-sensitive implementation',
      mitigation: 'Follow security best practices, conduct security review'
    });
  }

  if (risks.length === 0) {
    risks.push({
      description: 'Implementation complexity',
      mitigation: 'Break into smaller tasks, test incrementally'
    });
  }

  return risks;
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
