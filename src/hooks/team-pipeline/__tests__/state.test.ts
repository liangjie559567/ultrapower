import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  initTeamPipelineState,
  readTeamPipelineState,
  writeTeamPipelineState,
  clearTeamPipelineState,
  markTeamPhase
} from '../state.js';

const TEST_DIR = join(process.cwd(), '.test-team-pipeline-state');
const SESSION_ID = 'test-session-123';

describe('Team Pipeline State', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  describe('initTeamPipelineState', () => {
    it('creates initial state with defaults', () => {
      const state = initTeamPipelineState(TEST_DIR, SESSION_ID);

      expect(state.mode).toBe('team');
      expect(state.active).toBe(true);
      expect(state.session_id).toBe(SESSION_ID);
      expect(state.phase).toBe('team-plan');
      expect(state.iteration).toBe(1);
      expect(state.max_iterations).toBe(25);
    });

    it('accepts custom options', () => {
      const state = initTeamPipelineState(TEST_DIR, SESSION_ID, {
        project_path: '/custom/path',
        max_iterations: 10
      });

      expect(state.project_path).toBe('/custom/path');
      expect(state.max_iterations).toBe(10);
    });
  });

  describe('writeTeamPipelineState', () => {
    it('writes state successfully', () => {
      const state = initTeamPipelineState(TEST_DIR, SESSION_ID);
      const result = writeTeamPipelineState(TEST_DIR, state, SESSION_ID);

      expect(result).toBe(true);
    });

    it('returns false without session id', () => {
      const state = initTeamPipelineState(TEST_DIR, SESSION_ID);
      const result = writeTeamPipelineState(TEST_DIR, state);

      expect(result).toBe(false);
    });
  });

  describe('readTeamPipelineState', () => {
    it('reads written state', () => {
      const state = initTeamPipelineState(TEST_DIR, SESSION_ID);
      writeTeamPipelineState(TEST_DIR, state, SESSION_ID);

      const read = readTeamPipelineState(TEST_DIR, SESSION_ID);
      expect(read).not.toBeNull();
      expect(read?.session_id).toBe(SESSION_ID);
      expect(read?.phase).toBe('team-plan');
    });

    it('returns null without session id', () => {
      const result = readTeamPipelineState(TEST_DIR);
      expect(result).toBeNull();
    });

    it('returns null for non-existent state', () => {
      const result = readTeamPipelineState(TEST_DIR, SESSION_ID);
      expect(result).toBeNull();
    });
  });

  describe('clearTeamPipelineState', () => {
    it('clears existing state', () => {
      const state = initTeamPipelineState(TEST_DIR, SESSION_ID);
      writeTeamPipelineState(TEST_DIR, state, SESSION_ID);

      const result = clearTeamPipelineState(TEST_DIR, SESSION_ID);
      expect(result).toBe(true);
      expect(readTeamPipelineState(TEST_DIR, SESSION_ID)).toBeNull();
    });

    it('returns false without session id', () => {
      const result = clearTeamPipelineState(TEST_DIR);
      expect(result).toBe(false);
    });
  });

  describe('markTeamPhase', () => {
    it('transitions to new phase', () => {
      const state = initTeamPipelineState(TEST_DIR, SESSION_ID);
      const result = markTeamPhase(state, 'team-prd');

      expect(result.state.phase).toBe('team-prd');
      expect(result.state.phase_history).toHaveLength(2);
    });

    it('marks as inactive on terminal phases', () => {
      const state = initTeamPipelineState(TEST_DIR, SESSION_ID);
      const result = markTeamPhase(state, 'complete');

      expect(result.state.active).toBe(false);
      expect(result.state.completed_at).not.toBeNull();
    });
  });
});
