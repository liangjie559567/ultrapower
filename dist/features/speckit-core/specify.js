/**
 * Specification Generator - 基于 constitution 生成功能规范
 */
export async function generateSpecification(feature, constitution) {
    return {
        feature,
        overview: `Implementation of ${feature} following project principles`,
        requirements: generateRequirements(feature),
        constraints: extractConstraints(constitution),
        acceptanceCriteria: generateAcceptanceCriteria(feature)
    };
}
function generateRequirements(feature) {
    return [
        {
            id: 'REQ-001',
            description: `Implement core ${feature} functionality`,
            priority: 'high'
        },
        {
            id: 'REQ-002',
            description: 'Add error handling',
            priority: 'medium'
        },
        {
            id: 'REQ-003',
            description: 'Write tests',
            priority: 'high'
        }
    ];
}
function extractConstraints(constitution) {
    return constitution.principles.map(p => p.description);
}
function generateAcceptanceCriteria(feature) {
    return [
        'All tests pass',
        'No TypeScript errors',
        'Code follows project principles'
    ];
}
export function formatSpecification(spec) {
    let output = `# Specification: ${spec.feature}\n\n`;
    output += `## Overview\n${spec.overview}\n\n`;
    output += `## Requirements\n`;
    spec.requirements.forEach(r => {
        output += `- [${r.priority.toUpperCase()}] ${r.id}: ${r.description}\n`;
    });
    output += `\n## Constraints\n`;
    spec.constraints.forEach(c => output += `- ${c}\n`);
    output += `\n## Acceptance Criteria\n`;
    spec.acceptanceCriteria.forEach(a => output += `- [ ] ${a}\n`);
    return output;
}
//# sourceMappingURL=specify.js.map