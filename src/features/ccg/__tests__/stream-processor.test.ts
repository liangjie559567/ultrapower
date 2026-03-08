import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileLines, processFileStream } from '../stream-processor.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), '.test-stream');
const TEST_FILE = join(TEST_DIR, 'large-file.txt');

describe('Stream Processor', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    const lines = Array.from({ length: 1000 }, (_, i) => `Line ${i + 1}`);
    writeFileSync(TEST_FILE, lines.join('\n'));
  });

  it('reads file line by line', async () => {
    const lines: string[] = [];
    for await (const line of readFileLines(TEST_FILE)) {
      lines.push(line);
    }
    expect(lines.length).toBe(1000);
    expect(lines[0]).toBe('Line 1');
    expect(lines[999]).toBe('Line 1000');
  });

  it('processes file with callback', async () => {
    let count = 0;
    await processFileStream(TEST_FILE, () => { count++; });
    expect(count).toBe(1000);
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });
});
