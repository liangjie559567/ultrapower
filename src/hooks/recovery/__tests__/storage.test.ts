import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import type { StoredPart } from '../types.js';

// Mock constants to use test directory
vi.mock('../constants.js', () => {
  const { join } = require('path');
  const { tmpdir } = require('os');
  const testDir = join(tmpdir(), 'storage-test-fixed');
  const messageStorage = join(testDir, 'claude-code', 'storage', 'message');
  const partStorage = join(testDir, 'claude-code', 'storage', 'part');

  return {
    MESSAGE_STORAGE: messageStorage,
    PART_STORAGE: partStorage,
    PLACEHOLDER_TEXT: '[user interrupted]',
    THINKING_TYPES: new Set(['thinking', 'redacted_thinking', 'reasoning']),
    META_TYPES: new Set(['step-start', 'step-finish']),
    CONTENT_TYPES: new Set(['text', 'tool', 'tool_use', 'tool_result']),
  };
});


describe('Storage', () => {
  let sessionID: string;
  let storage: typeof import('../storage.js');

  beforeEach(async () => {
    sessionID = 'test-session-123';
    const { MESSAGE_STORAGE } = await import('../constants.js');
    mkdirSync(MESSAGE_STORAGE, { recursive: true });
    mkdirSync(join(MESSAGE_STORAGE, sessionID), { recursive: true });
    storage = await import('../storage.js');
  });

  afterEach(async () => {
    const { MESSAGE_STORAGE } = await import('../constants.js');
    const testRoot = join(MESSAGE_STORAGE, '..', '..', '..');
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
  });

  describe('generatePartId', () => {
    it('generates unique part IDs', () => {
      const id1 = storage.generatePartId();
      const id2 = storage.generatePartId();

      expect(id1).toMatch(/^prt_[0-9a-f]+[0-9a-z]+$/);
      expect(id2).toMatch(/^prt_[0-9a-f]+[0-9a-z]+$/);
      expect(id1).not.toBe(id2);
    });

    it('includes timestamp and random components', () => {
      const id = storage.generatePartId();
      expect(id.startsWith('prt_')).toBe(true);
      expect(id.length).toBeGreaterThan(10);
    });
  });

  describe('hasContent', () => {
    it('returns true for text parts', () => {
      const part: StoredPart = { type: 'text', text: 'hello' };
      expect(storage.hasContent(part)).toBe(true);
    });

    it('returns true for tool_use parts', () => {
      const part: StoredPart = { type: 'tool_use', id: '1', name: 'test', input: {} };
      expect(storage.hasContent(part)).toBe(true);
    });

    it('returns true for tool_result parts', () => {
      const part: StoredPart = { type: 'tool_result', tool_use_id: '1', content: 'result' };
      expect(storage.hasContent(part)).toBe(true);
    });

    it('returns false for thinking parts', () => {
      const part: StoredPart = { type: 'thinking', thinking: 'thoughts' };
      expect(storage.hasContent(part)).toBe(false);
    });

    it('returns false for meta parts', () => {
      const part: StoredPart = { type: 'meta', meta: {} };
      expect(storage.hasContent(part)).toBe(false);
    });
  });

  describe('getMessageDir', () => {
    it('returns message directory path', () => {
      const dir = storage.getMessageDir(sessionID);
      expect(dir).toContain(sessionID);
    });
  });

  describe('readMessages', () => {
    it('returns empty array when no messages exist', () => {
      const messages = storage.readMessages(sessionID);
      expect(messages).toEqual([]);
    });

    it('reads and sorts messages by timestamp', async () => {
      const { MESSAGE_STORAGE } = await import('../constants.js');
      const msgDir = join(MESSAGE_STORAGE, sessionID);
      mkdirSync(msgDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_002.json'), JSON.stringify({
        id: 'msg_002',
        role: 'user',
        timestamp: 2000,
      }));
      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
        timestamp: 1000,
      }));

      const messages = storage.readMessages(sessionID);
      expect(messages).toHaveLength(2);
      expect(messages[0].id).toBe('msg_001');
      expect(messages[1].id).toBe('msg_002');
    });
  });

  describe('readParts', () => {
    it('returns empty array when no parts exist', () => {
      const parts = storage.readParts('msg_001');
      expect(parts).toEqual([]);
    });

    it('reads and sorts parts by index', async () => {
      const { PART_STORAGE } = await import('../constants.js');
      const partsDir = join(PART_STORAGE, 'msg_001');
      mkdirSync(partsDir, { recursive: true });

      writeFileSync(join(partsDir, 'prt_002.json'), JSON.stringify({
        id: 'prt_002',
        type: 'text',
        text: 'second',
        index: 1,
      }));
      writeFileSync(join(partsDir, 'prt_001.json'), JSON.stringify({
        id: 'prt_001',
        type: 'text',
        text: 'first',
        index: 0,
      }));

      const parts = storage.readParts('msg_001');
      expect(parts).toHaveLength(2);
      expect(parts[0].id).toBe('prt_001');
      expect(parts[1].id).toBe('prt_002');
    });
  });

  describe('messageHasContent', () => {
    it('returns false when message has no parts', async () => {
      const { MESSAGE_STORAGE } = await import('../constants.js');
      const msgDir = join(MESSAGE_STORAGE, sessionID);
      mkdirSync(msgDir, { recursive: true });
      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
      }));

      expect(storage.messageHasContent('msg_001')).toBe(false);
    });

    it('returns true when message has content parts', async () => {
      const { MESSAGE_STORAGE, PART_STORAGE } = await import('../constants.js');
      const msgDir = join(MESSAGE_STORAGE, sessionID);
      const partsDir = join(PART_STORAGE, 'msg_001');
      mkdirSync(partsDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
      }));
      writeFileSync(join(partsDir, 'prt_001.json'), JSON.stringify({
        id: 'prt_001',
        type: 'text',
        text: 'hello',
      }));

      expect(storage.messageHasContent('msg_001')).toBe(true);
    });

    it('returns false when message has only thinking parts', async () => {
      const msgDir = storage.getMessageDir(sessionID);
      const { PART_STORAGE } = await import('../constants.js');
      const partsDir = join(PART_STORAGE, 'msg_001');
      mkdirSync(partsDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
      }));
      writeFileSync(join(partsDir, 'prt_001.json'), JSON.stringify({
        id: 'prt_001',
        type: 'thinking',
        thinking: 'thoughts',
      }));

      expect(storage.messageHasContent('msg_001')).toBe(false);
    });
  });

  describe('injectTextPart', () => {
    it('injects synthetic text part into message', async () => {
      const msgDir = storage.getMessageDir(sessionID);
      const { PART_STORAGE } = await import('../constants.js');
      const partsDir = join(PART_STORAGE, 'msg_001');
      mkdirSync(partsDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
      }));

      storage.injectTextPart(sessionID, 'msg_001', 'injected text');

      const parts = storage.readParts('msg_001');
      expect(parts).toHaveLength(1);
      expect(parts[0].type).toBe('text');
      expect(parts[0].text).toBe('injected text');
      expect(parts[0].synthetic).toBe(true);
    });
  });

  describe('findEmptyMessages', () => {
    it('returns empty array when no messages exist', () => {
      const empty = storage.findEmptyMessages(sessionID);
      expect(empty).toEqual([]);
    });

    it('finds messages with no content', async () => {
      const { MESSAGE_STORAGE, PART_STORAGE } = await import('../constants.js');
      const msgDir = join(MESSAGE_STORAGE, sessionID);
      const partsDir = join(PART_STORAGE, 'msg_001');
      mkdirSync(msgDir, { recursive: true });
      mkdirSync(partsDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
        time: { created: 1000 },
      }));

      vi.spyOn(storage, 'readMessages').mockReturnValue([{
        id: 'msg_001',
        role: 'assistant',
        time: { created: 1000 },
      }]);

      const empty = storage.findEmptyMessages(sessionID);
      expect(empty).toHaveLength(1);
      expect(empty[0]).toBe('msg_001');

      vi.restoreAllMocks();
    });

    it('excludes messages with content', async () => {
      const { MESSAGE_STORAGE, PART_STORAGE } = await import('../constants.js');
      const msgDir = join(MESSAGE_STORAGE, sessionID);
      mkdirSync(msgDir, { recursive: true });
      const partsDir = join(PART_STORAGE, 'msg_001');
      mkdirSync(partsDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
        timestamp: 1000,
      }));
      writeFileSync(join(partsDir, 'prt_001.json'), JSON.stringify({
        id: 'prt_001',
        type: 'text',
        text: 'hello',
      }));

      vi.spyOn(storage, 'getMessageDir').mockReturnValue(msgDir);
      const empty = storage.findEmptyMessages(sessionID);
      expect(empty).toEqual([]);
      vi.restoreAllMocks();
    });
  });

  describe('findEmptyMessageByIndex', () => {
    it('returns null when no empty messages exist', () => {
      const result = storage.findEmptyMessageByIndex(sessionID, 0);
      expect(result).toBeNull();
    });

    it('finds empty message by exact index', async () => {
      const { MESSAGE_STORAGE } = await import('../constants.js');
      const msgDir = join(MESSAGE_STORAGE, sessionID);
      mkdirSync(msgDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
        time: { created: 1000 },
      }));

      vi.spyOn(storage, 'readMessages').mockReturnValue([{
        id: 'msg_001',
        role: 'assistant',
        time: { created: 1000 },
      }]);
      const result = storage.findEmptyMessageByIndex(sessionID, 0);
      expect(result).not.toBeNull();
      expect(result).toBe('msg_001');
      vi.restoreAllMocks();
    });
  });

  describe('findMessagesWithThinkingBlocks', () => {
    it('returns empty array when no messages have thinking', () => {
      const result = storage.findMessagesWithThinkingBlocks(sessionID);
      expect(result).toEqual([]);
    });

    it('finds messages with thinking parts', async () => {
      const { MESSAGE_STORAGE, PART_STORAGE } = await import('../constants.js');
      const msgDir = join(MESSAGE_STORAGE, sessionID);
      mkdirSync(msgDir, { recursive: true });
      const partsDir = join(PART_STORAGE, 'msg_001');
      mkdirSync(partsDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
        time: { created: 1000 },
      }));
      writeFileSync(join(partsDir, 'prt_001.json'), JSON.stringify({
        id: 'prt_001',
        type: 'thinking',
        thinking: 'thoughts',
      }));

      vi.spyOn(storage, 'readMessages').mockReturnValue([{
        id: 'msg_001',
        role: 'assistant',
        time: { created: 1000 },
      }]);
      const result = storage.findMessagesWithThinkingBlocks(sessionID);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('msg_001');
      vi.restoreAllMocks();
    });
  });

  describe('findMessagesWithThinkingOnly', () => {
    it('finds messages with thinking but no content', async () => {
      const { MESSAGE_STORAGE, PART_STORAGE } = await import('../constants.js');
      const msgDir = join(MESSAGE_STORAGE, sessionID);
      mkdirSync(msgDir, { recursive: true });
      const partsDir = join(PART_STORAGE, 'msg_001');
      mkdirSync(partsDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
        time: { created: 1000 },
      }));
      writeFileSync(join(partsDir, 'prt_001.json'), JSON.stringify({
        id: 'prt_001',
        type: 'thinking',
        thinking: 'thoughts',
      }));

      vi.spyOn(storage, 'readMessages').mockReturnValue([{
        id: 'msg_001',
        role: 'assistant',
        time: { created: 1000 },
      }]);
      const result = storage.findMessagesWithThinkingOnly(sessionID);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('msg_001');
      vi.restoreAllMocks();
    });

    it('excludes messages with both thinking and content', async () => {
      const { MESSAGE_STORAGE, PART_STORAGE } = await import('../constants.js');
      const msgDir = join(MESSAGE_STORAGE, sessionID);
      const partsDir = join(PART_STORAGE, 'msg_001');
      mkdirSync(msgDir, { recursive: true });
      mkdirSync(partsDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
        timestamp: 1000,
      }));
      writeFileSync(join(partsDir, 'prt_001.json'), JSON.stringify({
        id: 'prt_001',
        type: 'thinking',
        thinking: 'thoughts',
      }));
      writeFileSync(join(partsDir, 'prt_002.json'), JSON.stringify({
        id: 'prt_002',
        type: 'text',
        text: 'hello',
      }));

      vi.spyOn(storage, 'readMessages').mockReturnValue([{
        id: 'msg_001',
        role: 'assistant',
        timestamp: 1000,
      }]);
      const result = storage.findMessagesWithThinkingOnly(sessionID);
      expect(result).toEqual([]);
      vi.restoreAllMocks();
    });
  });

  describe('findMessagesWithOrphanThinking', () => {
    it('finds messages where thinking is not first', async () => {
      const { MESSAGE_STORAGE, PART_STORAGE } = await import('../constants.js');
      const msgDir = join(MESSAGE_STORAGE, sessionID);
      mkdirSync(msgDir, { recursive: true });
      const partsDir = join(PART_STORAGE, 'msg_001');
      mkdirSync(partsDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
        time: { created: 1000 },
      }));
      writeFileSync(join(partsDir, 'prt_001.json'), JSON.stringify({
        id: 'prt_001',
        type: 'text',
        text: 'hello',
        index: 0,
      }));
      writeFileSync(join(partsDir, 'prt_002.json'), JSON.stringify({
        id: 'prt_002',
        type: 'thinking',
        thinking: 'thoughts',
        index: 1,
      }));

      vi.spyOn(storage, 'readMessages').mockReturnValue([{
        id: 'msg_001',
        role: 'assistant',
        time: { created: 1000 },
      }]);
      const result = storage.findMessagesWithOrphanThinking(sessionID);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('msg_001');
      vi.restoreAllMocks();
    });

    it('excludes messages where thinking is first', async () => {
      const { MESSAGE_STORAGE, PART_STORAGE } = await import('../constants.js');
      const msgDir = join(MESSAGE_STORAGE, sessionID);
      const partsDir = join(PART_STORAGE, 'msg_001');
      mkdirSync(msgDir, { recursive: true });
      mkdirSync(partsDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
        timestamp: 1000,
      }));
      writeFileSync(join(partsDir, 'prt_001.json'), JSON.stringify({
        id: 'prt_001',
        type: 'thinking',
        thinking: 'thoughts',
        index: 0,
      }));
      writeFileSync(join(partsDir, 'prt_002.json'), JSON.stringify({
        id: 'prt_002',
        type: 'text',
        text: 'hello',
        index: 1,
      }));

      const result = storage.findMessagesWithOrphanThinking(sessionID);
      expect(result).toEqual([]);
    });
  });

  describe('prependThinkingPart', () => {
    it('prepends synthetic thinking part to message', async () => {
      const { MESSAGE_STORAGE, PART_STORAGE } = await import('../constants.js');
      const msgDir = join(MESSAGE_STORAGE, sessionID);
      const partsDir = join(PART_STORAGE, 'msg_001');
      mkdirSync(msgDir, { recursive: true });
      mkdirSync(partsDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
      }));
      writeFileSync(join(partsDir, 'prt_001.json'), JSON.stringify({
        id: 'prt_001',
        type: 'text',
        text: 'hello',
        index: 0,
      }));

      storage.prependThinkingPart(sessionID, 'msg_001');

      const parts = storage.readParts('msg_001');
      expect(parts[0].type).toBe('thinking');
      expect(parts[0].synthetic).toBe(true);
    });
  });

  describe('stripThinkingParts', () => {
    it('removes all thinking parts from message', async () => {
      const { MESSAGE_STORAGE, PART_STORAGE } = await import('../constants.js');
      const msgDir = join(MESSAGE_STORAGE, sessionID);
      const partsDir = join(PART_STORAGE, 'msg_001');
      mkdirSync(msgDir, { recursive: true });
      mkdirSync(partsDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
      }));
      writeFileSync(join(partsDir, 'prt_001.json'), JSON.stringify({
        id: 'prt_001',
        type: 'thinking',
        thinking: 'thoughts',
      }));
      writeFileSync(join(partsDir, 'prt_002.json'), JSON.stringify({
        id: 'prt_002',
        type: 'text',
        text: 'hello',
      }));

      storage.stripThinkingParts('msg_001');

      const parts = storage.readParts('msg_001');
      expect(parts).toHaveLength(1);
      expect(parts[0].type).toBe('text');
    });
  });

  describe('replaceEmptyTextParts', () => {
    it('replaces empty text parts with placeholder', async () => {
      const { MESSAGE_STORAGE, PART_STORAGE } = await import('../constants.js');
      const msgDir = join(MESSAGE_STORAGE, sessionID);
      const partsDir = join(PART_STORAGE, 'msg_001');
      mkdirSync(msgDir, { recursive: true });
      mkdirSync(partsDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
      }));
      writeFileSync(join(partsDir, 'prt_001.json'), JSON.stringify({
        id: 'prt_001',
        type: 'text',
        text: '',
      }));

      storage.replaceEmptyTextParts('msg_001', '[placeholder]');

      const parts = storage.readParts('msg_001');
      expect(parts[0].text).toBe('[placeholder]');
    });
  });

  describe('findMessagesWithEmptyTextParts', () => {
    it('finds messages with empty text parts', async () => {
      const { MESSAGE_STORAGE, PART_STORAGE } = await import('../constants.js');
      const msgDir = join(MESSAGE_STORAGE, sessionID);
      mkdirSync(msgDir, { recursive: true });
      const partsDir = join(PART_STORAGE, 'msg_001');
      mkdirSync(partsDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
        time: { created: 1000 },
      }));
      writeFileSync(join(partsDir, 'prt_001.json'), JSON.stringify({
        id: 'prt_001',
        type: 'text',
        text: '',
      }));

      vi.spyOn(storage, 'readMessages').mockReturnValue([{
        id: 'msg_001',
        role: 'assistant',
        time: { created: 1000 },
      }]);
      const result = storage.findMessagesWithEmptyTextParts(sessionID);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('msg_001');

      vi.restoreAllMocks();
    });
  });

  describe('findMessageByIndexNeedingThinking', () => {
    it('returns null when no messages need thinking', () => {
      const result = storage.findMessageByIndexNeedingThinking(sessionID, 0);
      expect(result).toBeNull();
    });

    it('finds message needing thinking by index', async () => {
      const { MESSAGE_STORAGE, PART_STORAGE } = await import('../constants.js');
      const msgDir = join(MESSAGE_STORAGE, sessionID);
      const partsDir = join(PART_STORAGE, 'msg_001');
      mkdirSync(msgDir, { recursive: true });
      mkdirSync(partsDir, { recursive: true });

      writeFileSync(join(msgDir, 'msg_001.json'), JSON.stringify({
        id: 'msg_001',
        role: 'assistant',
        time: { created: 1000 },
      }));
      writeFileSync(join(partsDir, 'prt_001.json'), JSON.stringify({
        id: 'prt_001',
        type: 'text',
        text: 'hello',
      }));

      vi.spyOn(storage, 'readMessages').mockReturnValue([{
        id: 'msg_001',
        role: 'assistant',
        time: { created: 1000 },
      }]);
      const result = storage.findMessageByIndexNeedingThinking(sessionID, 0);
      expect(result).not.toBeNull();
      expect(result).toBe('msg_001');

      vi.restoreAllMocks();
    });
  });
});
