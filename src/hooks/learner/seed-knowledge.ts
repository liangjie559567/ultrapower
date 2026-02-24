/**
 * seed-knowledge.ts — 种子知识初始化器
 *
 * 从 Axiom seed_knowledge.py 移植。从 knowledge_base.md 加载种子知识条目。
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { KnowledgeEntry } from './harvester.js';
import { KnowledgeHarvester } from './harvester.js';

export interface SeedResult {
  seeded: number;
  skipped: number;
  entries: KnowledgeEntry[];
}

export class SeedKnowledge {
  private readonly harvester: KnowledgeHarvester;
  private readonly knowledgeBaseFile: string;

  constructor(baseDir?: string) {
    const base = baseDir ?? process.cwd();
    this.harvester = new KnowledgeHarvester(base);
    this.knowledgeBaseFile = path.join(
      base,
      '.omc',
      'axiom',
      'evolution',
      'knowledge_base.md'
    );
  }

  async seed(force = false): Promise<SeedResult> {
    const existing = await this.harvester.listEntries();
    if (existing.length > 0 && !force) {
      return { seeded: 0, skipped: existing.length, entries: [] };
    }

    const seedItems = await this.loadSeedItems();
    const entries: KnowledgeEntry[] = [];

    for (const item of seedItems) {
      const entry = await this.harvester.harvest(
        'user_feedback',
        item.title,
        item.content,
        { confidence: item.confidence }
      );
      entries.push(entry);
    }

    return { seeded: entries.length, skipped: 0, entries };
  }

  private async loadSeedItems(): Promise<
    Array<{ title: string; content: string; category: string; confidence: number }>
  > {
    let text: string;
    try {
      text = await fs.readFile(this.knowledgeBaseFile, 'utf-8');
    } catch {
      return this.getBuiltinSeeds();
    }

    const items: Array<{
      title: string;
      content: string;
      category: string;
      confidence: number;
    }> = [];

    // 解析 knowledge_base.md 中的条目（### 标题格式）
    const sections = text.split(/^### /m).filter(Boolean);
    for (const section of sections) {
      const lines = section.split('\n');
      const title = lines[0]?.trim() ?? '';
      if (!title) continue;

      const content = lines.slice(1).join('\n').trim();
      const categoryMatch = content.match(/\*\*Category:\*\*\s*(.+)/);
      const confidenceMatch = content.match(/\*\*Confidence:\*\*\s*([\d.]+)/);

      items.push({
        title,
        content,
        category: categoryMatch?.[1]?.trim() ?? 'general',
        confidence: parseFloat(confidenceMatch?.[1] ?? '0.85') || 0.85,
      });
    }

    return items.length > 0 ? items : this.getBuiltinSeeds();
  }

  private getBuiltinSeeds(): Array<{
    title: string;
    content: string;
    category: string;
    confidence: number;
  }> {
    return [
      {
        title: 'TypeScript strict mode best practices',
        content:
          'Always enable strict mode in tsconfig.json. Use explicit return types for public APIs. Avoid `any` — prefer `unknown` with type guards.',
        category: 'typescript',
        confidence: 0.9,
      },
      {
        title: 'File system operations with fs/promises',
        content:
          'Use `import { promises as fs } from "fs"` for async file operations. Always handle ENOENT errors gracefully with try/catch.',
        category: 'nodejs',
        confidence: 0.9,
      },
      {
        title: 'Markdown table parsing pattern',
        content:
          'Split by newline, detect header row with `| ID |`, skip separator `|---`, parse data rows by splitting on `|` and trimming.',
        category: 'patterns',
        confidence: 0.85,
      },
    ];
  }
}
