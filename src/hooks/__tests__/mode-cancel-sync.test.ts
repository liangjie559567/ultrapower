import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { clearModeWithLinked, linkModes } from '../mode-cancel-sync.js';
import { writeRalphState } from '../ralph/loop.js';
import { writeAutopilotState } from '../autopilot/state.js';
import type { RalphLoopState } from '../ralph/loop.js';
import type { AutopilotState } from '../autopilot/types.js';

describe('mode-cancel-sync', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'mode-cancel-sync-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should link two modes bidirectionally', async () => {
    const ralphState: RalphLoopState = {
      active: true,
      iteration: 1,
      max_iterations: 10,
      started_at: new Date().toISOString(),
      prompt: 'test',
      project_path: testDir
    };

    const autopilotState: AutopilotState = {
      active: true,
      phase: 'execution',
      iteration: 1,
      max_iterations: 10,
      originalIdea: 'test',
      expansion: { analyst_complete: false, architect_complete: false, spec_path: null, requirements_summary: '', tech_stack: [] },
      planning: { plan_path: null, architect_iterations: 0, approved: false },
      execution: { ralph_iterations: 0, ultrawork_active: false, tasks_completed: 0, tasks_total: 0, files_created: [], files_modified: [] },
      qa: { ultraqa_cycles: 0, build_status: 'pending', lint_status: 'pending', test_status: 'pending' },
      validation: { architects_spawned: 0, verdicts: [], all_approved: false, validation_rounds: 0 },
      started_at: new Date().toISOString(),
      completed_at: null,
      phase_durations: {},
      total_agents_spawned: 0,
      wisdom_entries: 0,
      project_path: testDir
    };

    writeRalphState(testDir, ralphState);
    await writeAutopilotState(testDir, autopilotState);

    const result = linkModes('ralph', 'autopilot', testDir);
    expect(result).toBe(true);
  });

  it('should clear linked modes recursively', () => {
    const ralphState: RalphLoopState = {
      active: true,
      iteration: 1,
      max_iterations: 10,
      started_at: new Date().toISOString(),
      prompt: 'test',
      project_path: testDir,
      linkedModes: ['autopilot']
    };

    writeRalphState(testDir, ralphState);

    const cleared = clearModeWithLinked('ralph', testDir);
    expect(cleared).toContain('ralph');
  });
});
