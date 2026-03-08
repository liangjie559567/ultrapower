import { z } from 'zod';

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

const CCGInputSchema = z.object({
  workingDir: z.string().max(500),
  projectType: z.enum(['new', 'old']).optional(),
  docType: z.enum(ALLOWED_DOC_TYPES).optional(),
  vars: z.record(z.string(), z.string()).optional(),
}).strict();

export interface CCGInput {
  workingDir: string;
  projectType?: 'new' | 'old';
  docType?: DocType;
  vars?: Record<string, string>;
}

export function sanitizeCCGInput(raw: unknown): CCGInput {
  const parsed = CCGInputSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(`Invalid CCG input: ${parsed.error.issues.map(i => i.message).join(', ')}`);
  }

  const { workingDir, projectType, docType, vars } = parsed.data;

  if (workingDir.includes('..') || workingDir.includes('\0')) {
    throw new Error('Path traversal detected in workingDir');
  }

  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      if (key.length > 100 || value.length > 10000) {
        throw new Error(`Template variable "${key}" exceeds size limit`);
      }
    }
  }

  return { workingDir, projectType, docType, vars };
}

export function assertValidDocType(type: unknown): DocType {
  if (typeof type !== 'string' || !ALLOWED_DOC_TYPES.includes(type as DocType)) {
    throw new Error(`Invalid document type: ${type}. Allowed: ${ALLOWED_DOC_TYPES.join(', ')}`);
  }
  return type as DocType;
}
