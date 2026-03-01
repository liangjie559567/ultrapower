/**
 * Tests for OMC_GEMINI_YOLO environment variable controlling --yolo flag
 * in Gemini CLI invocations.
 *
 * Strategy: GEMINI_YOLO is a module-level constant evaluated at import time.
 * Use vi.resetModules() + dynamic import() to reload the module with different
 * environment variable states for each test case.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock child_process before any dynamic imports
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

// Mock all gemini-core dependencies to isolate --yolo behavior
vi.mock('../shared-exec.js', () => ({
  createStdoutCollector: vi.fn(() => ({
    append: vi.fn(),
    toString: () => 'mock gemini response',
  })),
  safeWriteOutputFile: vi.fn(() => ({ success: true })),
}));

vi.mock('../cli-detection.js', () => ({
  detectGeminiCli: vi.fn(() => ({ available: true })),
}));

vi.mock('../../lib/worktree-paths.js', () => ({
  getWorktreeRoot: vi.fn(() => null),
}));

vi.mock('../mcp-config.js', () => ({
  isExternalPromptAllowed: vi.fn(() => false),
}));

vi.mock('../prompt-injection.js', () => ({
  resolveSystemPrompt: vi.fn(() => undefined),
  buildPromptWithSystemContext: vi.fn((p: string) => p),
  wrapUntrustedFileContent: vi.fn((p: string, c: string) => c),
  wrapUntrustedCliResponse: vi.fn((r: string) => r),
  isValidAgentRoleName: vi.fn(() => true),
  VALID_AGENT_ROLES: ['executor'],
  singleErrorBlock: vi.fn((msg: string) => ({ content: [{ type: 'text', text: msg }], isError: true })),
  inlineSuccessBlocks: vi.fn(),
}));

vi.mock('../prompt-persistence.js', () => ({
  persistPrompt: vi.fn(() => null),
  persistResponse: vi.fn(),
  getExpectedResponsePath: vi.fn(() => '/tmp/response.md'),
  getPromptsDir: vi.fn(() => '/tmp/prompts'),
  generatePromptId: vi.fn(() => 'test-id'),
  slugify: vi.fn(() => 'test-slug'),
  writeJobStatus: vi.fn(),
  getStatusFilePath: vi.fn(() => '/tmp/status.json'),
  readJobStatus: vi.fn(() => null),
}));

vi.mock('../../features/model-routing/external-model-policy.js', () => ({
  resolveExternalModel: vi.fn(() => ({ model: 'gemini-3-pro-preview' })),
  buildFallbackChain: vi.fn(() => ['gemini-3-pro-preview']),
  GEMINI_MODEL_FALLBACKS: ['gemini-3-pro-preview'],
}));

vi.mock('../../config/loader.js', () => ({
  loadConfig: vi.fn(() => ({ externalModels: {} })),
}));

// Helper: build a mock spawn child that resolves with 'ok'
function setupSpawnMock(spawnFn: ReturnType<typeof vi.fn>): void {
  const stdinWrite = vi.fn();
  const stdinEnd = vi.fn();
  const stdinOn = vi.fn();
  const stdoutOn = vi.fn((event: string, cb: (data: Buffer) => void) => {
    if (event === 'data') {
      cb(Buffer.from('mock gemini response'));
    }
  });
  const stderrOn = vi.fn();
  const childOn = vi.fn((event: string, cb: (...args: unknown[]) => void) => {
    if (event === 'close') {
      setTimeout(() => cb(0), 10);
    }
  });

  const mockChild = {
    stdin: { write: stdinWrite, end: stdinEnd, on: stdinOn },
    stdout: { on: stdoutOn },
    stderr: { on: stderrOn },
    on: childOn,
    kill: vi.fn(),
    pid: 99999,
  };

  spawnFn.mockReturnValue(mockChild);
}

describe('GEMINI_YOLO constant — OMC_GEMINI_YOLO environment variable', () => {
  const originalEnv = process.env.OMC_GEMINI_YOLO;

  afterEach(() => {
    // Restore original env state
    if (originalEnv === undefined) {
      delete process.env.OMC_GEMINI_YOLO;
    } else {
      process.env.OMC_GEMINI_YOLO = originalEnv;
    }
    vi.resetModules();
  });

  it('TC-01: OMC_GEMINI_YOLO 未设置时 GEMINI_YOLO 默认为 true', async () => {
    delete process.env.OMC_GEMINI_YOLO;
    vi.resetModules();

    const { GEMINI_YOLO } = await import('../gemini-core.js');
    expect(GEMINI_YOLO).toBe(true);
  });

  it('TC-02: OMC_GEMINI_YOLO="true" 时 GEMINI_YOLO 为 true', async () => {
    process.env.OMC_GEMINI_YOLO = 'true';
    vi.resetModules();

    const { GEMINI_YOLO } = await import('../gemini-core.js');
    expect(GEMINI_YOLO).toBe(true);
  });

  it('TC-03: OMC_GEMINI_YOLO="false" 时 GEMINI_YOLO 为 false', async () => {
    process.env.OMC_GEMINI_YOLO = 'false';
    vi.resetModules();

    const { GEMINI_YOLO } = await import('../gemini-core.js');
    expect(GEMINI_YOLO).toBe(false);
  });

  it('TC-04: OMC_GEMINI_YOLO="0" 时 GEMINI_YOLO 为 false', async () => {
    process.env.OMC_GEMINI_YOLO = '0';
    vi.resetModules();

    const { GEMINI_YOLO } = await import('../gemini-core.js');
    expect(GEMINI_YOLO).toBe(false);
  });

  it('TC-05: OMC_GEMINI_YOLO 拼写错误值("flase") 时 GEMINI_YOLO 为 true（防 CI 挂起）', async () => {
    process.env.OMC_GEMINI_YOLO = 'flase';
    vi.resetModules();

    const { GEMINI_YOLO } = await import('../gemini-core.js');
    expect(GEMINI_YOLO).toBe(true);
  });
});

describe('executeGemini — --yolo flag in spawn args', () => {
  afterEach(() => {
    delete process.env.OMC_GEMINI_YOLO;
    vi.resetModules();
  });

  it('TC-01b: OMC_GEMINI_YOLO 未设置时 executeGemini 传入 --yolo', async () => {
    delete process.env.OMC_GEMINI_YOLO;
    vi.resetModules();

    const cp = await import('child_process');
    const spawnFn = cp.spawn as ReturnType<typeof vi.fn>;
    spawnFn.mockReset();
    setupSpawnMock(spawnFn);

    const { executeGemini } = await import('../gemini-core.js');
    await executeGemini('test prompt');

    const [, spawnArgs] = spawnFn.mock.calls[0];
    expect(spawnArgs).toContain('--yolo');
  });

  it('TC-02b: OMC_GEMINI_YOLO="true" 时 executeGemini 传入 --yolo', async () => {
    process.env.OMC_GEMINI_YOLO = 'true';
    vi.resetModules();

    const cp = await import('child_process');
    const spawnFn = cp.spawn as ReturnType<typeof vi.fn>;
    spawnFn.mockReset();
    setupSpawnMock(spawnFn);

    const { executeGemini } = await import('../gemini-core.js');
    await executeGemini('test prompt');

    const [, spawnArgs] = spawnFn.mock.calls[0];
    expect(spawnArgs).toContain('--yolo');
  });

  it('TC-03b: OMC_GEMINI_YOLO="false" 时 executeGemini 不传 --yolo', async () => {
    process.env.OMC_GEMINI_YOLO = 'false';
    vi.resetModules();

    const cp = await import('child_process');
    const spawnFn = cp.spawn as ReturnType<typeof vi.fn>;
    spawnFn.mockReset();
    setupSpawnMock(spawnFn);

    const { executeGemini } = await import('../gemini-core.js');
    await executeGemini('test prompt');

    const [, spawnArgs] = spawnFn.mock.calls[0];
    expect(spawnArgs).not.toContain('--yolo');
  });

  it('TC-04b: OMC_GEMINI_YOLO="0" 时 executeGemini 不传 --yolo', async () => {
    process.env.OMC_GEMINI_YOLO = '0';
    vi.resetModules();

    const cp = await import('child_process');
    const spawnFn = cp.spawn as ReturnType<typeof vi.fn>;
    spawnFn.mockReset();
    setupSpawnMock(spawnFn);

    const { executeGemini } = await import('../gemini-core.js');
    await executeGemini('test prompt');

    const [, spawnArgs] = spawnFn.mock.calls[0];
    expect(spawnArgs).not.toContain('--yolo');
  });

  it('TC-06: OMC_GEMINI_YOLO="false" 时其他 args（-p=.、--model）不受影响', async () => {
    process.env.OMC_GEMINI_YOLO = 'false';
    vi.resetModules();

    const cp = await import('child_process');
    const spawnFn = cp.spawn as ReturnType<typeof vi.fn>;
    spawnFn.mockReset();
    setupSpawnMock(spawnFn);

    const { executeGemini } = await import('../gemini-core.js');
    await executeGemini('test prompt', 'gemini-2.0-flash');

    const [, spawnArgs] = spawnFn.mock.calls[0];
    expect(spawnArgs).not.toContain('--yolo');
    expect(spawnArgs).toContain('-p=.');
    expect(spawnArgs).toContain('--model');
    expect(spawnArgs).toContain('gemini-2.0-flash');
  });
});

describe('executeGeminiBackground — --yolo flag in trySpawnWithModel args', () => {
  afterEach(() => {
    delete process.env.OMC_GEMINI_YOLO;
    vi.resetModules();
  });

  it('TC-05b: OMC_GEMINI_YOLO="false" 时后台路径不传 --yolo，包含 --model 和 -p=.', async () => {
    process.env.OMC_GEMINI_YOLO = 'false';
    vi.resetModules();

    const cp = await import('child_process');
    const spawnFn = cp.spawn as ReturnType<typeof vi.fn>;
    spawnFn.mockReset();

    // Background spawn does not need to resolve — just capture args
    const stdinWrite = vi.fn();
    const stdinEnd = vi.fn();
    const stdinOn = vi.fn();
    const stdoutOn = vi.fn();
    const stderrOn = vi.fn();
    const childOn = vi.fn();

    const mockChild = {
      stdin: { write: stdinWrite, end: stdinEnd, on: stdinOn },
      stdout: { on: stdoutOn },
      stderr: { on: stderrOn },
      on: childOn,
      kill: vi.fn(),
      pid: 88888,
      unref: vi.fn(),
    };
    spawnFn.mockReturnValue(mockChild);

    const { executeGeminiBackground } = await import('../gemini-core.js');
    executeGeminiBackground('test prompt', 'gemini-3-pro-preview', {
      provider: 'gemini',
      jobId: 'test-job-id',
      slug: 'test-slug',
      agentRole: 'executor',
      model: 'gemini-3-pro-preview',
      promptFile: '/tmp/prompt.md',
      responseFile: '/tmp/response.md',
    });

    expect(spawnFn).toHaveBeenCalledTimes(1);
    const [, spawnArgs] = spawnFn.mock.calls[0];
    expect(spawnArgs).not.toContain('--yolo');
    expect(spawnArgs).toContain('-p=.');
    expect(spawnArgs).toContain('--model');
    expect(spawnArgs).toContain('gemini-3-pro-preview');
  });

  it('TC-01c: OMC_GEMINI_YOLO 未设置时后台路径传入 --yolo', async () => {
    delete process.env.OMC_GEMINI_YOLO;
    vi.resetModules();

    const cp = await import('child_process');
    const spawnFn = cp.spawn as ReturnType<typeof vi.fn>;
    spawnFn.mockReset();

    const mockChild = {
      stdin: { write: vi.fn(), end: vi.fn(), on: vi.fn() },
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn(),
      pid: 77777,
      unref: vi.fn(),
    };
    spawnFn.mockReturnValue(mockChild);

    const { executeGeminiBackground } = await import('../gemini-core.js');
    executeGeminiBackground('test prompt', 'gemini-3-pro-preview', {
      provider: 'gemini',
      jobId: 'test-job-id-2',
      slug: 'test-slug-2',
      agentRole: 'executor',
      model: 'gemini-3-pro-preview',
      promptFile: '/tmp/prompt.md',
      responseFile: '/tmp/response.md',
    });

    expect(spawnFn).toHaveBeenCalledTimes(1);
    const [, spawnArgs] = spawnFn.mock.calls[0];
    expect(spawnArgs).toContain('--yolo');
  });
});
