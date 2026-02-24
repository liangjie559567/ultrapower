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
    this.indexFile = path.join(this.knowledgeDir, 'index.md');
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
    await fs.mkdir(this.knowledgeDir, { recursive: true });
    const lines = [
      '# Knowledge Index',
      '',
      `> Last updated: ${new Date().toISOString().slice(0, 10)} | Total: ${entries.length} entries`,
      '',
      '| ID | Title | Category | Confidence | Created |',
      '|---|---|---|---|---|',
      ...entries.map(e =>
        `| ${e.id} | ${e.title} | ${e.category} | ${e.confidence} | ${e.created} |`
      ),
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
