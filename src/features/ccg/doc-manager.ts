import * as fs from 'fs/promises';
import * as path from 'path';
import { assertValidDocType } from './input-sanitizer.js';
import { docCache } from './doc-cache.js';

const ALLOWED_DOC_TYPES = [
  'requirements',
  'tech-design',
  'feature-flow',
  'modification-plan',
  'optimization-list',
  'test-checklist',
  'dev-module',
] as const;

type DocType = typeof ALLOWED_DOC_TYPES[number];

export function getDocPath(type: string): string {
  const validType = assertValidDocType(type);
  return path.join(__dirname, 'templates', `${validType}.md`);
}

export async function createDocFromTemplate(
  type: string,
  vars: Record<string, string>
): Promise<string> {
  const templatePath = getDocPath(type);
  let content = await docCache.readWithCache(templatePath);

  for (const [key, value] of Object.entries(vars)) {
    if (key.length > 100) {
      throw new Error(`Template variable key too long: ${key.slice(0, 50)}...`);
    }
    if (value.length > 10000) {
      throw new Error(`Template variable value too long for key: ${key}`);
    }
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
    content = content.replace(new RegExp(`{{${safeKey}}}`, 'g'), value);
  }

  return content;
}

export async function batchCreateDocs(
  requests: Array<{ type: string; vars: Record<string, string> }>
): Promise<string[]> {
  return Promise.all(requests.map(req => createDocFromTemplate(req.type, req.vars)));
}
