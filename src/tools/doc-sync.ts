import { z } from 'zod';
import { readFileSync, writeFileSync } from 'fs';

const DocSyncSchema = z.object({
  sourceFile: z.string().describe('Source code file with comments'),
  targetDoc: z.string().describe('Target documentation file'),
  section: z.string().optional().describe('Section to update (default: append)')
});

export const docSyncTool = {
  name: 'doc_sync',
  description: 'Sync code comments to documentation files',
  schema: DocSyncSchema.shape,
  handler: async (args: z.infer<typeof DocSyncSchema>) => {
    try {
      const { sourceFile, targetDoc, section } = args;
      const code = readFileSync(sourceFile, 'utf-8');
      const rules = extractSecurityRules(code);

      if (rules.length === 0) {
        return {
          content: [{ type: 'text' as const, text: 'No security rules found' }]
        };
      }

      const docContent = readFileSync(targetDoc, 'utf-8');
      const updated = section
        ? updateSection(docContent, section, rules)
        : appendRules(docContent, rules);

      writeFileSync(targetDoc, updated, 'utf-8');

      return {
        content: [{
          type: 'text' as const,
          text: `Synced ${rules.length} rules to ${targetDoc}`
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

function extractSecurityRules(code: string): string[] {
  const rules: string[] = [];
  const regex = /\/\*\*[\s\S]*?@security\s+([\s\S]*?)\*\//g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    rules.push(match[1].trim());
  }
  return rules;
}

function updateSection(doc: string, section: string, rules: string[]): string {
  const marker = `## ${section}`;
  const idx = doc.indexOf(marker);
  if (idx === -1) return appendRules(doc, rules);

  const nextSection = doc.indexOf('\n## ', idx + marker.length);
  const before = doc.slice(0, idx + marker.length);
  const after = nextSection === -1 ? '' : doc.slice(nextSection);

  return `${before}\n\n${rules.map(r => `- ${r}`).join('\n')}\n${after}`;
}

function appendRules(doc: string, rules: string[]): string {
  return `${doc}\n\n## Auto-Generated Rules\n\n${rules.map(r => `- ${r}`).join('\n')}\n`;
}
