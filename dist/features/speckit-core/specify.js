/**
 * Specification Generator - 基于 constitution 生成功能规范
 */
export async function generateSpecification(feature, constitution, projectPath) {
    const featureType = inferFeatureType(feature);
    return {
        feature,
        overview: generateOverview(feature, featureType),
        requirements: generateRequirements(feature, featureType),
        constraints: extractConstraints(constitution),
        acceptanceCriteria: generateAcceptanceCriteria(feature, featureType, constitution)
    };
}
function inferFeatureType(feature) {
    const lower = feature.toLowerCase();
    if (lower.includes('auth') || lower.includes('login'))
        return 'auth';
    if (lower.includes('api') || lower.includes('endpoint'))
        return 'api';
    if (lower.includes('ui') || lower.includes('component'))
        return 'ui';
    if (lower.includes('test'))
        return 'test';
    if (lower.includes('refactor'))
        return 'refactor';
    return 'feature';
}
function generateOverview(feature, type) {
    const templates = {
        api: `REST API implementation for ${feature} with proper error handling and validation`,
        ui: `User interface component for ${feature} with responsive design and accessibility`,
        auth: `Authentication/authorization implementation for ${feature} with security best practices`,
        test: `Test suite for ${feature} with comprehensive coverage`,
        refactor: `Code refactoring for ${feature} to improve maintainability and performance`,
        feature: `Implementation of ${feature} following project principles`
    };
    return templates[type] || templates.feature;
}
function generateRequirements(feature, type) {
    const baseReqs = [
        {
            id: 'REQ-001',
            description: `Implement core ${feature} functionality`,
            priority: 'high'
        }
    ];
    const typeSpecific = {
        api: [
            { id: 'REQ-002', description: 'Add input validation and sanitization', priority: 'high' },
            { id: 'REQ-003', description: 'Implement error handling with proper status codes', priority: 'high' },
            { id: 'REQ-004', description: 'Add API documentation', priority: 'medium' }
        ],
        ui: [
            { id: 'REQ-002', description: 'Ensure responsive design across devices', priority: 'high' },
            { id: 'REQ-003', description: 'Implement accessibility (ARIA labels, keyboard navigation)', priority: 'high' },
            { id: 'REQ-004', description: 'Add loading and error states', priority: 'medium' }
        ],
        auth: [
            { id: 'REQ-002', description: 'Implement secure token handling', priority: 'high' },
            { id: 'REQ-003', description: 'Add session management', priority: 'high' },
            { id: 'REQ-004', description: 'Implement rate limiting', priority: 'medium' }
        ]
    };
    const specific = typeSpecific[type] || [
        { id: 'REQ-002', description: 'Add error handling', priority: 'medium' },
        { id: 'REQ-003', description: 'Write comprehensive tests', priority: 'high' }
    ];
    return [...baseReqs, ...specific];
}
function extractConstraints(constitution) {
    return constitution.principles.map(p => p.description);
}
function generateAcceptanceCriteria(feature, type, constitution) {
    const base = [
        'All tests pass',
        'Code follows project principles'
    ];
    if (constitution.principles.some(p => p.title.includes('TypeScript'))) {
        base.push('No TypeScript errors');
    }
    const typeSpecific = {
        api: ['API returns correct status codes', 'Input validation works', 'Error responses are consistent'],
        ui: ['Component renders correctly', 'Responsive on mobile/desktop', 'Accessible (WCAG 2.1)'],
        auth: ['Authentication flow works', 'Tokens are secure', 'Unauthorized access blocked']
    };
    return [...base, ...(typeSpecific[type] || [])];
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