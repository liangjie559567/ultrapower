/**
 * Constitution Generator - 分析项目生成核心原则
 */
import * as fs from 'fs';
import * as path from 'path';
export async function generateConstitution(projectPath) {
    const analysis = await analyzeProject(projectPath);
    const principles = inferPrinciples(analysis);
    return {
        projectName: path.basename(projectPath),
        principles,
        generatedAt: new Date().toISOString()
    };
}
async function analyzeProject(projectPath) {
    const files = fs.readdirSync(projectPath);
    return {
        hasTypeScript: files.includes('tsconfig.json'),
        hasTests: files.some(f => f.includes('test') || f.includes('spec')),
        framework: detectFramework(files),
        packageManager: detectPackageManager(files),
        languages: detectLanguages(projectPath)
    };
}
function detectFramework(files) {
    if (files.includes('next.config.js'))
        return 'Next.js';
    if (files.includes('vite.config.ts'))
        return 'Vite';
    return undefined;
}
function detectPackageManager(files) {
    if (files.includes('pnpm-lock.yaml'))
        return 'pnpm';
    if (files.includes('yarn.lock'))
        return 'yarn';
    if (files.includes('package-lock.json'))
        return 'npm';
    return undefined;
}
function detectLanguages(projectPath) {
    const extensions = new Set();
    scanDirectory(projectPath, extensions);
    return Array.from(extensions);
}
function scanDirectory(dir, extensions, depth = 0) {
    if (depth > 2)
        return;
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules')
                continue;
            if (entry.isFile()) {
                const ext = path.extname(entry.name);
                if (ext)
                    extensions.add(ext);
            }
            else if (entry.isDirectory()) {
                scanDirectory(path.join(dir, entry.name), extensions, depth + 1);
            }
        }
    }
    catch { }
}
function inferPrinciples(analysis) {
    const principles = [];
    if (analysis.hasTypeScript) {
        principles.push({
            title: 'Type Safety First',
            description: 'All code must use TypeScript strict mode',
            rationale: 'Project uses TypeScript - enforce type safety to catch errors early'
        });
    }
    if (analysis.hasTests) {
        principles.push({
            title: 'Test-Driven Development',
            description: 'Write tests before implementation',
            rationale: 'Existing test infrastructure - maintain high test coverage'
        });
    }
    principles.push({
        title: 'Minimal Code Principle',
        description: 'Write only the absolute minimal code needed',
        rationale: 'Avoid over-engineering and unnecessary complexity'
    });
    return principles;
}
export function formatConstitution(constitution) {
    let output = `# ${constitution.projectName} Constitution\n\n`;
    output += `Generated: ${constitution.generatedAt}\n\n`;
    output += `## Core Principles\n\n`;
    constitution.principles.forEach((p, i) => {
        output += `### ${i + 1}. ${p.title}\n\n`;
        output += `**Description:** ${p.description}\n\n`;
        output += `**Rationale:** ${p.rationale}\n\n`;
    });
    return output;
}
//# sourceMappingURL=constitution.js.map