/**
 * index-manager.ts — 知识索引管理器
 *
 * 从 Axiom index_manager.py 移植。管理 .omc/knowledge/ 目录的索引文件。
 */

import { promises as fs } from 'fs';
import * as path from 'path';

export interface IndexEntry {
  id: string;
  title: string;
  category: string;
  confidence: number;
  created: string;
  file: string;
}

export class KnowledgeIndexManager {
  private readonly knowledgeDir: string;
  private readonly indexFile: string;

  constructor(baseDir?: string) {
    const base = baseDir ?? process.cwd();
    this.knowledgeDir = path.join(base, '.omc', 'knowledge');
    // 与 Python 源码对齐：使用 knowledge_base.md 作为索引文件
    this.indexFile = path.join(base, '.omc', 'axiom', 'evolution', 'knowledge_base.md');
  }

  async rebuildIndex(): Promise<IndexEntry[]> {
    let files: string[];
    try {
      files = await fs.readdir(this.knowledgeDir);
    } catch {
      return [];
    }

    const entries: IndexEntry[] = [];
    for (const file of files.filter(f => /^k-\d+.*\.md$/.test(f) && f !== 'index.md')) {
      const filePath = path.join(this.knowledgeDir, file);
      const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
      const meta = parseFrontmatter(content);
      if (!meta) continue;

      entries.push({
        id: meta['id'] ?? file.replace('.md', ''),
        title: meta['title'] ?? '',
        category: meta['category'] ?? 'general',
        confidence: parseFloat(meta['confidence'] ?? '0.7') || 0.7,
        created: meta['created'] ?? '',
        file,
      });
    }

    entries.sort((a, b) => a.id.localeCompare(b.id));
    await this.writeIndex(entries);
    return entries;
  }

  async addToIndex(entry: IndexEntry): Promise<void> {
    const entries = await this.loadIndex();
    const existing = entries.findIndex(e => e.id === entry.id);
    if (existing >= 0) {
      entries[existing] = entry;
    } else {
      entries.push(entry);
    }
    await this.writeIndex(entries);
  }

  /** 从索引中移除指定条目（对齐 Python remove_from_index） */
  async removeFromIndex(id: string): Promise<void> {
    const entries = await this.loadIndex();
    const filtered = entries.filter(e => e.id !== id);
    if (filtered.length !== entries.length) {
      await this.writeIndex(filtered);
    }
  }

  /** 更新指定条目的置信度（对齐 Python update_confidence） */
  async updateConfidence(id: string, newConfidence: number): Promise<void> {
    const entries = await this.loadIndex();
    const entry = entries.find(e => e.id === id);
    if (entry) {
      entry.confidence = newConfidence;
      await this.writeIndex(entries);
    }
  }

  async loadIndex(): Promise<IndexEntry[]> {
    let text: string;
    try {
      text = await fs.readFile(this.indexFile, 'utf-8');
    } catch {
      return [];
    }

    const entries: IndexEntry[] = [];
    let inTable = false;
    for (const line of text.split('\n')) {
      if (line.includes('| ID |')) { inTable = true; continue; }
      if (inTable && line.startsWith('|---')) continue;
      if (inTable && line.startsWith('|')) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 6 && parts[1]) {
          entries.push({
            id: parts[1] ?? '',
            title: parts[2] ?? '',
            category: parts[3] ?? '',
            confidence: parseFloat(parts[4] ?? '0.7') || 0.7,
            created: parts[5] ?? '',
            file: `${parts[1]}.md`,
          });
        }
      } else if (inTable && !line.startsWith('|')) {
        break;
      }
    }
    return entries;
  }

  private async writeIndex(entries: IndexEntry[]): Promise<void> {
    await fs.mkdir(path.dirname(this.indexFile), { recursive: true });

    // 分类统计（对齐 Python _generate_index）
    const categoryCount: Record<string, number> = {};
    for (const e of entries) {
      categoryCount[e.category] = (categoryCount[e.category] ?? 0) + 1;
    }
    const categoryLines = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, cnt]) => `| ${cat} | ${cnt} |`);

    // 标签云（从 title 提取关键词）
    const wordFreq: Record<string, number> = {};
    for (const e of entries) {
      for (const word of e.title.toLowerCase().split(/\W+/).filter(w => w.length > 3)) {
        wordFreq[word] = (wordFreq[word] ?? 0) + 1;
      }
    }
    const tagCloud = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([w, c]) => `${w}(${c})`)
      .join(' ');

    const lines = [
      '# Knowledge Base Index',
      '',
      `> Last updated: ${new Date().toISOString().slice(0, 10)} | Total: ${entries.length} entries`,
      '',
      '## Knowledge Index',
      '',
      '| ID | Title | Category | Confidence | Created | Status |',
      '|---|---|---|---|---|---|',
      ...entries.map(e =>
        `| ${e.id} | ${e.title} | ${e.category} | ${e.confidence.toFixed(2)} | ${e.created} | active |`
      ),
      '',
      '## Category Statistics',
      '',
      '| Category | Count |',
      '|---|---|',
      ...categoryLines,
      '',
      '## Tag Cloud',
      '',
      tagCloud || '(empty)',
      '',
      '## Quality Management',
      '',
      `- High confidence (≥0.8): ${entries.filter(e => e.confidence >= 0.8).length}`,
      `- Medium confidence (0.5-0.8): ${entries.filter(e => e.confidence >= 0.5 && e.confidence < 0.8).length}`,
      `- Low confidence (<0.5): ${entries.filter(e => e.confidence < 0.5).length}`,
      '',
    ];
    await fs.writeFile(this.indexFile, lines.join('\n'), 'utf-8');
  }
}

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
