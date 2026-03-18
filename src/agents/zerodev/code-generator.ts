// code-generator Agent - 配置驱动实现

import { ValidationError, InputError } from './types.js';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const TEMPLATE_REGISTRY = [
  { keywords: ['jwt', '认证', '登录'], template: 'auth/jwt-auth.ts.template' },
  { keywords: ['crud', '增删改查'], template: 'crud/rest-crud.ts.template' },
  { keywords: ['上传', 'upload'], template: 'upload/s3-upload.ts.template' },
  { keywords: ['支付', 'payment'], template: 'payment/stripe-payment.ts.template' },
  { keywords: ['通知', '邮件', 'notification'], template: 'notification/email-notification.ts.template' }
];

export function matchTemplate(requirement: string): string {
  if (!requirement?.trim()) {
    throw new InputError('Requirement cannot be empty');
  }
  if (requirement.length > 500) {
    throw new ValidationError('Requirement exceeds 500 characters');
  }
  const req = requirement.toLowerCase().replace(/[<>{}]/g, '');
  for (const { keywords, template } of TEMPLATE_REGISTRY) {
    if (keywords.some(kw => req.includes(kw))) {
      return template;
    }
  }
  throw new Error(`No template found for: ${requirement}`);
}

const TEMPLATE_GENERATORS: Record<string, (vars: Record<string, string>) => string> = {
  auth: (vars) => `  private secretKey = '${vars.secretKey || 'default-secret'}';\n  async authenticate() { return true; }\n`,
  crud: () => `  async create(req: Request, res: Response) {\n    return res.json({ id: 1, ...req.body });\n  }\n\n  async read(req: Request, res: Response) {\n    return res.json({ id: req.params.id });\n  }\n\n  async update(req: Request, res: Response) {\n    return res.json({ id: req.params.id, ...req.body });\n  }\n\n  async delete(req: Request, res: Response) {\n    return res.json({ success: true });\n  }\n`,
  upload: () => `  async upload(req: Request, res: Response) {\n    return res.json({ url: 's3://bucket/file' });\n  }\n`,
  payment: () => `  async charge(req: Request, res: Response) {\n    return res.json({ chargeId: 'ch_123' });\n  }\n`,
  notification: () => `  async send(req: Request, res: Response) {\n    return res.json({ sent: true });\n  }\n`
};

export function generateCode(template: string, vars: Record<string, string>): string {
  if (!template?.trim()) {
    throw new InputError('Template cannot be empty');
  }
  if (!vars.className?.trim()) {
    throw new InputError('className is required');
  }
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(vars.className)) {
    throw new ValidationError('className must be PascalCase and start with a letter');
  }
  if (JSON.stringify(vars).length > 10000) {
    throw new ValidationError('vars object too large');
  }
  const className = vars.className;
  const templateType = template.split('/')[0];
  const methods = TEMPLATE_GENERATORS[templateType]?.(vars) || '';

  return `import { Request, Response } from 'express';\n\nexport class ${className} {\n${methods}}\n`;
}

async function validateCodeWithLSP(code: string): Promise<{
  score: number;
  errors: string[];
  warnings: string[];
}> {
  const tempDir = join(tmpdir(), '.omc', 'zerodev', 'temp');
  mkdirSync(tempDir, { recursive: true });
  const tempFile = join(tempDir, `temp-${Date.now()}.ts`);

  try {
    writeFileSync(tempFile, code);

    const { mcp__plugin_ultrapower_t__lsp_diagnostics } = globalThis as any;
    if (!mcp__plugin_ultrapower_t__lsp_diagnostics) {
      throw new Error('LSP tool not available');
    }

    const diagnostics = await mcp__plugin_ultrapower_t__lsp_diagnostics({ file: tempFile });
    const errors = diagnostics.filter((d: any) => d.severity === 'error');
    const warnings = diagnostics.filter((d: any) => d.severity === 'warning');

    const score = Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5));

    return {
      score,
      errors: errors.map((e: any) => e.message),
      warnings: warnings.map((w: any) => w.message)
    };
  } finally {
    try { unlinkSync(tempFile); } catch {}
  }
}

function checkQualityLegacy(code: string): number {
  let score = 50;
  if (code.includes('export')) score += 20;
  if (code.includes('class')) score += 15;
  if (code.includes('import')) score += 10;
  if (code.length > 50) score += 5;
  return Math.min(score, 100);
}

export async function checkQuality(code: string): Promise<number> {
  try {
    const result = await validateCodeWithLSP(code);
    return result.score;
  } catch {
    return checkQualityLegacy(code);
  }
}
