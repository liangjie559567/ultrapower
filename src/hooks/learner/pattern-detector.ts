/**
 * pattern-detector.ts — 模式检测器
 *
 * 从 Axiom pattern_detector.py 移植。检测代码中的重复模式。
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { AxiomConfig } from '../../config/axiom-config.js';
import { defaultAxiomConfig } from '../../config/axiom-config.js';

export interface PatternMatch {
  patternName: string;
  matchedFile: string;
  confidence: number;
}

export interface PatternEntry {
  id: string;
  name: string;
  category: string;
  occurrences: number;
  confidence: number;
  status: 'pending' | 'active' | 'deprecated';
  firstSeen: string;
}

export interface DetectionResult {
  newPatterns: string[];
  promoted: string[];
  matches: string[];
}

const BUILTIN_PATTERNS = [
  {
    name: 'Repository + Cache Pattern',
    category: 'data-layer',
    keywords: ['_cache', 'getWithCache', 'Repository'],
    structureRegex: /class\s+\w+Repository.*_cache/s,
  },
  {
    name: 'ViewModel + Service Pattern',
    category: 'business-logic',
    keywords: ['BaseViewModel', 'locator<', 'setBusy'],
    structureRegex: /class\s+\w+ViewModel\s+extends\s+BaseViewModel/,
  },
  {
    name: 'Singleton Service Pattern',
    category: 'common',
    keywords: ['_instance', 'factory', '._internal'],
    structureRegex: /static\s+final\s+\w+\s+_instance|factory\s+\w+\.\w+/,
  },
];

export class PatternDetector {
  private readonly patternFile: string;
  private readonly promoteThreshold: number;

  constructor(baseDir?: string, config?: Partial<AxiomConfig['evolution']>) {
    const base = baseDir ?? process.cwd();
    this.patternFile = path.join(base, '.omc', 'axiom', 'evolution', 'pattern_library.md');
    const cfg = { ...defaultAxiomConfig.evolution, ...config };
    this.promoteThreshold = cfg.patternMinOccurrences;
  }

  detectFromDiff(diffText: string): PatternMatch[] {
    if (!diffText) return [];
    const matches: PatternMatch[] = [];
    const files = [...diffText.matchAll(/\+\+\+ b\/(.+)/g)].map(m => m[1] ?? '');

    for (const pattern of BUILTIN_PATTERNS) {
      const keywordHits = pattern.keywords.filter(kw => diffText.includes(kw)).length;
      const structMatch = pattern.structureRegex.test(diffText);
      if (keywordHits >= 2 || structMatch) {
        for (const f of files) {
          matches.push({
            patternName: pattern.name,
            matchedFile: f,
            confidence: 0.7 + (structMatch ? 0.1 : 0),
          });
        }
      }
    }
    return matches;
  }

  async loadPatterns(): Promise<PatternEntry[]> {
    let text: string;
    try {
      text = await fs.readFile(this.patternFile, 'utf-8');
    } catch {
      return [];
    }

    const patterns: PatternEntry[] = [];
    let inTable = false;
    for (const line of text.split('\n')) {
      if (line.includes('| ID | Name |')) { inTable = true; continue; }
      if (inTable && line.startsWith('|---')) continue;
      if (inTable && line.startsWith('|')) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 7 && parts[1]) {
          patterns.push({
            id: parts[1] ?? '',
            name: parts[2] ?? '',
            category: parts[3] ?? '',
            occurrences: parseInt(parts[4] ?? '0', 10) || 0,
            confidence: parseFloat(parts[5] ?? '0.7') || 0.7,
            status: (parts[6] as PatternEntry['status']) ?? 'pending',
            firstSeen: new Date().toISOString().slice(0, 10),
          });
        }
      } else if (inTable && !line.startsWith('|')) {
        break;
      }
    }
    return patterns;
  }

  async detectAndUpdate(diffText: string): Promise<DetectionResult> {
    const matches = this.detectFromDiff(diffText);
    const current = await this.loadPatterns();
    const result: DetectionResult = { newPatterns: [], promoted: [], matches: matches.map(m => m.patternName) };

    const patternFiles = new Map<string, Set<string>>();
    for (const m of matches) {
      if (!patternFiles.has(m.patternName)) patternFiles.set(m.patternName, new Set());
      patternFiles.get(m.patternName)!.add(m.matchedFile);
    }

    for (const [pname, files] of patternFiles) {
      const existing = current.find(p => p.name === pname);
      if (existing) {
        existing.occurrences += files.size;
        if (existing.occurrences >= this.promoteThreshold && existing.status === 'pending') {
          existing.status = 'active';
          result.promoted.push(pname);
        }
      } else {
        const newEntry: PatternEntry = {
          id: `P-${String(current.length + result.newPatterns.length + 1).padStart(3, '0')}`,
          name: pname,
          category: BUILTIN_PATTERNS.find(p => p.name === pname)?.category ?? 'common',
          occurrences: files.size,
          confidence: 0.7,
          status: 'pending',
          firstSeen: new Date().toISOString().slice(0, 10),
        };
        current.push(newEntry);
        result.newPatterns.push(pname);
      }
    }

    // 写回 pattern_library.md（对齐 Python detect_and_update）
    if (matches.length > 0) {
      await this.writePatterns(current);
    }

    return result;
  }

  private async writePatterns(patterns: PatternEntry[]): Promise<void> {
    await fs.mkdir(path.dirname(this.patternFile), { recursive: true });
    const lines = [
      '# Pattern Library',
      '',
      `> Last updated: ${new Date().toISOString().slice(0, 10)} | Total: ${patterns.length}`,
      '',
      '| ID | Name | Category | Occurrences | Confidence | Status |',
      '|---|---|---|---|---|---|',
      ...patterns.map(p =>
        `| ${p.id} | ${p.name} | ${p.category} | ${p.occurrences} | ${p.confidence.toFixed(2)} | ${p.status} |`
      ),
      '',
    ];
    await fs.writeFile(this.patternFile, lines.join('\n'), 'utf-8');
  }
}
