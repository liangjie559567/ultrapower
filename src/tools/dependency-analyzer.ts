import { z } from 'zod';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';

const DependencyAnalyzerSchema = z.object({
  filePath: z.string().describe('File path to analyze'),
  depth: z.number().optional().describe('Dependency depth (default: 1)')
});

export const dependencyAnalyzerTool = {
  name: 'dependency_analyzer',
  description: 'Analyze file-level dependencies (imports/requires)',
  schema: DependencyAnalyzerSchema.shape,
  handler: async (args: z.infer<typeof DependencyAnalyzerSchema>) => {
    try {
      const { filePath, depth = 1 } = args;
      const content = readFileSync(filePath, 'utf-8');
      const deps = extractDependencies(content, filePath);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ file: filePath, dependencies: deps, depth }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
};

function extractDependencies(content: string, filePath: string): string[] {
  const deps: string[] = [];
  const dir = dirname(filePath);

  // Match: import ... from '...'
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  // Match: require('...')
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    deps.push(resolveImport(match[1], dir));
  }
  while ((match = requireRegex.exec(content)) !== null) {
    deps.push(resolveImport(match[1], dir));
  }

  return [...new Set(deps)];
}

function resolveImport(importPath: string, baseDir: string): string {
  if (importPath.startsWith('.')) {
    return join(baseDir, importPath);
  }
  return importPath; // External package
}
