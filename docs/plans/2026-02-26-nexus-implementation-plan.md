# nexus 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 ultrapower 添加 nexus 双层自我提升系统——插件层（TypeScript hooks）+ VPS 守护进程（Python）

**Architecture:** 插件层通过 Git 同步将会话数据推送到 nexus-daemon 仓库；VPS 守护进程每分钟拉取新事件，运行进化引擎和意识循环，生成改进建议推回仓库；插件层拉取改进并按置信度自动或通过 Telegram 确认应用。

**Tech Stack:** TypeScript (plugin hooks), Python 3.11 (VPS daemon), Git sync (communication), Telegram Bot API (notifications), systemd (process management)

**Design Doc:** `docs/plans/2026-02-26-nexus-design.md`

---

## P0：核心基础设施

### Task 1: nexus 配置类型和存储结构

**Files:**
- Create: `src/hooks/nexus/types.ts`
- Create: `src/hooks/nexus/config.ts`
- Create: `src/hooks/nexus/__tests__/config.test.ts`

**Step 1: 写失败测试**

```typescript
// src/hooks/nexus/__tests__/config.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadNexusConfig, DEFAULT_NEXUS_CONFIG } from '../config.js';

describe('loadNexusConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `nexus-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns default config when file does not exist', () => {
    const config = loadNexusConfig(tmpDir);
    expect(config.enabled).toBe(false);
    expect(config.autoApplyThreshold).toBe(80);
    expect(config.consciousnessInterval).toBe(300);
  });

  it('loads and merges config from .omc/nexus/config.json', () => {
    const configDir = join(tmpDir, '.omc', 'nexus');
    mkdirSync(configDir, { recursive: true });
    writeFileSync(
      join(configDir, 'config.json'),
      JSON.stringify({ enabled: true, gitRemote: 'git@github.com:user/nexus-daemon.git' })
    );
    const config = loadNexusConfig(tmpDir);
    expect(config.enabled).toBe(true);
    expect(config.gitRemote).toBe('git@github.com:user/nexus-daemon.git');
    expect(config.autoApplyThreshold).toBe(80); // default preserved
  });

  it('returns default config on malformed JSON', () => {
    const configDir = join(tmpDir, '.omc', 'nexus');
    mkdirSync(configDir, { recursive: true });
    writeFileSync(join(configDir, 'config.json'), 'not json');
    const config = loadNexusConfig(tmpDir);
    expect(config.enabled).toBe(false);
  });
});
```

**Step 2: 运行测试确认失败**

```bash
npm test -- src/hooks/nexus/__tests__/config.test.ts
```
Expected: FAIL — `Cannot find module '../config.js'`

**Step 3: 实现 types.ts**

```typescript
// src/hooks/nexus/types.ts
export interface NexusConfig {
  enabled: boolean;
  gitRemote: string;
  telegramToken?: string;
  telegramChatId?: string;
  autoApplyThreshold: number;      // 0-100, default 80
  consciousnessInterval: number;   // seconds, default 300
  consciousnessBudgetPercent: number; // 0-100, default 10
}

export interface SessionEvent {
  sessionId: string;
  timestamp: string;
  directory: string;
  durationMs?: number;
  toolCalls: ToolCallRecord[];
  agentsSpawned: number;
  agentsCompleted: number;
  modesUsed: string[];
  skillsInjected: string[];
  patternsSeen: PatternRecord[];
}

export interface ToolCallRecord {
  toolName: string;
  agentRole?: string;
  skillName?: string;
  timestamp: number;
}

export interface PatternRecord {
  problem: string;
  solution: string;
  confidence: number;
  occurrences: number;
}

export interface ImprovementSuggestion {
  id: string;
  createdAt: string;
  source: 'evolution_engine' | 'consciousness_loop' | 'self_evaluator';
  type: 'skill_update' | 'agent_update' | 'hook_update' | 'trigger_update';
  targetFile: string;
  confidence: number;
  diff: string;
  reason: string;
  evidence: Record<string, unknown>;
  status: 'pending' | 'applied' | 'rejected' | 'failed';
  testResult: string | null;
}
```

**Step 4: 实现 config.ts**

```typescript
// src/hooks/nexus/config.ts
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { NexusConfig } from './types.js';

export const DEFAULT_NEXUS_CONFIG: NexusConfig = {
  enabled: false,
  gitRemote: '',
  autoApplyThreshold: 80,
  consciousnessInterval: 300,
  consciousnessBudgetPercent: 10,
};

const CONFIG_RELATIVE_PATH = '.omc/nexus/config.json';

export function loadNexusConfig(directory: string): NexusConfig {
  const configPath = join(directory, CONFIG_RELATIVE_PATH);
  if (!existsSync(configPath)) {
    return { ...DEFAULT_NEXUS_CONFIG };
  }
  try {
    const raw = readFileSync(configPath, 'utf-8');
    const partial = JSON.parse(raw) as Partial<NexusConfig>;
    return { ...DEFAULT_NEXUS_CONFIG, ...partial };
  } catch {
    return { ...DEFAULT_NEXUS_CONFIG };
  }
}

export function isNexusEnabled(directory: string): boolean {
  return loadNexusConfig(directory).enabled;
}
```

**Step 5: 运行测试确认通过**

```bash
npm test -- src/hooks/nexus/__tests__/config.test.ts
```
Expected: PASS (3 tests)

**Step 6: Commit**

```bash
git add src/hooks/nexus/types.ts src/hooks/nexus/config.ts src/hooks/nexus/__tests__/config.test.ts
git commit -m "feat(nexus): add config types and loader"
```

---

### Task 2: data-collector hook（收集会话数据）

**Files:**
- Create: `src/hooks/nexus/data-collector.ts`
- Create: `src/hooks/nexus/__tests__/data-collector.test.ts`

**Step 1: 写失败测试**

```typescript
// src/hooks/nexus/__tests__/data-collector.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { collectSessionEvent, getEventsDir } from '../data-collector.js';
import type { SessionEvent } from '../types.js';

describe('collectSessionEvent', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `nexus-dc-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    // Enable nexus in config
    const configDir = join(tmpDir, '.omc', 'nexus');
    mkdirSync(configDir, { recursive: true });
    writeFileSync(join(configDir, 'config.json'), JSON.stringify({ enabled: true }));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes event JSON to .omc/nexus/events/', async () => {
    const event: SessionEvent = {
      sessionId: 'test-session-123',
      timestamp: '2026-02-26T14:00:00Z',
      directory: tmpDir,
      toolCalls: [],
      agentsSpawned: 2,
      agentsCompleted: 2,
      modesUsed: ['ultrawork'],
      skillsInjected: [],
      patternsSeen: [],
    };
    await collectSessionEvent(tmpDir, event);
    const eventsDir = getEventsDir(tmpDir);
    expect(existsSync(eventsDir)).toBe(true);
    const files = readdirSync(eventsDir);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/^test-session-123-\d+\.json$/);
    const content = JSON.parse(readFileSync(join(eventsDir, files[0]), 'utf-8'));
    expect(content.sessionId).toBe('test-session-123');
    expect(content.agentsSpawned).toBe(2);
  });

  it('does nothing when nexus is disabled', async () => {
    const disabledDir = join(tmpdir(), `nexus-disabled-${Date.now()}`);
    mkdirSync(disabledDir, { recursive: true });
    const event: SessionEvent = {
      sessionId: 'test-session-456',
      timestamp: '2026-02-26T14:00:00Z',
      directory: disabledDir,
      toolCalls: [],
      agentsSpawned: 0,
      agentsCompleted: 0,
      modesUsed: [],
      skillsInjected: [],
      patternsSeen: [],
    };
    await collectSessionEvent(disabledDir, event);
    const eventsDir = getEventsDir(disabledDir);
    expect(existsSync(eventsDir)).toBe(false);
    rmSync(disabledDir, { recursive: true, force: true });
  });
});
```

**Step 2: 运行测试确认失败**

```bash
npm test -- src/hooks/nexus/__tests__/data-collector.test.ts
```
Expected: FAIL — `Cannot find module '../data-collector.js'`

**Step 3: 实现 data-collector.ts**

```typescript
// src/hooks/nexus/data-collector.ts
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { isNexusEnabled } from './config.js';
import type { SessionEvent } from './types.js';

const EVENTS_SUBDIR = '.omc/nexus/events';

export function getEventsDir(directory: string): string {
  return join(directory, EVENTS_SUBDIR);
}

export async function collectSessionEvent(
  directory: string,
  event: SessionEvent
): Promise<void> {
  try {
    if (!isNexusEnabled(directory)) return;

    const eventsDir = getEventsDir(directory);
    mkdirSync(eventsDir, { recursive: true });

    const timestamp = Date.now();
    const filename = `${event.sessionId}-${timestamp}.json`;
    const filePath = join(eventsDir, filename);

    writeFileSync(filePath, JSON.stringify(event, null, 2), 'utf-8');
  } catch {
    // Silent failure — must never break main flow
  }
}
```

**Step 4: 运行测试确认通过**

```bash
npm test -- src/hooks/nexus/__tests__/data-collector.test.ts
```
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/hooks/nexus/data-collector.ts src/hooks/nexus/__tests__/data-collector.test.ts
git commit -m "feat(nexus): add data-collector for session events"
```

---

### Task 3: consciousness-sync hook（SessionEnd 后 git push）

**Files:**
- Create: `src/hooks/nexus/consciousness-sync.ts`
- Create: `src/hooks/nexus/__tests__/consciousness-sync.test.ts`

**Step 1: 写失败测试**

```typescript
// src/hooks/nexus/__tests__/consciousness-sync.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncToRemote, buildGitCommitMessage } from '../consciousness-sync.js';

describe('buildGitCommitMessage', () => {
  it('includes session ID in commit message', () => {
    const msg = buildGitCommitMessage('abc123', 3);
    expect(msg).toContain('abc123');
    expect(msg).toContain('3');
  });
});

describe('syncToRemote', () => {
  it('returns false when nexus is disabled', async () => {
    const result = await syncToRemote('/nonexistent/dir', 'sess-001');
    expect(result.success).toBe(false);
  });
});
```

**Step 2: 运行测试确认失败**

```bash
npm test -- src/hooks/nexus/__tests__/consciousness-sync.test.ts
```
Expected: FAIL — `Cannot find module '../consciousness-sync.js'`

**Step 3: 实现 consciousness-sync.ts**

```typescript
// src/hooks/nexus/consciousness-sync.ts
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { isNexusEnabled, loadNexusConfig } from './config.js';
import { getEventsDir } from './data-collector.js';

export interface SyncResult {
  success: boolean;
  error?: string;
  filesCommitted?: number;
}

export function buildGitCommitMessage(sessionId: string, fileCount: number): string {
  // Use only first 8 chars of sessionId (alphanumeric only) to avoid injection
  const safeId = sessionId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 8);
  return `nexus: sync ${fileCount} event(s) from session ${safeId}`;
}

function git(args: string[], cwd: string): { ok: boolean; stdout: string; stderr: string } {
  const result = spawnSync('git', args, { cwd, encoding: 'utf-8' });
  return {
    ok: result.status === 0,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

export async function syncToRemote(
  directory: string,
  sessionId: string
): Promise<SyncResult> {
  try {
    if (!isNexusEnabled(directory)) {
      return { success: false, error: 'nexus disabled' };
    }

    const config = loadNexusConfig(directory);
    if (!config.gitRemote) {
      return { success: false, error: 'gitRemote not configured' };
    }

    const eventsDir = getEventsDir(directory);
    if (!existsSync(eventsDir)) {
      return { success: true, filesCommitted: 0 };
    }

    // Stage only nexus events — args are array, no shell injection possible
    git(['add', join('.omc', 'nexus', 'events')], directory);

    // Check if there's anything to commit
    const statusResult = git(['status', '--porcelain'], directory);
    const nexusLines = statusResult.stdout.split('\n').filter(l => l.includes('.omc/nexus/events'));
    if (nexusLines.length === 0) {
      return { success: true, filesCommitted: 0 };
    }

    const msg = buildGitCommitMessage(sessionId, nexusLines.length);
    const commitResult = git(['commit', '-m', msg], directory);
    if (!commitResult.ok) {
      return { success: false, error: commitResult.stderr };
    }

    const pushResult = git(['push', 'origin', 'HEAD'], directory);
    if (!pushResult.ok) {
      return { success: false, error: pushResult.stderr };
    }

    return { success: true, filesCommitted: nexusLines.length };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}
```

**Step 4: 运行测试确认通过**

```bash
npm test -- src/hooks/nexus/__tests__/consciousness-sync.test.ts
```
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/hooks/nexus/consciousness-sync.ts src/hooks/nexus/__tests__/consciousness-sync.test.ts
git commit -m "feat(nexus): add consciousness-sync for git push on session end"
```

---

### Task 4: SessionEnd hook 集成（连接 data-collector + consciousness-sync）

**Files:**
- Create: `src/hooks/nexus/session-end-hook.ts`
- Modify: `src/hooks/index.ts`（注册新 hook）

**Step 1: 写失败测试**

```typescript
// src/hooks/nexus/__tests__/session-end-hook.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { handleNexusSessionEnd } from '../session-end-hook.js';

describe('handleNexusSessionEnd', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `nexus-se-test-${Date.now()}`);
    mkdirSync(join(tmpDir, '.omc', 'nexus'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.omc', 'nexus', 'config.json'),
      JSON.stringify({ enabled: true, gitRemote: '' }) // no remote = no push
    );
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('collects event and returns result', async () => {
    const result = await handleNexusSessionEnd({
      sessionId: 'test-sess-789',
      directory: tmpDir,
      durationMs: 60000,
      agentsSpawned: 1,
      agentsCompleted: 1,
      modesUsed: ['ultrawork'],
    });
    expect(result.collected).toBe(true);
    // sync skipped because gitRemote is empty
    expect(result.synced).toBe(false);
  });

  it('returns not collected when nexus disabled', async () => {
    writeFileSync(
      join(tmpDir, '.omc', 'nexus', 'config.json'),
      JSON.stringify({ enabled: false })
    );
    const result = await handleNexusSessionEnd({
      sessionId: 'test-sess-000',
      directory: tmpDir,
    });
    expect(result.collected).toBe(false);
  });
});
```

**Step 2: 运行测试确认失败**

```bash
npm test -- src/hooks/nexus/__tests__/session-end-hook.test.ts
```
Expected: FAIL — `Cannot find module '../session-end-hook.js'`

**Step 3: 实现 session-end-hook.ts**

```typescript
// src/hooks/nexus/session-end-hook.ts
import { isNexusEnabled } from './config.js';
import { collectSessionEvent } from './data-collector.js';
import { syncToRemote } from './consciousness-sync.js';
import type { SessionEvent } from './types.js';

export interface NexusSessionEndInput {
  sessionId: string;
  directory: string;
  durationMs?: number;
  agentsSpawned?: number;
  agentsCompleted?: number;
  modesUsed?: string[];
  skillsInjected?: string[];
}

export interface NexusSessionEndResult {
  collected: boolean;
  synced: boolean;
  error?: string;
}

export async function handleNexusSessionEnd(
  input: NexusSessionEndInput
): Promise<NexusSessionEndResult> {
  const work = async (): Promise<NexusSessionEndResult> => {
    try {
      if (!isNexusEnabled(input.directory)) {
        return { collected: false, synced: false };
      }

      const event: SessionEvent = {
        sessionId: input.sessionId,
        timestamp: new Date().toISOString(),
        directory: input.directory,
        durationMs: input.durationMs,
        toolCalls: [],
        agentsSpawned: input.agentsSpawned ?? 0,
        agentsCompleted: input.agentsCompleted ?? 0,
        modesUsed: input.modesUsed ?? [],
        skillsInjected: input.skillsInjected ?? [],
        patternsSeen: [],
      };

      await collectSessionEvent(input.directory, event);

      const syncResult = await syncToRemote(input.directory, input.sessionId);

      return {
        collected: true,
        synced: syncResult.success && (syncResult.filesCommitted ?? 0) > 0,
      };
    } catch (e) {
      return {
        collected: false,
        synced: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  };

  // 3-second timeout (same pattern as session-reflector.ts)
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<NexusSessionEndResult>(resolve => {
    timeoutHandle = setTimeout(
      () => resolve({ collected: false, synced: false, error: 'timeout' }),
      3000
    );
  });

  try {
    return await Promise.race([work(), timeout]);
  } finally {
    clearTimeout(timeoutHandle);
  }
}
```

**Step 4: 运行测试确认通过**

```bash
npm test -- src/hooks/nexus/__tests__/session-end-hook.test.ts
```
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/hooks/nexus/session-end-hook.ts src/hooks/nexus/__tests__/session-end-hook.test.ts
git commit -m "feat(nexus): add session-end hook integration"
```

---

### Task 5: 注册 nexus hook 到 processSessionEnd

**Files:**
- Modify: `src/hooks/session-end/index.ts`（在 reflectOnSessionEnd 之后添加 nexus 调用）

**Step 1: 写失败测试**

```typescript
// src/hooks/session-end/__tests__/nexus-integration.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('processSessionEnd nexus integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `nexus-se-int-${Date.now()}`);
    mkdirSync(join(tmpDir, '.omc', 'nexus'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.omc', 'nexus', 'config.json'),
      JSON.stringify({ enabled: true, gitRemote: '' })
    );
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('processSessionEnd completes without throwing when nexus enabled', async () => {
    const { processSessionEnd } = await import('../index.js');
    const result = await processSessionEnd({
      session_id: 'test-nexus-int-001',
      transcript_path: '',
      cwd: tmpDir,
      permission_mode: 'default',
      hook_event_name: 'SessionEnd',
      reason: 'other',
    });
    expect(result.continue).toBe(true);
  });
});
```

**Step 2: 运行测试确认失败**

```bash
npm test -- src/hooks/session-end/__tests__/nexus-integration.test.ts
```
Expected: FAIL — 因为 `../nexus/session-end-hook.js` 模块尚不存在，动态 import 会抛出 MODULE_NOT_FOUND 错误，导致测试失败。Step 3 添加该模块后测试才会通过。

**Step 3: 修改 processSessionEnd**

在 `src/hooks/session-end/index.ts` 的 `reflectOnSessionEnd` 调用块之后添加：

```typescript
  // Nexus consciousness sync: collect session data and push to nexus-daemon (best-effort)
  try {
    const { handleNexusSessionEnd } = await import('../nexus/session-end-hook.js');
    await handleNexusSessionEnd({
      sessionId: input.session_id,
      directory: resolveToWorktreeRoot(input.cwd),
      durationMs: metrics.duration_ms,
      agentsSpawned: metrics.agents_spawned,
      agentsCompleted: metrics.agents_completed,
      modesUsed: metrics.modes_used,
    });
  } catch {
    // Nexus failures must never block session end
  }
```

**Step 4: 运行测试确认通过**

```bash
npm test -- src/hooks/session-end/__tests__/nexus-integration.test.ts
npm test -- src/hooks/nexus/
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/session-end/index.ts src/hooks/session-end/__tests__/nexus-integration.test.ts
git commit -m "feat(nexus): register nexus hook in processSessionEnd"
```

---


### Task 6: nexus-daemon 基础框架（Python）

**Files:**
- Create: `nexus-daemon/daemon.py`
- Create: `nexus-daemon/requirements.txt`
- Create: `nexus-daemon/README.md`
- Create: `nexus-daemon/tests/test_daemon.py`

**Step 1: 写失败测试**

```python
# nexus-daemon/tests/test_daemon.py
import pytest
import json
import os
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add parent to path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from daemon import NexusDaemon, DaemonConfig, load_config

class TestLoadConfig:
    def test_returns_default_when_no_file(self, tmp_path):
        config = load_config(tmp_path / 'nonexistent.json')
        assert config.poll_interval == 60
        assert config.openrouter_api_key == ''

    def test_loads_from_file(self, tmp_path):
        config_file = tmp_path / 'config.json'
        config_file.write_text(json.dumps({
            'poll_interval': 30,
            'openrouter_api_key': 'sk-test-123'
        }))
        config = load_config(config_file)
        assert config.poll_interval == 30
        assert config.openrouter_api_key == 'sk-test-123'

class TestNexusDaemon:
    def test_init_creates_directories(self, tmp_path):
        daemon = NexusDaemon(repo_path=tmp_path)
        assert (tmp_path / 'events').exists()
        assert (tmp_path / 'improvements').exists()
        assert (tmp_path / 'consciousness').exists()
        assert (tmp_path / 'evolution').exists()

    def test_get_new_events_returns_empty_when_no_files(self, tmp_path):
        daemon = NexusDaemon(repo_path=tmp_path)
        events = daemon.get_new_events()
        assert events == []

    def test_get_new_events_returns_unprocessed_files(self, tmp_path):
        daemon = NexusDaemon(repo_path=tmp_path)
        event_file = tmp_path / 'events' / 'sess-001-1234567890.json'
        event_file.write_text(json.dumps({
            'sessionId': 'sess-001',
            'timestamp': '2026-02-26T14:00:00Z',
            'toolCalls': [],
            'agentsSpawned': 2,
        }))
        events = daemon.get_new_events()
        assert len(events) == 1
        assert events[0]['sessionId'] == 'sess-001'

    def test_mark_event_processed(self, tmp_path):
        daemon = NexusDaemon(repo_path=tmp_path)
        event_file = tmp_path / 'events' / 'sess-002-9999.json'
        event_file.write_text('{}')
        daemon.mark_event_processed('sess-002-9999.json')
        # Second call should not return this file
        events = daemon.get_new_events()
        assert all(e.get('_filename') != 'sess-002-9999.json' for e in events)
```

**Step 2: 运行测试确认失败**

```bash
cd nexus-daemon && pip install pytest && python -m pytest tests/test_daemon.py -v
```
Expected: FAIL — `ModuleNotFoundError: No module named 'daemon'`

**Step 3: 实现 daemon.py**

```python
# nexus-daemon/daemon.py
"""
nexus-daemon: VPS 守护进程
每分钟 git pull 拉取新事件，运行进化引擎，生成改进建议推回仓库。
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
)
logger = logging.getLogger('nexus-daemon')


@dataclass
class DaemonConfig:
    poll_interval: int = 60          # seconds between git pull cycles
    openrouter_api_key: str = ''
    openrouter_model: str = 'anthropic/claude-3-5-haiku'
    telegram_token: str = ''
    telegram_chat_id: str = ''
    consciousness_interval: int = 300  # seconds between consciousness loops
    consciousness_budget_percent: int = 10


def load_config(config_path: Path) -> DaemonConfig:
    """Load config from JSON file, return defaults on missing/error."""
    try:
        if not config_path.exists():
            return DaemonConfig()
        raw = json.loads(config_path.read_text())
        return DaemonConfig(
            poll_interval=raw.get('poll_interval', 60),
            openrouter_api_key=raw.get('openrouter_api_key', ''),
            openrouter_model=raw.get('openrouter_model', 'anthropic/claude-3-5-haiku'),
            telegram_token=raw.get('telegram_token', ''),
            telegram_chat_id=raw.get('telegram_chat_id', ''),
            consciousness_interval=raw.get('consciousness_interval', 300),
            consciousness_budget_percent=raw.get('consciousness_budget_percent', 10),
        )
    except Exception:
        return DaemonConfig()


class NexusDaemon:
    """Core daemon: git pull loop + event processing."""

    PROCESSED_LOG = '.processed_events.json'

    def __init__(self, repo_path: Path, config: DaemonConfig | None = None):
        self.repo_path = Path(repo_path)
        self.config = config or DaemonConfig()
        self._processed: set[str] = set()
        self._ensure_dirs()
        self._load_processed_log()

    def _ensure_dirs(self) -> None:
        for d in ['events', 'improvements', 'consciousness', 'evolution']:
            (self.repo_path / d).mkdir(parents=True, exist_ok=True)

    def _processed_log_path(self) -> Path:
        return self.repo_path / self.PROCESSED_LOG

    def _load_processed_log(self) -> None:
        try:
            path = self._processed_log_path()
            if path.exists():
                self._processed = set(json.loads(path.read_text()))
        except Exception:
            self._processed = set()

    def _save_processed_log(self) -> None:
        try:
            self._processed_log_path().write_text(
                json.dumps(sorted(self._processed), indent=2)
            )
        except Exception:
            pass

    def git_pull(self) -> bool:
        """Pull latest from remote. Returns True on success."""
        try:
            result = subprocess.run(
                ['git', 'fetch', 'origin'],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=30,
            )
            if result.returncode != 0:
                logger.warning('git fetch failed: %s', result.stderr.strip())
                return False
            result = subprocess.run(
                ['git', 'rebase', 'origin/main'],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=30,
            )
            if result.returncode == 0:
                logger.info('git pull: success')
                return True
            logger.warning('git pull failed: %s', result.stderr.strip())
            return False
        except Exception as e:
            logger.error('git pull error: %s', e)
            return False

    def git_push(self, message: str) -> bool:
        """Commit and push improvements. Returns True on success."""
        try:
            subprocess.run(['git', 'add', 'improvements/', 'evolution/'], cwd=self.repo_path,
                           capture_output=True, timeout=10)
            result = subprocess.run(
                ['git', 'commit', '-m', message],
                cwd=self.repo_path, capture_output=True, text=True, timeout=10,
            )
            if result.returncode != 0:
                return False  # nothing to commit
            subprocess.run(['git', 'push', 'origin', 'HEAD'],
                           cwd=self.repo_path, capture_output=True, timeout=30)
            return True
        except Exception as e:
            logger.error('git push error: %s', e)
            return False

    def get_new_events(self) -> list[dict[str, Any]]:
        """Return unprocessed event files from events/ directory."""
        events_dir = self.repo_path / 'events'
        result = []
        for f in sorted(events_dir.glob('*.json')):
            if f.name in self._processed:
                continue
            try:
                data = json.loads(f.read_text())
                data['_filename'] = f.name
                result.append(data)
            except Exception:
                pass
        return result

    def mark_event_processed(self, filename: str) -> None:
        self._processed.add(filename)
        self._save_processed_log()

    async def run_once(self) -> None:
        """Single poll cycle: pull → process events → push."""
        self.git_pull()
        events = self.get_new_events()
        if not events:
            return
        logger.info('Processing %d new event(s)', len(events))
        for event in events:
            try:
                await self._process_event(event)
                self.mark_event_processed(event['_filename'])
            except Exception as e:
                logger.error('Error processing event %s: %s', event.get('_filename'), e)

    async def _process_event(self, event: dict[str, Any]) -> None:
        """Placeholder: route to evolution engine."""
        logger.info('Event received: session=%s agents=%s',
                    event.get('sessionId', '?'),
                    event.get('agentsSpawned', 0))

    async def run(self) -> None:
        """Main loop: poll every config.poll_interval seconds."""
        logger.info('nexus-daemon started (poll_interval=%ds)', self.config.poll_interval)
        while True:
            try:
                await self.run_once()
            except Exception as e:
                logger.error('run_once error: %s', e)
            await asyncio.sleep(self.config.poll_interval)


def main() -> None:
    repo_path = Path(os.environ.get('NEXUS_REPO_PATH', '.'))
    config_path = repo_path / 'config.json'
    config = load_config(config_path)
    daemon = NexusDaemon(repo_path=repo_path, config=config)
    asyncio.run(daemon.run())


if __name__ == '__main__':
    main()
```

**Step 4: 创建 requirements.txt**

```
# nexus-daemon/requirements.txt
aiohttp>=3.9.0
pytest>=7.0.0
pytest-asyncio>=0.23.0
```

**Step 5: 运行测试确认通过**

```bash
cd nexus-daemon && python -m pytest tests/test_daemon.py -v
```
Expected: PASS (6 tests)

**Step 6: Commit**

```bash
git add nexus-daemon/
git commit -m "feat(nexus): add nexus-daemon Python base framework"
```

---

## P1：进化引擎与改进拉取

### Task 7: Evolution Engine MVP（模式检测 + knowledge_base 写入）

**Files:**
- Create: `nexus-daemon/evolution_engine.py`
- Create: `nexus-daemon/tests/test_evolution_engine.py`
- Modify: `nexus-daemon/daemon.py`

**Step 1: 写失败测试**

```python
# nexus-daemon/tests/test_evolution_engine.py
import pytest
import json
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from evolution_engine import EvolutionEngine, PatternRecord, detect_patterns

class TestDetectPatterns:
    def test_returns_empty_for_no_events(self):
        patterns = detect_patterns([])
        assert patterns == []

    def test_detects_repeated_modes(self):
        events = [
            {'modesUsed': ['ultrawork'], 'agentsSpawned': 3},
            {'modesUsed': ['ultrawork'], 'agentsSpawned': 2},
            {'modesUsed': ['ultrawork'], 'agentsSpawned': 4},
        ]
        patterns = detect_patterns(events)
        mode_patterns = [p for p in patterns if p.pattern_type == 'mode_usage']
        assert any(p.value == 'ultrawork' and p.occurrences >= 3 for p in mode_patterns)

    def test_pattern_below_threshold_not_promoted(self):
        events = [
            {'modesUsed': ['ralph'], 'agentsSpawned': 1},
            {'modesUsed': ['ralph'], 'agentsSpawned': 1},
        ]
        patterns = detect_patterns(events)
        promoted = [p for p in patterns if p.occurrences >= 3]
        assert len(promoted) == 0

class TestEvolutionEngine:
    def test_init_creates_knowledge_base(self, tmp_path):
        engine = EvolutionEngine(repo_path=tmp_path)
        assert (tmp_path / 'evolution' / 'knowledge_base.md').exists()

    def test_process_events_updates_knowledge_base(self, tmp_path):
        engine = EvolutionEngine(repo_path=tmp_path)
        events = [
            {'sessionId': f'sess-{i}', 'modesUsed': ['ultrawork'],
             'agentsSpawned': 3, 'agentsCompleted': 3, 'toolCalls': []}
            for i in range(3)
        ]
        engine.process_events(events)
        kb = (tmp_path / 'evolution' / 'knowledge_base.md').read_text()
        assert 'ultrawork' in kb

    def test_process_events_writes_pattern_library(self, tmp_path):
        engine = EvolutionEngine(repo_path=tmp_path)
        events = [
            {'sessionId': f's{i}', 'modesUsed': ['ralph'],
             'agentsSpawned': 2, 'agentsCompleted': 2, 'toolCalls': []}
            for i in range(3)
        ]
        engine.process_events(events)
        pl = (tmp_path / 'evolution' / 'pattern_library.md').read_text()
        assert 'ralph' in pl
```

**Step 2: 运行测试确认失败**

```bash
cd nexus-daemon && python -m pytest tests/test_evolution_engine.py -v
```
Expected: FAIL — `ModuleNotFoundError: No module named 'evolution_engine'`

**Step 3: 实现 evolution_engine.py**

```python
# nexus-daemon/evolution_engine.py
from __future__ import annotations
import logging
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger('nexus.evolution')
PATTERN_THRESHOLD = 3

@dataclass
class PatternRecord:
    pattern_type: str
    value: str
    occurrences: int
    confidence: int
    first_seen: str
    last_seen: str
    evidence: list[str] = field(default_factory=list)

def detect_patterns(events: list[dict[str, Any]]) -> list[PatternRecord]:
    if not events:
        return []
    now = datetime.now(timezone.utc).isoformat()
    patterns: list[PatternRecord] = []
    mode_counter: Counter[str] = Counter()
    for event in events:
        for mode in event.get('modesUsed', []):
            mode_counter[mode] += 1
    for mode, count in mode_counter.items():
        confidence = min(100, 50 + count * 10)
        patterns.append(PatternRecord(
            pattern_type='mode_usage', value=mode, occurrences=count,
            confidence=confidence, first_seen=now, last_seen=now,
            evidence=[f'Appeared in {count} sessions'],
        ))
    return patterns

class EvolutionEngine:
    KNOWLEDGE_BASE = 'evolution/knowledge_base.md'
    PATTERN_LIBRARY = 'evolution/pattern_library.md'

    def __init__(self, repo_path: Path):
        self.repo_path = Path(repo_path)
        self._ensure_files()

    def _ensure_files(self) -> None:
        evo_dir = self.repo_path / 'evolution'
        evo_dir.mkdir(parents=True, exist_ok=True)
        kb = self.repo_path / self.KNOWLEDGE_BASE
        if not kb.exists():
            kb.write_text('# Knowledge Base\n\n_Auto-generated by nexus_\n\n')
        pl = self.repo_path / self.PATTERN_LIBRARY
        if not pl.exists():
            pl.write_text('# Pattern Library\n\n_Patterns promoted after >= 3 occurrences_\n\n')

    def process_events(self, events: list[dict[str, Any]]) -> list[PatternRecord]:
        if not events:
            return []
        patterns = detect_patterns(events)
        promoted = [p for p in patterns if p.occurrences >= PATTERN_THRESHOLD]
        if promoted:
            self._update_knowledge_base(promoted, events)
            self._update_pattern_library(promoted)
            logger.info('Promoted %d pattern(s)', len(promoted))
        return promoted

    def _update_knowledge_base(self, patterns: list[PatternRecord], events: list[dict]) -> None:
        kb_path = self.repo_path / self.KNOWLEDGE_BASE
        now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
        lines = [f'\n## Update: {now}\n\nProcessed {len(events)} session(s):\n\n']
        for p in patterns:
            lines.append(f'- **{p.pattern_type}** `{p.value}`: {p.occurrences} occurrences, confidence={p.confidence}\n')
        with open(kb_path, 'a', encoding='utf-8') as f:
            f.writelines(lines)

    def _update_pattern_library(self, patterns: list[PatternRecord]) -> None:
        pl_path = self.repo_path / self.PATTERN_LIBRARY
        now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
        lines = [f'\n## {now}\n\n']
        for p in patterns:
            lines.append(
                f'### {p.pattern_type}: {p.value}\n'
                f'- Occurrences: {p.occurrences}\n'
                f'- Confidence: {p.confidence}\n\n'
            )
        with open(pl_path, 'a', encoding='utf-8') as f:
            f.writelines(lines)
```

**Step 4: 集成到 daemon.py**

在 `NexusDaemon.__init__` 末尾添加：

```python
from evolution_engine import EvolutionEngine
self._evolution = EvolutionEngine(repo_path=self.repo_path)
self._pending_events: list[dict] = []
```

将 `_process_event` 替换为：

```python
async def _process_event(self, event: dict[str, Any]) -> None:
    logger.info('Event: session=%s agents=%s', event.get('sessionId','?'), event.get('agentsSpawned',0))
    self._pending_events.append(event)
```

在 `run_once` 的事件循环结束后追加：

```python
if self._pending_events:
    promoted = self._evolution.process_events(self._pending_events)
    if promoted:
        self.git_push(f'nexus: evolution promoted {len(promoted)} pattern(s)')
    self._pending_events = []
```

**Step 5: 运行测试确认通过**

```bash
cd nexus-daemon && python -m pytest tests/ -v
```
Expected: PASS (10 tests)

**Step 6: Commit**

```bash
git add nexus-daemon/evolution_engine.py nexus-daemon/tests/test_evolution_engine.py nexus-daemon/daemon.py
git commit -m "feat(nexus): add Evolution Engine MVP with pattern detection"
```

---

---

### Task 8: improvement-puller hook（拉取并应用改进建议）

**Files:**
- Create: `src/hooks/nexus/improvement-puller.ts`
- Create: `src/hooks/nexus/__tests__/improvement-puller.test.ts`

**Step 1: 写失败测试**

```typescript
// src/hooks/nexus/__tests__/improvement-puller.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { getImprovementsDir, loadPendingImprovements } from '../improvement-puller.js';
import type { ImprovementSuggestion } from '../types.js';

describe('loadPendingImprovements', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `nexus-ip-test-${Date.now()}`);
    mkdirSync(join(tmpDir, '.omc', 'nexus', 'improvements'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty array when no improvement files', () => {
    const improvements = loadPendingImprovements(tmpDir);
    expect(improvements).toEqual([]);
  });

  it('loads pending improvement files', () => {
    const imp: ImprovementSuggestion = {
      id: 'imp-001',
      createdAt: '2026-02-26T14:00:00Z',
      source: 'evolution_engine',
      type: 'skill_update',
      targetFile: 'skills/learner/SKILL.md',
      confidence: 85,
      diff: '--- a/skills/learner/SKILL.md\n+++ b/skills/learner/SKILL.md\n@@ -1 +1 @@\n-old\n+new',
      reason: 'test reason',
      evidence: {},
      status: 'pending',
      testResult: null,
    };
    writeFileSync(
      join(tmpDir, '.omc', 'nexus', 'improvements', 'imp-001.json'),
      JSON.stringify(imp)
    );
    const improvements = loadPendingImprovements(tmpDir);
    expect(improvements.length).toBe(1);
    expect(improvements[0].id).toBe('imp-001');
    expect(improvements[0].confidence).toBe(85);
  });

  it('skips non-pending improvements', () => {
    const imp: ImprovementSuggestion = {
      id: 'imp-002',
      createdAt: '2026-02-26T14:00:00Z',
      source: 'evolution_engine',
      type: 'skill_update',
      targetFile: 'skills/test/SKILL.md',
      confidence: 90,
      diff: '',
      reason: 'already applied',
      evidence: {},
      status: 'applied',
      testResult: 'PASS',
    };
    writeFileSync(
      join(tmpDir, '.omc', 'nexus', 'improvements', 'imp-002.json'),
      JSON.stringify(imp)
    );
    const improvements = loadPendingImprovements(tmpDir);
    expect(improvements).toEqual([]);
  });
});
```

**Step 2: 运行测试确认失败**

```bash
npm test -- src/hooks/nexus/__tests__/improvement-puller.test.ts
```
Expected: FAIL — `Cannot find module '../improvement-puller.js'`

**Step 3: 实现 improvement-puller.ts**

```typescript
// src/hooks/nexus/improvement-puller.ts
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { isNexusEnabled } from './config.js';
import type { ImprovementSuggestion } from './types.js';

const IMPROVEMENTS_SUBDIR = '.omc/nexus/improvements';

export function getImprovementsDir(directory: string): string {
  return join(directory, IMPROVEMENTS_SUBDIR);
}

export function loadPendingImprovements(directory: string): ImprovementSuggestion[] {
  const improvementsDir = getImprovementsDir(directory);
  if (!existsSync(improvementsDir)) {
    return [];
  }
  const results: ImprovementSuggestion[] = [];
  for (const file of readdirSync(improvementsDir)) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = readFileSync(join(improvementsDir, file), 'utf-8');
      const imp = JSON.parse(raw) as ImprovementSuggestion;
      if (imp.status === 'pending') {
        results.push(imp);
      }
    } catch {
      // Skip malformed files
    }
  }
  return results;
}

export interface PullResult {
  found: number;
  autoApplied: number;
  pendingReview: number;
  errors: string[];
}

export async function pullImprovements(directory: string): Promise<PullResult> {
  const result: PullResult = { found: 0, autoApplied: 0, pendingReview: 0, errors: [] };
  try {
    if (!isNexusEnabled(directory)) return result;
    const improvements = loadPendingImprovements(directory);
    result.found = improvements.length;
    // Routing by confidence is handled by the caller (session-end-hook or PreToolUse)
    result.pendingReview = improvements.length;
  } catch (e) {
    result.errors.push(e instanceof Error ? e.message : String(e));
  }
  return result;
}
```

**Step 4: 运行测试确认通过**

```bash
npm test -- src/hooks/nexus/__tests__/improvement-puller.test.ts
```
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/hooks/nexus/improvement-puller.ts src/hooks/nexus/__tests__/improvement-puller.test.ts
git commit -m "feat(nexus): add improvement-puller hook"
```

---

### Task 9: Telegram Bot 通知（Python）

**Files:**
- Create: `nexus-daemon/telegram_bot.py`
- Create: `nexus-daemon/tests/test_telegram_bot.py`
- Modify: `nexus-daemon/daemon.py`（集成 Telegram 通知）

**Step 1: 写失败测试**

```python
# nexus-daemon/tests/test_telegram_bot.py
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from telegram_bot import TelegramBot, format_improvement_message

class TestFormatImprovementMessage:
    def test_includes_id_and_confidence(self):
        imp = {
            'id': 'imp-001',
            'confidence': 85,
            'type': 'skill_update',
            'targetFile': 'skills/learner/SKILL.md',
            'reason': 'test reason',
        }
        msg = format_improvement_message(imp)
        assert 'imp-001' in msg
        assert '85' in msg
        assert 'skill_update' in msg

    def test_includes_auto_apply_label_when_high_confidence(self):
        imp = {
            'id': 'imp-002',
            'confidence': 90,
            'type': 'skill_update',
            'targetFile': 'skills/test/SKILL.md',
            'reason': 'high confidence',
        }
        msg = format_improvement_message(imp)
        assert 'AUTO' in msg or 'auto' in msg.lower()

    def test_includes_review_label_when_low_confidence(self):
        imp = {
            'id': 'imp-003',
            'confidence': 60,
            'type': 'hook_update',
            'targetFile': 'src/hooks/test.ts',
            'reason': 'low confidence',
        }
        msg = format_improvement_message(imp)
        assert 'review' in msg.lower() or 'confirm' in msg.lower()

class TestTelegramBot:
    def test_init_disabled_when_no_token(self):
        bot = TelegramBot(token='', chat_id='')
        assert not bot.enabled

    def test_init_enabled_when_token_provided(self):
        bot = TelegramBot(token='test-token', chat_id='12345')
        assert bot.enabled

    @pytest.mark.asyncio
    async def test_send_message_returns_false_when_disabled(self):
        bot = TelegramBot(token='', chat_id='')
        result = await bot.send_message('test')
        assert result is False
```

**Step 2: 运行测试确认失败**

```bash
cd nexus-daemon && pip install pytest pytest-asyncio && python -m pytest tests/test_telegram_bot.py -v
```
Expected: FAIL — `ModuleNotFoundError: No module named 'telegram_bot'`



**Step 3: 实现 telegram_bot.py**

```python
# nexus-daemon/telegram_bot.py
"""
Telegram Bot: 发送改进通知，接收用户确认指令。
"""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger('nexus.telegram')

AUTO_APPLY_THRESHOLD = 80


def format_improvement_message(imp: dict[str, Any], auto_apply_threshold: int = AUTO_APPLY_THRESHOLD) -> str:
    """格式化改进建议为 Telegram 消息。"""
    confidence = imp.get('confidence', 0)
    label = 'AUTO-APPLY' if confidence >= auto_apply_threshold else 'needs review/confirm'
    return (
        f"[{label}] nexus improvement\n"
        f"ID: {imp.get('id', '?')}\n"
        f"Type: {imp.get('type', '?')}\n"
        f"File: {imp.get('targetFile', '?')}\n"
        f"Confidence: {confidence}\n"
        f"Reason: {imp.get('reason', '?')}"
    )


class TelegramBot:
    """Telegram Bot 客户端，用于发送通知和接收确认。"""

    API_BASE = 'https://api.telegram.org/bot{token}/{method}'

    def __init__(self, token: str, chat_id: str):
        self.enabled = bool(token and chat_id)
        self._token = token
        self._chat_id = chat_id

    async def send_message(self, text: str) -> bool:
        """发送消息到 Telegram。返回 True 表示成功。"""
        if not self.enabled:
            return False
        try:
            import aiohttp
            url = self.API_BASE.format(token=self._token, method='sendMessage')
            payload = {'chat_id': self._chat_id, 'text': text, 'parse_mode': 'HTML'}
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status == 200:
                        logger.info('Telegram message sent')
                        return True
                    logger.warning('Telegram API error: %s', resp.status)
                    return False
        except Exception as e:
            logger.error('Telegram send error: %s', e)
            return False

    async def notify_improvement(self, imp: dict[str, Any]) -> bool:
        """发送改进建议通知。"""
        msg = format_improvement_message(imp)
        return await self.send_message(msg)
```

**Step 4: 集成到 daemon.py**

在 `NexusDaemon.__init__` 末尾添加：

```python
from telegram_bot import TelegramBot
self._telegram = TelegramBot(
    token=self.config.telegram_token,
    chat_id=self.config.telegram_chat_id,
)
self._notified_improvements: set[str] = set()  # dedup: avoid re-notifying same improvement
```

在 `run_once` 的进化引擎调用后追加：

```python
# Notify via Telegram for improvements needing review (with deduplication)
if self._telegram.enabled:
    improvements_dir = self.repo_path / 'improvements'
    import json as _json
    for f in sorted(improvements_dir.glob('*.json')):
        imp_id = f.stem
        if imp_id in self._notified_improvements:
            continue  # already notified this improvement
        try:
            imp = _json.loads(f.read_text())
            if imp.get('status') == 'pending':
                sent = await self._telegram.notify_improvement(imp)
                if sent:
                    self._notified_improvements.add(imp_id)
        except Exception:
            pass
```

**Step 5: 运行测试确认通过**

```bash
cd nexus-daemon && python -m pytest tests/test_telegram_bot.py -v
```
Expected: PASS (6 tests)

**Step 6: Commit**

```bash
git add nexus-daemon/telegram_bot.py nexus-daemon/tests/test_telegram_bot.py nexus-daemon/daemon.py
git commit -m "feat(nexus): add Telegram Bot notifications"
```

---


---

### Task 10: Consciousness Loop（后台意识循环）

**Files:**
- Create: `nexus-daemon/tests/test_consciousness_loop.py`
- Create: `nexus-daemon/consciousness_loop.py`
- Modify: `nexus-daemon/daemon.py`

**Step 1: 编写失败测试**

```python
# nexus-daemon/tests/test_consciousness_loop.py
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
import json

from consciousness_loop import ConsciousnessLoop, ConsciousnessConfig


@pytest.fixture
def tmp_repo(tmp_path):
    (tmp_path / 'consciousness').mkdir()
    (tmp_path / 'consciousness' / 'rounds').mkdir()
    return tmp_path


def make_loop(tmp_repo):
    cfg = ConsciousnessConfig(
        interval_seconds=300,
        budget_percent=10,
        max_rounds_per_session=5,
    )
    return ConsciousnessLoop(repo_path=tmp_repo, config=cfg)


def test_scratchpad_path(tmp_repo):
    loop = make_loop(tmp_repo)
    assert loop.scratchpad_path == tmp_repo / 'consciousness' / 'scratchpad.md'


def test_rounds_dir(tmp_repo):
    loop = make_loop(tmp_repo)
    assert loop.rounds_dir == tmp_repo / 'consciousness' / 'rounds'


def test_write_scratchpad(tmp_repo):
    loop = make_loop(tmp_repo)
    loop._write_scratchpad('test content')
    assert loop.scratchpad_path.read_text() == 'test content'


def test_write_round_record(tmp_repo):
    loop = make_loop(tmp_repo)
    loop._write_round_record(round_num=1, content='round 1 thoughts')
    files = list(loop.rounds_dir.glob('round-*.md'))
    assert len(files) == 1
    assert 'round 1 thoughts' in files[0].read_text()


def test_is_paused_when_busy(tmp_repo):
    loop = make_loop(tmp_repo)
    # Create a busy marker
    (tmp_repo / '.nexus-busy').write_text('1')
    assert loop.is_paused() is True


def test_not_paused_when_idle(tmp_repo):
    loop = make_loop(tmp_repo)
    assert loop.is_paused() is False
```

**Step 2: 运行测试确认失败**

```bash
cd nexus-daemon && python -m pytest tests/test_consciousness_loop.py -v
```
Expected: FAIL with `ModuleNotFoundError: No module named 'consciousness_loop'`

**Step 3: 实现 `nexus-daemon/consciousness_loop.py`**

```python
# nexus-daemon/consciousness_loop.py
from __future__ import annotations
import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional


@dataclass
class ConsciousnessConfig:
    interval_seconds: int = 300
    budget_percent: int = 10
    max_rounds_per_session: int = 5


class ConsciousnessLoop:
    def __init__(self, repo_path: Path, config: ConsciousnessConfig):
        self.repo_path = repo_path
        self.config = config
        self._round_count = 0

    @property
    def scratchpad_path(self) -> Path:
        return self.repo_path / 'consciousness' / 'scratchpad.md'

    @property
    def rounds_dir(self) -> Path:
        return self.repo_path / 'consciousness' / 'rounds'

    def is_paused(self) -> bool:
        return (self.repo_path / '.nexus-busy').exists()

    def _write_scratchpad(self, content: str) -> None:
        self.scratchpad_path.parent.mkdir(parents=True, exist_ok=True)
        self.scratchpad_path.write_text(content)

    def _write_round_record(self, round_num: int, content: str) -> None:
        self.rounds_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
        path = self.rounds_dir / f'round-{round_num:04d}-{ts}.md'
        path.write_text(content)

    async def run_once(self) -> Optional[str]:
        """Run one consciousness round. Returns scratchpad content or None if paused."""
        if self.is_paused():
            return None
        if self._round_count >= self.config.max_rounds_per_session:
            return None

        self._round_count += 1
        ts = datetime.utcnow().isoformat()
        content = (
            f'# Consciousness Round {self._round_count}\n\n'
            f'**Timestamp:** {ts}\n\n'
            f'*Awaiting LLM reflection...*\n'
        )
        self._write_scratchpad(content)
        self._write_round_record(self._round_count, content)
        return content

    async def run_loop(self) -> None:
        """Continuous loop: run_once every interval_seconds."""
        while True:
            await self.run_once()
            await asyncio.sleep(self.config.interval_seconds)
```

**Step 4: 集成到 `nexus-daemon/daemon.py`**

在 `NexusDaemon.__init__` 中添加：
```python
from consciousness_loop import ConsciousnessLoop, ConsciousnessConfig

# 在 __init__ 末尾添加：
self._consciousness = ConsciousnessLoop(
    repo_path=self.repo_path,
    config=ConsciousnessConfig(
        interval_seconds=self.config.consciousness_interval,
        budget_percent=self.config.consciousness_budget_percent,
    ),
)
```

在 `run()` 方法中并行启动意识循环：
```python
async def run(self) -> None:
    """Main daemon loop."""
    tasks = [
        asyncio.create_task(self._main_loop()),
        asyncio.create_task(self._consciousness.run_loop()),
    ]
    await asyncio.gather(*tasks)

async def _main_loop(self) -> None:
    """Git pull + evolution engine loop."""
    while True:
        await self.run_once()
        await asyncio.sleep(60)
```

**Step 5: 运行测试确认通过**

```bash
cd nexus-daemon && python -m pytest tests/test_consciousness_loop.py -v
```
Expected: PASS (6 tests)

**Step 6: Commit**

```bash
git add nexus-daemon/consciousness_loop.py nexus-daemon/tests/test_consciousness_loop.py nexus-daemon/daemon.py
git commit -m "feat(nexus): add Consciousness Loop background awareness"
```

---

### Task 11: Self-Evaluator（健康报告）

**Files:**
- Create: `nexus-daemon/tests/test_self_evaluator.py`
- Create: `nexus-daemon/self_evaluator.py`
- Modify: `nexus-daemon/daemon.py`

**Step 1: 编写失败测试**

```python
# nexus-daemon/tests/test_self_evaluator.py
import pytest
from pathlib import Path
import json
from self_evaluator import SelfEvaluator, SkillStats, HealthReport


@pytest.fixture
def tmp_repo(tmp_path):
    events_dir = tmp_path / 'events'
    events_dir.mkdir()
    return tmp_path


def make_event(session_id: str, skills_triggered: list[str]) -> dict:
    return {
        'sessionId': session_id,
        'timestamp': '2026-02-26T10:00:00Z',
        'skillsTriggered': skills_triggered,
    }


def test_empty_events_returns_empty_report(tmp_repo):
    ev = SelfEvaluator(repo_path=tmp_repo)
    report = ev.generate_report()
    assert isinstance(report, HealthReport)
    assert report.total_sessions == 0
    assert report.skill_stats == {}


def test_counts_skill_usage(tmp_repo):
    (tmp_repo / 'events').mkdir(exist_ok=True)
    evt = make_event('s1', ['learner', 'autopilot'])
    (tmp_repo / 'events' / 's1.json').write_text(json.dumps(evt))
    ev = SelfEvaluator(repo_path=tmp_repo)
    report = ev.generate_report()
    assert report.skill_stats['learner'].trigger_count == 1
    assert report.skill_stats['autopilot'].trigger_count == 1


def test_detects_zombie_skills(tmp_repo):
    (tmp_repo / 'events').mkdir(exist_ok=True)
    # 10 sessions, none trigger 'zombie-skill'
    for i in range(10):
        evt = make_event(f's{i}', ['learner'])
        (tmp_repo / 'events' / f's{i}.json').write_text(json.dumps(evt))
    ev = SelfEvaluator(repo_path=tmp_repo, zombie_threshold=5)
    report = ev.generate_report()
    assert 'zombie-skill' not in report.skill_stats
    assert report.total_sessions == 10


def test_format_report_markdown(tmp_repo):
    ev = SelfEvaluator(repo_path=tmp_repo)
    report = HealthReport(total_sessions=3, skill_stats={}, zombie_skills=[])
    md = ev.format_report(report)
    assert '# nexus Health Report' in md
    assert 'Total sessions: 3' in md
```

**Step 2: 运行测试确认失败**

```bash
cd nexus-daemon && python -m pytest tests/test_self_evaluator.py -v
```
Expected: FAIL with `ModuleNotFoundError: No module named 'self_evaluator'`

**Step 3: 实现 `nexus-daemon/self_evaluator.py`**

```python
# nexus-daemon/self_evaluator.py
from __future__ import annotations
import json
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional


@dataclass
class SkillStats:
    trigger_count: int = 0


@dataclass
class HealthReport:
    total_sessions: int
    skill_stats: dict[str, SkillStats]
    zombie_skills: list[str] = field(default_factory=list)
    generated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


class SelfEvaluator:
    def __init__(self, repo_path: Path, zombie_threshold: int = 10):
        self.repo_path = repo_path
        self.zombie_threshold = zombie_threshold

    def _load_events(self) -> list[dict]:
        events_dir = self.repo_path / 'events'
        if not events_dir.exists():
            return []
        events = []
        for f in events_dir.glob('*.json'):
            try:
                events.append(json.loads(f.read_text()))
            except Exception:
                pass
        return events

    def generate_report(self) -> HealthReport:
        events = self._load_events()
        skill_stats: dict[str, SkillStats] = {}

        for evt in events:
            for skill in evt.get('skillsTriggered', []):
                if skill not in skill_stats:
                    skill_stats[skill] = SkillStats()
                skill_stats[skill].trigger_count += 1

        # Detect zombie skills: sessions >= threshold but skill never triggered
        zombie_skills: list[str] = []
        if len(events) >= self.zombie_threshold:
            all_known = set()
            for evt in events:
                all_known.update(evt.get('skillsAvailable', []))
            for skill in all_known:
                if skill not in skill_stats or skill_stats[skill].trigger_count == 0:
                    zombie_skills.append(skill)

        return HealthReport(
            total_sessions=len(events),
            skill_stats=skill_stats,
            zombie_skills=sorted(zombie_skills),
        )

    def format_report(self, report: HealthReport) -> str:
        lines = [
            '# nexus Health Report',
            f'',
            f'Generated: {report.generated_at}',
            f'Total sessions: {report.total_sessions}',
            '',
            '## Skill Usage',
        ]
        if not report.skill_stats:
            lines.append('No skill usage recorded.')
        else:
            for skill, stats in sorted(report.skill_stats.items()):
                lines.append(f'- `{skill}`: {stats.trigger_count} triggers')
        if report.zombie_skills:
            lines += ['', '## Zombie Skills (never triggered)', '']
            for z in report.zombie_skills:
                lines.append(f'- `{z}`')
        return '\n'.join(lines)
```

**Step 4: 集成到 `nexus-daemon/daemon.py`**

在 `run_once()` 末尾添加每日健康报告逻辑：
```python
from self_evaluator import SelfEvaluator

# 在 __init__ 末尾：
self._evaluator = SelfEvaluator(repo_path=self.repo_path)
self._last_report_date: str = ''

# 在 run_once() 末尾：
today = datetime.utcnow().strftime('%Y-%m-%d')
if today != self._last_report_date:
    self._last_report_date = today
    report = self._evaluator.generate_report()
    md = self._evaluator.format_report(report)
    report_path = self.repo_path / 'consciousness' / f'health-{today}.md'
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(md)
    if self._telegram.enabled:
        await self._telegram.send_message(f'Daily health report ready: {today}')
```

**Step 5: 运行测试确认通过**

```bash
cd nexus-daemon && python -m pytest tests/test_self_evaluator.py -v
```
Expected: PASS (4 tests)

**Step 6: Commit**

```bash
git add nexus-daemon/self_evaluator.py nexus-daemon/tests/test_self_evaluator.py nexus-daemon/daemon.py
git commit -m "feat(nexus): add Self-Evaluator health reports"
```

---

### Task 12: nexus 管理 Skills（nexus-status / nexus-evolve / nexus-review）

**Files:**
- Create: `skills/nexus/nexus-status/SKILL.md`
- Create: `skills/nexus/nexus-evolve/SKILL.md`
- Create: `skills/nexus/nexus-review/SKILL.md`

**Step 1: 创建 `skills/nexus/nexus-status/SKILL.md`**

```markdown
---
name: nexus-status
description: 查看 nexus 系统状态
triggers:
  - nexus status
  - nexus-status
  - nexus health
---

# nexus Status

显示 nexus 系统当前状态。

## 执行步骤

1. 读取 `.omc/nexus/config.json` 确认 nexus 是否启用
2. 检查 `.omc/nexus/events/` 目录，统计待推送事件数量
3. 检查 `.omc/nexus/improvements/` 目录，统计待审批改进数量
4. 输出状态摘要：

```
nexus Status
============
Enabled: true/false
Pending events: N
Pending improvements: N
Last sync: <timestamp or "never">
```

如果 nexus 未启用，提示用户配置 `.omc/nexus/config.json`。
```

**Step 2: 创建 `skills/nexus/nexus-evolve/SKILL.md`**

```markdown
---
name: nexus-evolve
description: 手动触发 nexus 进化引擎
triggers:
  - nexus evolve
  - nexus-evolve
  - trigger evolution
---

# nexus Evolve

手动触发 nexus 进化引擎，立即处理积累的会话数据。

## 执行步骤

1. 检查 `.omc/nexus/events/` 是否有未处理事件
2. 如果有，执行 git push 将事件推送到 nexus-daemon 仓库
3. 提示用户：进化引擎将在 VPS 端处理这些事件
4. 等待约 2 分钟后，执行 git pull 拉取改进建议
5. 如果有新的 `.omc/nexus/improvements/` 文件，显示摘要

## 输出格式

```
nexus Evolve triggered
======================
Events pushed: N
Waiting for VPS processing...
Improvements received: N
Run /nexus-review to review pending improvements.
```
```

**Step 3: 创建 `skills/nexus/nexus-review/SKILL.md`**

```markdown
---
name: nexus-review
description: 查看并审批 nexus 生成的改进建议
triggers:
  - nexus review
  - nexus-review
  - review improvements
---

# nexus Review

查看 nexus 系统生成的待审批改进建议。

## 执行步骤

1. 读取 `.omc/nexus/improvements/` 下所有 `status === "pending"` 的文件
2. 按置信度降序排列
3. 对每个改进建议显示：
   - ID、类型、目标文件
   - 置信度（≥80 标记为 AUTO-APPLY）
   - 原因和证据摘要
   - diff 内容

4. 询问用户对每个建议的操作：
   - `apply`：应用改进，更新 status 为 `applied`
   - `skip`：跳过，更新 status 为 `rejected`
   - `auto`：自动应用所有置信度 ≥80 的建议

## 输出格式

```
nexus Improvements (N pending)
==============================
[1] skill_update | skills/learner/SKILL.md | confidence: 87 [AUTO-APPLY]
    Reason: 触发词 'learn' 在过去 10 次会话中出现 23 次但未触发
    Action? (apply/skip/auto):
```
```

**Step 4: 验证 skill 文件格式正确**

```bash
# 确认文件存在
ls skills/nexus/nexus-status/SKILL.md skills/nexus/nexus-evolve/SKILL.md skills/nexus/nexus-review/SKILL.md
```
Expected: 3 files listed without error

```bash
# 确认每个文件包含必要的 frontmatter 字段
grep -l "^name:" skills/nexus/*/SKILL.md | wc -l
grep -l "^triggers:" skills/nexus/*/SKILL.md | wc -l
```
Expected: 两条命令均输出 `3`

**Step 5: Commit**

```bash
git add skills/nexus/
git commit -m "feat(nexus): add nexus-status, nexus-evolve, nexus-review management skills"
```

---

### Task 13: systemd 服务文件（VPS 部署）

**Files:**
- Create: `nexus-daemon/nexus-daemon.service`
- Create: `nexus-daemon/install.sh`

**Step 1: 创建 `nexus-daemon/nexus-daemon.service`**

```ini
[Unit]
Description=nexus Daemon - ultrapower self-improvement VPS service
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=nexus
WorkingDirectory=/opt/nexus-daemon
ExecStart=/opt/nexus-daemon/venv/bin/python daemon.py
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=nexus-daemon

# Environment
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

**Step 2: 创建 `nexus-daemon/install.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR=/opt/nexus-daemon
SERVICE_FILE=/etc/systemd/system/nexus-daemon.service

echo "Installing nexus-daemon..."

# Create user
id nexus &>/dev/null || useradd -r -s /bin/false nexus

# Copy files
mkdir -p "$INSTALL_DIR"
cp -r . "$INSTALL_DIR/"
chown -R nexus:nexus "$INSTALL_DIR"

# Create virtualenv and install deps
python3 -m venv "$INSTALL_DIR/venv"
"$INSTALL_DIR/venv/bin/pip" install -r "$INSTALL_DIR/requirements.txt"

# Install systemd service
cp nexus-daemon.service "$SERVICE_FILE"
systemctl daemon-reload
systemctl enable nexus-daemon
systemctl start nexus-daemon

echo "nexus-daemon installed and started."
echo "Check status: systemctl status nexus-daemon"
```

**Step 3: 验证文件内容**

```bash
cat nexus-daemon/nexus-daemon.service | grep -E "^(Description|ExecStart|Restart)"
```
Expected:
```
Description=nexus Daemon - ultrapower self-improvement VPS service
ExecStart=/opt/nexus-daemon/venv/bin/python daemon.py
Restart=on-failure
```

**Step 4: Commit**

```bash
git add nexus-daemon/nexus-daemon.service nexus-daemon/install.sh
git commit -m "feat(nexus): add systemd service file and install script"
```

---

### Task 14: Self-Modifier（代码自动修改模块）

**Files:**
- Create: `nexus-daemon/self_modifier.py`
- Modify: `nexus-daemon/daemon.py`（在 `run_once` 中集成 Self-Modifier）
- Create: `nexus-daemon/tests/test_self_modifier.py`

**Step 1: 写失败测试**

```python
# nexus-daemon/tests/test_self_modifier.py
import pytest
import json
from pathlib import Path
from unittest.mock import patch, MagicMock
import tempfile
import shutil

from self_modifier import SelfModifier, ModificationResult


@pytest.fixture
def repo(tmp_path):
    """Create a minimal fake ultrapower repo."""
    skills_dir = tmp_path / 'skills' / 'learner'
    skills_dir.mkdir(parents=True)
    skill_file = skills_dir / 'SKILL.md'
    skill_file.write_text(
        '---\nname: learner\ntriggers:\n  - learn\n---\n# Learner\n'
    )
    # Init git
    import subprocess
    subprocess.run(['git', 'init'], cwd=tmp_path, capture_output=True)
    subprocess.run(['git', 'add', '.'], cwd=tmp_path, capture_output=True)
    subprocess.run(
        ['git', 'commit', '-m', 'init'],
        cwd=tmp_path, capture_output=True,
        env={**__import__('os').environ, 'GIT_AUTHOR_NAME': 'test',
             'GIT_AUTHOR_EMAIL': 'test@test.com',
             'GIT_COMMITTER_NAME': 'test',
             'GIT_COMMITTER_EMAIL': 'test@test.com'},
    )
    return tmp_path


def test_apply_skill_update_low_confidence_skipped(repo):
    """Improvements with confidence < 70 are skipped."""
    modifier = SelfModifier(repo_path=repo)
    improvement = {
        'id': 'imp-001',
        'type': 'skill_update',
        'targetFile': 'skills/learner/SKILL.md',
        'confidence': 60,
        'diff': '--- a/skills/learner/SKILL.md\n+++ b/skills/learner/SKILL.md\n'
                '@@ -3,1 +3,2 @@\n   - learn\n+  - study\n',
        'reason': 'add synonym',
    }
    result = modifier.apply(improvement)
    assert result.status == 'skipped'
    assert result.reason == 'confidence below threshold'


def test_apply_skill_update_high_confidence_applies(repo):
    """Improvements with confidence >= 70 on skill files are applied."""
    modifier = SelfModifier(repo_path=repo)
    new_content = (
        '---\nname: learner\ntriggers:\n  - learn\n  - study\n---\n# Learner\n'
    )
    improvement = {
        'id': 'imp-002',
        'type': 'skill_update',
        'targetFile': 'skills/learner/SKILL.md',
        'confidence': 75,
        'newContent': new_content,
        'reason': 'add synonym study',
    }
    result = modifier.apply(improvement)
    assert result.status == 'applied'
    applied_content = (repo / 'skills' / 'learner' / 'SKILL.md').read_text()
    assert 'study' in applied_content


def test_apply_rejects_path_traversal(repo):
    """Path traversal in targetFile is rejected."""
    modifier = SelfModifier(repo_path=repo)
    improvement = {
        'id': 'imp-003',
        'type': 'skill_update',
        'targetFile': '../../etc/passwd',
        'confidence': 90,
        'newContent': 'malicious',
        'reason': 'test',
    }
    result = modifier.apply(improvement)
    assert result.status == 'rejected'
    assert 'path traversal' in result.reason.lower()
```

**Step 2: 运行测试确认失败**

```bash
cd nexus-daemon && python -m pytest tests/test_self_modifier.py -v
```
Expected: FAIL — `ModuleNotFoundError: No module named 'self_modifier'`

**Step 3: 实现 `nexus-daemon/self_modifier.py`**

```python
# nexus-daemon/self_modifier.py
"""Self-Modifier: applies improvement suggestions to the ultrapower repo."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Only these path prefixes are allowed for auto-modification
ALLOWED_PREFIXES = ('skills/', 'agents/')
# Confidence threshold: below this, skip without applying
CONFIDENCE_THRESHOLD = 70


@dataclass
class ModificationResult:
    status: str   # 'applied' | 'skipped' | 'rejected' | 'error'
    reason: str
    improvement_id: str


class SelfModifier:
    """Applies improvement suggestions to skill/agent Markdown files."""

    def __init__(self, repo_path: Path) -> None:
        self.repo_path = Path(repo_path)

    def _validate_target(self, target_file: str) -> str | None:
        """Return error message if target_file is invalid, else None."""
        # Reject path traversal
        try:
            resolved = (self.repo_path / target_file).resolve()
            resolved.relative_to(self.repo_path.resolve())
        except ValueError:
            return 'path traversal detected'

        # Only allow skills/ and agents/ directories
        if not any(target_file.startswith(p) for p in ALLOWED_PREFIXES):
            return f'target outside allowed prefixes {ALLOWED_PREFIXES}'

        # Only allow Markdown files
        if not target_file.endswith('.md'):
            return 'only .md files are allowed for auto-modification'

        return None

    def apply(self, improvement: dict[str, Any]) -> ModificationResult:
        """Apply a single improvement. Returns ModificationResult."""
        imp_id = improvement.get('id', 'unknown')
        confidence = improvement.get('confidence', 0)
        target_file = improvement.get('targetFile', '')
        new_content = improvement.get('newContent')

        # Confidence gate
        if confidence < CONFIDENCE_THRESHOLD:
            return ModificationResult(
                status='skipped',
                reason='confidence below threshold',
                improvement_id=imp_id,
            )

        # Path validation
        error = self._validate_target(target_file)
        if error:
            return ModificationResult(
                status='rejected',
                reason=error,
                improvement_id=imp_id,
            )

        # Apply: write new content
        target_path = self.repo_path / target_file
        if new_content is None:
            return ModificationResult(
                status='error',
                reason='newContent field missing',
                improvement_id=imp_id,
            )

        try:
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_text(new_content, encoding='utf-8')
            logger.info('Applied improvement %s to %s', imp_id, target_file)
            return ModificationResult(
                status='applied',
                reason=f'wrote {len(new_content)} bytes to {target_file}',
                improvement_id=imp_id,
            )
        except OSError as e:
            return ModificationResult(
                status='error',
                reason=str(e),
                improvement_id=imp_id,
            )
```

**Step 4: 运行测试确认通过**

```bash
cd nexus-daemon && python -m pytest tests/test_self_modifier.py -v
```
Expected: PASS (3 tests)

**Step 5: 集成到 `daemon.py` 的 `run_once`**

在 `NexusDaemon.__init__` 中添加：

```python
from self_modifier import SelfModifier

# 在 __init__ 末尾：
self._modifier = SelfModifier(repo_path=self.repo_path)
```

在 `run_once` 的改进通知循环中，在 `notify_improvement` 调用之后添加自动应用逻辑：

```python
# Auto-apply high-confidence improvements (confidence >= 80)
if imp.get('confidence', 0) >= 80 and imp.get('status') == 'pending':
    result = self._modifier.apply(imp)
    if result.status == 'applied':
        imp['status'] = 'auto_applied'
        f.write_text(
            __import__('json').dumps(imp, indent=2, ensure_ascii=False),
            encoding='utf-8',
        )
        logger.info('Auto-applied improvement %s', imp_id)
```

**Step 6: 运行全量测试**

```bash
cd nexus-daemon && python -m pytest tests/ -v
```
Expected: PASS (all tests)

**Step 7: Commit**

```bash
git add nexus-daemon/self_modifier.py nexus-daemon/tests/test_self_modifier.py nexus-daemon/daemon.py
git commit -m "feat(nexus): add Self-Modifier module for auto-applying skill improvements"
```

---

## 实现完成检查清单

### P0 核心功能（Tasks 1-5）
- [ ] Task 1: nexus 配置类型和加载器
- [ ] Task 2: data-collector hook（收集会话数据）
- [ ] Task 3: consciousness-sync hook（SessionEnd 后 git push）
- [ ] Task 4: session-end hook 集成
- [ ] Task 5: processSessionEnd 注册 nexus hook

### P1 重要功能（Tasks 6-9, 14）
- [ ] Task 6: nexus-daemon Python 基础框架
- [ ] Task 7: Evolution Engine MVP（模式检测 + knowledge_base）
- [ ] Task 8: improvement-puller hook（拉取改进）
- [ ] Task 9: Telegram Bot 通知
- [ ] Task 14: Self-Modifier（代码自动修改模块）

### P2 增强功能（Tasks 10-13）
- [ ] Task 10: Consciousness Loop（后台意识循环）
- [ ] Task 11: Self-Evaluator（健康报告）
- [ ] Task 12: nexus 管理 Skills（nexus-status / nexus-evolve / nexus-review）
- [ ] Task 13: systemd 服务文件（VPS 部署）

### 验收标准（来自设计文档）
- [ ] 会话结束后，数据自动推送到 nexus-daemon 仓库
- [ ] VPS 守护进程每分钟拉取新事件并处理
- [ ] 后台意识循环每 5 分钟运行一次，写入 scratchpad.md
- [ ] 同类模式出现 ≥ 3 次后，Evolution Engine 生成改进建议
- [ ] 置信度 ≥ 80 的改进自动通过测试后合并
- [ ] 置信度 < 80 的改进通过 Telegram 发送确认请求
- [ ] 所有代码修改必须通过 `tsc --noEmit && npm test`
- [ ] 不破坏 ultrapower 现有任何功能

### 最终验证命令

```bash
# TypeScript 层
npm run build && npm test

# Python 层
cd nexus-daemon && python -m pytest -v

# 检查所有 skill 文件存在
ls skills/nexus/*/SKILL.md
```
