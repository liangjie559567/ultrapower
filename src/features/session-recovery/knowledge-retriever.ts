/**
 * 知识检索器 - 混合检索策略
 * relevance_score = (vector_similarity × 0.7) + (time_decay × 0.2) + (usage_frequency × 0.1)
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface KnowledgeEntry {
  content: string;
  lastUpdated: string;
  occurrences: number;
}

/**
 * 语义检索相关知识（top 5）
 */
export async function retrieveRelevantKnowledge(
  directory: string,
  query: string
): Promise<Array<{ content: string; score: number }>> {
  const knowledgePath = join(directory, '.omc', 'axiom', 'evolution', 'knowledge_base.md');

  if (!existsSync(knowledgePath)) {
    return [];
  }

  try {
    const content = readFileSync(knowledgePath, 'utf-8');
    const entries = parseKnowledgeBase(content);
    const scored = entries.map((entry) => ({
      content: entry.content,
      score: calculateRelevanceScore(entry, query),
    }));

    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
  } catch {
    return [];
  }
}

function parseKnowledgeBase(content: string): KnowledgeEntry[] {
  const entries: KnowledgeEntry[] = [];
  const sections = content.split(/###\s+/).slice(1);

  for (const section of sections) {
    const lines = section.split('\n');
    const title = lines[0]?.trim();
    const occMatch = section.match(/\*\*出现次数\*\*:\s*(\d+)/);
    const dateMatch = section.match(/\*\*最后更新\*\*:\s*(\S+)/);

    if (title) {
      entries.push({
        content: section,
        lastUpdated: dateMatch?.[1] || '',
        occurrences: parseInt(occMatch?.[1] || '1', 10),
      });
    }
  }

  return entries;
}

function calculateRelevanceScore(entry: KnowledgeEntry, query: string): number {
  const vectorSim = calculateVectorSimilarity(entry.content, query);
  const timeDecay = calculateTimeDecay(entry.lastUpdated);
  const usageFreq = Math.min(entry.occurrences / 10, 1);

  return vectorSim * 0.7 + timeDecay * 0.2 + usageFreq * 0.1;
}

function calculateVectorSimilarity(text: string, query: string): number {
  if (!query) return 0;

  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  const matches = queryWords.filter((word) => textLower.includes(word)).length;
  return matches / queryWords.length;
}

function calculateTimeDecay(dateStr: string): number {
  if (!dateStr) return 0.5;

  try {
    const date = new Date(dateStr);
    const now = new Date();
    const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    return Math.max(0, 1 - daysDiff / 365);
  } catch {
    return 0.5;
  }
}
