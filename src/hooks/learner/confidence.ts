/**
 * confidence.ts — 置信度衰减引擎
 *
 * 从 Axiom confidence.py 移植。管理知识条目的置信度分数生命周期。
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { AxiomConfig } from '../../config/axiom-config.js';
import { defaultAxiomConfig } from '../../config/axiom-config.js';

export interface ConfidenceAdjustment {
  id: string;
  oldConfidence: number;
  newConfidence: number;
  deprecated: boolean;
}

export class ConfidenceEngine {
  private readonly knowledgeDir: string;
  private readonly config: AxiomConfig['evolution'];

  static readonly VERIFY_BOOST = 0.1;
  static readonly REFERENCE_BOOST = 0.05;
  static readonly MISLEADING_PENALTY = -0.2;
  static readonly UNUSED_DECAY = -0.1;

  constructor(baseDir?: string, config?: Partial<AxiomConfig['evolution']>) {
    const base = baseDir ?? process.cwd();
    this.knowledgeDir = path.join(base, '.omc', 'knowledge');
    this.config = { ...defaultAxiomConfig.evolution, ...config };
  }

  async onVerified(kid: string): Promise<number | null> {
    return this.adjust(kid, ConfidenceEngine.VERIFY_BOOST);
  }

  async onReferenced(kid: string): Promise<number | null> {
    return this.adjust(kid, ConfidenceEngine.REFERENCE_BOOST);
  }

  async onMisleading(kid: string): Promise<number | null> {
    return this.adjust(kid, ConfidenceEngine.MISLEADING_PENALTY);
  }

  async decayUnused(days?: number): Promise<ConfidenceAdjustment[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days ?? this.config.decayDays));

    const decayed: ConfidenceAdjustment[] = [];
    let files: string[];
    try {
      files = await fs.readdir(this.knowledgeDir);
    } catch {
      return [];
    }

    for (const file of files.filter(f => /^k-\d+.*\.md$/.test(f))) {
      const filePath = path.join(this.knowledgeDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const meta = parseFrontmatter(content);
      if (!meta) continue;

      const createdStr = meta['created'] ?? '';
      const created = new Date(createdStr);
      if (isNaN(created.getTime()) || created > cutoff) continue;

      const oldConf = parseFloat(meta['confidence'] ?? '0.7') || 0.7;
      const newConf = Math.max(0, Math.round((oldConf + ConfidenceEngine.UNUSED_DECAY) * 100) / 100);
      await setConfidence(filePath, content, newConf);

      decayed.push({
        id: meta['id'] ?? file,
        oldConfidence: oldConf,
        newConfidence: newConf,
        deprecated: newConf < this.config.minConfidence,
      });
    }
    return decayed;
  }

  /** 获取置信度低于阈值的条目（对齐 Python get_deprecated） */
  async getDeprecated(): Promise<ConfidenceAdjustment[]> {
    let files: string[];
    try {
      files = await fs.readdir(this.knowledgeDir);
    } catch {
      return [];
    }
    const deprecated: ConfidenceAdjustment[] = [];
    for (const file of files.filter(f => /^k-\d+.*\.md$/.test(f))) {
      const filePath = path.join(this.knowledgeDir, file);
      const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
      const meta = parseFrontmatter(content);
      if (!meta) continue;
      const conf = parseFloat(meta['confidence'] ?? '0.7') || 0.7;
      if (conf < this.config.minConfidence) {
        deprecated.push({
          id: meta['id'] ?? file,
          oldConfidence: conf,
          newConfidence: conf,
          deprecated: true,
        });
      }
    }
    return deprecated;
  }

  async getConfidence(kid: string): Promise<number | null> {
    const filePath = await findFile(this.knowledgeDir, kid);
    if (!filePath) return null;
    const content = await fs.readFile(filePath, 'utf-8');
    const meta = parseFrontmatter(content);
    return meta ? parseFloat(meta['confidence'] ?? '0.7') || 0.7 : null;
  }

  private async adjust(kid: string, delta: number): Promise<number | null> {
    const filePath = await findFile(this.knowledgeDir, kid);
    if (!filePath) return null;
    const content = await fs.readFile(filePath, 'utf-8');
    const meta = parseFrontmatter(content);
    if (!meta) return null;
    const oldConf = parseFloat(meta['confidence'] ?? '0.7') || 0.7;
    const newConf = Math.max(0, Math.min(1, Math.round((oldConf + delta) * 100) / 100));
    await setConfidence(filePath, content, newConf);
    return newConf;
  }
}

// ── Helpers ──

function parseFrontmatter(text: string): Record<string, string> | null {
  if (!text.startsWith('---\n')) return null;
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return null;
  const raw = text.slice(4, end);
  const meta: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return meta;
}

async function findFile(dir: string, kid: string): Promise<string | null> {
  try {
    const files = await fs.readdir(dir);
    const match = files.find(f => f.startsWith(`${kid}-`) || f === `${kid}.md`);
    return match ? path.join(dir, match) : null;
  } catch {
    return null;
  }
}

async function setConfidence(filePath: string, content: string, value: number): Promise<void> {
  const updated = content.replace(/(confidence:\s*)\S+/, `$1${value}`);
  await fs.writeFile(filePath, updated, 'utf-8');
}
