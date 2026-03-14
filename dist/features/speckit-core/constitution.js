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
    const resolvedPath = path.resolve(projectPath);
    if (!resolvedPath.startsWith(path.resolve(process.cwd()))) {
        throw new Error('Path traversal detected');
    }
    const files = await fs.promises.readdir(resolvedPath);
    const pkgJson = await readPackageJson(resolvedPath);
    return {
        hasTypeScript: files.includes('tsconfig.json'),
        hasTests: files.some(f => f.includes('test') || f.includes('spec')),
        framework: detectFramework(files),
        packageManager: detectPackageManager(files),
        languages: await detectLanguages(resolvedPath),
        dependencies: pkgJson ? Object.keys(pkgJson.dependencies || {}) : [],
        hasLinter: files.includes('.eslintrc.js') || files.includes('.eslintrc.json') || !!pkgJson?.devDependencies?.eslint,
        hasFormatter: files.includes('.prettierrc') || !!pkgJson?.devDependencies?.prettier,
        projectStructure: await detectStructure(resolvedPath)
    };
}
async function readPackageJson(projectPath) {
    try {
        const pkgPath = path.join(projectPath, 'package.json');
        const content = await fs.promises.readFile(pkgPath, 'utf-8');
        return JSON.parse(content);
    }
    catch (err) {
        if (err instanceof SyntaxError) {
            console.warn(`Invalid JSON in package.json: ${err.message}`);
        }
        return null;
    }
}
async function detectStructure(projectPath) {
    try {
        const entries = await fs.promises.readdir(projectPath, { withFileTypes: true });
        if (entries.some(e => e.isDirectory() && e.name === 'packages'))
            return 'monorepo';
        if (entries.some(e => e.isDirectory() && e.name === 'src'))
            return 'src-based';
        return 'flat';
    }
    catch {
        return 'unknown';
    }
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
async function detectLanguages(projectPath) {
    const extensions = new Set();
    await scanDirectory(projectPath, extensions);
    return Array.from(extensions);
}
async function scanDirectory(dir, extensions, depth = 0, visited = new Set()) {
    if (depth > 2)
        return;
    try {
        const realPath = await fs.promises.realpath(dir);
        if (visited.has(realPath))
            return;
        visited.add(realPath);
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules')
                continue;
            if (entry.isFile()) {
                const ext = path.extname(entry.name);
                if (ext)
                    extensions.add(ext);
            }
            else if (entry.isDirectory()) {
                await scanDirectory(path.join(dir, entry.name), extensions, depth + 1, visited);
            }
        }
    }
    catch (_error) {
        // Skip inaccessible directories
    }
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
    if (analysis.hasLinter || analysis.hasFormatter) {
        principles.push({
            title: 'Code Style Consistency',
            description: `Follow ${analysis.hasLinter ? 'ESLint' : ''}${analysis.hasLinter && analysis.hasFormatter ? ' and ' : ''}${analysis.hasFormatter ? 'Prettier' : ''} rules`,
            rationale: 'Project has established code style tools - maintain consistency'
        });
    }
    if (analysis.projectStructure === 'monorepo') {
        principles.push({
            title: 'Monorepo Architecture',
            description: 'Respect package boundaries and shared dependencies',
            rationale: 'Project uses monorepo structure - maintain clear module separation'
        });
    }
    if (analysis.framework) {
        principles.push({
            title: `${analysis.framework} Best Practices`,
            description: `Follow ${analysis.framework} conventions and patterns`,
            rationale: `Project uses ${analysis.framework} - align with framework idioms`
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