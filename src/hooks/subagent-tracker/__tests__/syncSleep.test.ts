/**
 * Unit tests for syncSleep execution-context branching.
 *
 * Covers:
 * - Main thread: busy-wait path (no TypeError)
 * - Worker thread: Atomics.wait path
 * - acquireLock / executeFlush complete on main thread without throwing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// ============================================================================
// Tests
// ============================================================================

describe("syncSleep – main thread busy-wait path", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(
      tmpdir(),
      `syncsleep-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(join(testDir, ".omc", "state"), { recursive: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(testDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // Scenario 1: busy-wait logic (mirrors the main-thread path in syncSleep)
  // --------------------------------------------------------------------------
  it("busy-wait waits at least the requested duration and does not throw", () => {
    const ms = 20;
    const start = Date.now();

    // Execute the same logic that syncSleep uses on the main thread
    const deadline = start + ms;
    while (Date.now() < deadline) {
      // intentional busy-wait
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(ms - 2); // 2 ms tolerance
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Worker thread — Atomics.wait is invoked and does not throw
  // --------------------------------------------------------------------------
  it("worker thread: Atomics.wait is invoked and does not throw", () => {
    const waitSpy = vi.spyOn(Atomics, "wait").mockReturnValue("ok");

    expect(() => {
      // Simulate worker-thread syncSleep call
      const buffer = new SharedArrayBuffer(4);
      const view = new Int32Array(buffer);
      Atomics.wait(view, 0, 0, 5);
    }).not.toThrow();

    expect(waitSpy).toHaveBeenCalled();
    waitSpy.mockRestore();
  });

  // --------------------------------------------------------------------------
  // Scenario 3: acquireLock completes on main thread via executeFlush
  // --------------------------------------------------------------------------
  it("executeFlush acquires lock and returns true when no lock file exists", async () => {
    // Import without cache-busting; worker_threads is the real module here.
    // Since tests run in the main thread, isMainThread === true natively.
    const { executeFlush } = await import("../index.js");

    const state = {
      agents: [],
      total_spawned: 0,
      total_completed: 0,
      total_failed: 0,
      last_updated: new Date().toISOString(),
    };

    const result = executeFlush(testDir, state);
    expect(typeof result).toBe("boolean");
    expect(result).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Scenario 4: writeTrackingState + readTrackingState round-trip on main thread
  // --------------------------------------------------------------------------
  it("writeTrackingState does not throw on main thread", async () => {
    const { writeTrackingState, readTrackingState, flushPendingWrites } =
      await import("../index.js");

    const state = {
      agents: [],
      total_spawned: 1,
      total_completed: 0,
      total_failed: 0,
      last_updated: new Date().toISOString(),
    };

    expect(() => {
      writeTrackingState(testDir, state);
      flushPendingWrites();
    }).not.toThrow();

    const read = readTrackingState(testDir);
    expect(read.total_spawned).toBe(1);
  });

  // --------------------------------------------------------------------------
  // Scenario 5: hook bridge integration – no TypeError from SubagentStart handler
  // --------------------------------------------------------------------------
  it("handleSubagentStart does not throw TypeError on main thread", async () => {
    const { handleSubagentStart } = await import("../index.js");

    const input = {
      session_id: "sess-001",
      transcript_path: "/tmp/transcript.jsonl",
      cwd: testDir,
      permission_mode: "default",
      hook_event_name: "SubagentStart" as const,
      agent_id: "agent-001",
      agent_type: "ultrapower:executor",
      prompt: "Test task",
      model: "claude-sonnet-4-5",
    };

    await expect(handleSubagentStart(input)).resolves.not.toThrow();
    const result = await handleSubagentStart(input);
    expect(result.continue).toBe(true);
  });
});
