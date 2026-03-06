/**
 * Tests for job-management.ts with WorkerStateAdapter
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handleCheckJobStatus, handleListJobs } from '../job-management.js';

describe('job-management with WorkerStateAdapter', () => {
  const originalEnv = process.env.WORKER_BACKEND;

  afterEach(() => {
    process.env.WORKER_BACKEND = originalEnv;
  });

  describe('handleCheckJobStatus', () => {
    it('should return error for missing job_id', async () => {
      const result = await handleCheckJobStatus('codex', '');
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('job_id is required');
    });

    it('should return not found for non-existent job', async () => {
      const result = await handleCheckJobStatus('codex', 'nonexistent123456');
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('No job found');
    });
  });

  describe('handleListJobs', () => {
    it('should list active jobs with default filter', async () => {
      const result = await handleListJobs('codex', 'active', 50);
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('job');
    });

    it('should list completed jobs', async () => {
      const result = await handleListJobs('codex', 'completed', 50);
      expect(result.content).toBeDefined();
    });

    it('should list failed jobs', async () => {
      const result = await handleListJobs('codex', 'failed', 50);
      expect(result.content).toBeDefined();
    });

    it('should list all jobs', async () => {
      const result = await handleListJobs('codex', 'all', 50);
      expect(result.content).toBeDefined();
    });
  });

  describe('environment variable control', () => {
    it('should use auto backend by default', async () => {
      delete process.env.WORKER_BACKEND;
      const result = await handleListJobs('codex', 'active', 10);
      expect(result.content).toBeDefined();
    });

    it('should respect WORKER_BACKEND=sqlite', async () => {
      process.env.WORKER_BACKEND = 'sqlite';
      const result = await handleListJobs('codex', 'active', 10);
      expect(result.content).toBeDefined();
    });

    it('should respect WORKER_BACKEND=json', async () => {
      process.env.WORKER_BACKEND = 'json';
      const result = await handleListJobs('codex', 'active', 10);
      expect(result.content).toBeDefined();
    });
  });
});
