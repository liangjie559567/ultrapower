import { promises as fs } from 'fs';
import path from 'path';

interface Module {
  name: string;
  responsibility: string;
  implementation: string;
  dependencies: string;
  acceptance: string;
}

export async function splitModificationPlan(workingDir: string): Promise<string[]> {
  const modPlanPath = path.join(workingDir, '.omc', 'ccg', 'modification-plan.md');
  const content = await fs.readFile(modPlanPath, 'utf-8');

  const modules = parseModules(content);
  const devModulesDir = path.join(workingDir, '.omc', 'ccg', 'dev-modules');

  await fs.mkdir(devModulesDir, { recursive: true });

  const createdFiles: string[] = [];
  for (let i = 0; i < modules.length; i++) {
    const filePath = await createModuleDoc(devModulesDir, i + 1, modules[i]);
    createdFiles.push(filePath);
  }

  return createdFiles;
}

function parseModules(content: string): Module[] {
  const modules: Module[] = [];
  const sections = content.split(/##\s+/).filter(s => s.trim());

  for (const section of sections) {
    if (section.includes('模块') || section.includes('Module')) {
      const lines = section.split('\n');
      modules.push({
        name: lines[0].trim(),
        responsibility: extractSection(section, '职责', 'Responsibility'),
        implementation: extractSection(section, '实现', 'Implementation'),
        dependencies: extractSection(section, '依赖', 'Dependencies'),
        acceptance: extractSection(section, '验收', 'Acceptance')
      });
    }
  }

  return modules.length > 0 ? modules : [createDefaultModule(content)];
}

function extractSection(content: string, ...keywords: string[]): string {
  for (const kw of keywords) {
    const regex = new RegExp(`###?\\s*${kw}[^#]*?([\\s\\S]*?)(?=###|$)`, 'i');
    const match = content.match(regex);
    if (match) return match[1].trim();
  }
  return '';
}

function createDefaultModule(content: string): Module {
  return {
    name: 'Module-1',
    responsibility: '实现修改计划中的功能',
    implementation: content.substring(0, 500),
    dependencies: '无',
    acceptance: '功能正常运行'
  };
}

async function createModuleDoc(dir: string, index: number, module: Module): Promise<string> {
  const filePath = path.join(dir, `dev-module-${index}.md`);
  const timestamp = new Date().toISOString();

  const content = `# 开发模块

**模块名**: ${module.name}
**创建时间**: ${timestamp}

## 模块职责
${module.responsibility}

## 实现要点
${module.implementation}

## 依赖关系
${module.dependencies}

## 验收标准
${module.acceptance}
`;

  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}
