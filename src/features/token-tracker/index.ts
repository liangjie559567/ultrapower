import { createReadStream } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createInterface } from 'readline';

const TOKEN_LOG_FILE = join(process.cwd(), '.omc', 'logs', 'tokens.jsonl');
const SESSION_INDEX_FILE = join(process.cwd(), '.omc', 'logs', 'token-index.json');
const _AVG_LINE_SIZE = 200;

interface TokenRecord {
  sessionId: string;
  timestamp: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

interface SessionIndex {
  sessions: Record<string, { offset: number; count: number; lastUpdate: number }>;
}

interface Stats {
  totalInput: number;
  totalOutput: number;
  recordCount: number;
  models: Record<string, { input: number; output: number }>;
}

export async function logTokenUsage(record: TokenRecord): Promise<void> {
  await mkdir(join(process.cwd(), '.omc', 'logs'), { recursive: true });
  const line = JSON.stringify(record) + '\n';
  await writeFile(TOKEN_LOG_FILE, line, { flag: 'a' });
  await updateSessionIndex(record.sessionId);
}

async function updateSessionIndex(sessionId: string): Promise<void> {
  const index = await loadSessionIndex();
  if (!index.sessions[sessionId]) {
    let offset = 0;
    try {
      const stats = await readFile(TOKEN_LOG_FILE, 'utf-8');
      offset = stats.length;
    } catch {
      // File doesn't exist yet, start from 0
    }
    index.sessions[sessionId] = { offset, count: 0, lastUpdate: Date.now() };
  }
  index.sessions[sessionId].count++;
  index.sessions[sessionId].lastUpdate = Date.now();
  await writeFile(SESSION_INDEX_FILE, JSON.stringify(index));
}

async function loadSessionIndex(): Promise<SessionIndex> {
  try {
    const data = await readFile(SESSION_INDEX_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { sessions: {} };
  }
}

export async function getSessionStats(sessionId: string): Promise<Stats> {
  const stats: Stats = { totalInput: 0, totalOutput: 0, recordCount: 0, models: {} };

  try {
    const stream = createReadStream(TOKEN_LOG_FILE);
    const rl = createInterface({ input: stream });

    for await (const line of rl) {
      if (!line.trim()) continue;
      const record: TokenRecord = JSON.parse(line);
      if (record.sessionId !== sessionId) continue;

      stats.totalInput += record.inputTokens;
      stats.totalOutput += record.outputTokens;
      stats.recordCount++;

      if (!stats.models[record.model]) {
        stats.models[record.model] = { input: 0, output: 0 };
      }
      stats.models[record.model].input += record.inputTokens;
      stats.models[record.model].output += record.outputTokens;
    }
  } catch {
    // Failed to read log file, return empty stats
  }

  return stats;
}

export async function getAllStats(): Promise<Stats> {
  const stats: Stats = { totalInput: 0, totalOutput: 0, recordCount: 0, models: {} };
  const stream = createReadStream(TOKEN_LOG_FILE);
  const rl = createInterface({ input: stream });

  for await (const line of rl) {
    if (!line.trim()) continue;
    const record: TokenRecord = JSON.parse(line);

    stats.totalInput += record.inputTokens;
    stats.totalOutput += record.outputTokens;
    stats.recordCount++;

    if (!stats.models[record.model]) {
      stats.models[record.model] = { input: 0, output: 0 };
    }
    stats.models[record.model].input += record.inputTokens;
    stats.models[record.model].output += record.outputTokens;
  }

  return stats;
}
