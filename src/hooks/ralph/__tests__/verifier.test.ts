import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  readVerificationState,
  writeVerificationState,
  clearVerificationState,
  startVerification,
  recordArchitectFeedback,
  detectArchitectApproval,
  detectArchitectRejection
} from '../verifier.js';

const TEST_DIR = join(process.cwd(), '.test-ralph-verifier');

describe('Ralph Verifier', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  describe('State Management', () => {
    it('writes and reads verification state', () => {
      const state = {
        pending: true,
        completion_claim: 'Task complete',
        verification_attempts: 0,
        max_verification_attempts: 3,
        requested_at: new Date().toISOString(),
        original_task: 'Test task'
      };

      const written = writeVerificationState(TEST_DIR, state);
      expect(written).toBe(true);

      const read = readVerificationState(TEST_DIR);
      expect(read).toEqual(state);
    });

    it('returns null for non-existent state', () => {
      const state = readVerificationState(TEST_DIR);
      expect(state).toBeNull();
    });
  });

  describe('Verification Workflow', () => {
    it('starts verification', () => {
      const state = startVerification(TEST_DIR, 'Task done', 'Original task');

      expect(state.pending).toBe(true);
      expect(state.verification_attempts).toBe(0);
      expect(state.completion_claim).toBe('Task done');
    });

    it('records architect approval', () => {
      startVerification(TEST_DIR, 'Task done', 'Original task');
      const result = recordArchitectFeedback(TEST_DIR, true, 'Looks good');

      expect(result?.architect_approved).toBe(true);
      expect(result?.pending).toBe(false);
      expect(readVerificationState(TEST_DIR)).toBeNull();
    });

    it('records architect rejection', () => {
      startVerification(TEST_DIR, 'Task done', 'Original task');
      const result = recordArchitectFeedback(TEST_DIR, false, 'Missing tests');

      expect(result?.architect_approved).toBe(false);
      expect(result?.verification_attempts).toBe(1);
      expect(result?.architect_feedback).toBe('Missing tests');
    });
  });

  describe('Detection', () => {
    it('detects architect approval', () => {
      const text = '<architect-approved>VERIFIED_COMPLETE</architect-approved>';
      expect(detectArchitectApproval(text)).toBe(true);
    });

    it('detects architect rejection', () => {
      const text = 'Architect found issues with implementation';
      const result = detectArchitectRejection(text);
      expect(result.rejected).toBe(true);
    });

    it('returns false for non-rejection text', () => {
      const text = 'Everything looks good';
      const result = detectArchitectRejection(text);
      expect(result.rejected).toBe(false);
    });
  });
});
