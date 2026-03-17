# Technical Debt Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use ultrapower:executing-plans to implement this plan task-by-task.

**Goal:** Fix 4 identified technical debt items from architecture assessment (TD-1 to TD-4)

**Architecture:** Prioritize P0 test stability, then address P1 deprecation warnings and platform compatibility, finally unify atomic write protection

**Tech Stack:** TypeScript, Vitest, Node.js fs module, cross-platform file operations

---

## Task 1: Fix P0 Test Timeout Issues (TD-1)

**Priority:** P0 - Blocking CI pipeline

**Files:**
- Modify: `src/features/__tests__/mcp-integration.test.ts:9`
- Modify: `src/features/mcp-autodiscovery/__tests__/performance.test.ts:7`

**Step 1: Increase timeout for MCP integration tests**

```typescript
// src/features/__tests__/mcp-integration.test.ts
beforeAll(async () => {
  contextManager = new UnifiedContextManager();
  await contextManager.initialize();
}, 30000); // Increase from 10000 to 30000ms
```

**Step 2: Increase timeout for performance tests**

```typescript
// src/features/mcp-autodiscovery/__tests__/performance.test.ts
beforeAll(async () => {
  // Setup code
}, 30000); // Increase from 10000 to 30000ms
```

**Step 3: Run tests to verify fixes**

Run: `npm test -- mcp-integration.test.ts performance.test.ts`
Expected: All tests pass without timeout

**Step 4: Commit**

```bash
git add src/features/__tests__/mcp-integration.test.ts src/features/mcp-autodiscovery/__tests__/performance.test.ts
git commit -m "fix(test): increase timeout for MCP integration tests to 30s

Resolves TD-1: Test timeout issues blocking CI pipeline"
```

---

## Task 2: Remove LSP Tool Deprecation Warnings (TD-2)

**Priority:** P1 - User experience and maintenance

**Files:**
- Modify: `src/tools/lsp-tools.ts`
- Modify: `docs/REFERENCE.md`
- Modify: `README.md`

**Step 1: Update all documentation to use new naming**

Search and replace in documentation:
- `ultrapower:lsp_diagnostics` → `ultrapower:lsp_diagnostics`
- `ultrapower:lsp_hover` → `ultrapower:lsp_hover`
- (repeat for all 12 LSP tools)

**Step 2: Add deprecation timeline to CHANGELOG**

```markdown
## [Unreleased]

### Deprecated
- Old LSP tool naming (without `ultrapower:` prefix) will be removed in v8.0.0
- Users should migrate to new naming: `ultrapower:lsp_*`
```

**Step 3: Verify no old naming in docs**

Run: `grep -r "ultrapower:lsp_diagnostics" docs/ README.md`
Expected: No matches (all should use `ultrapower:lsp_diagnostics`)

**Step 4: Commit**

```bash
git add docs/ README.md CHANGELOG.md
git commit -m "docs: migrate LSP tool naming to ultrapower: prefix

Resolves TD-2: Prepare for v8.0.0 deprecation removal"
```

---

## Task 3: Add Windows Platform Compatibility Tests (TD-3)

**Priority:** P1 - Platform compatibility

**Files:**
- Create: `tests/platform/windows-atomic-write.test.ts`
- Modify: `src/lib/atomic-write.ts`

**Step 1: Create Windows-specific test file**

```typescript
// tests/platform/windows-atomic-write.test.ts
import { describe, it, expect } from 'vitest';
import { atomicWriteJsonSyncWithRetry } from '../../src/lib/atomic-write';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe.skipIf(process.platform !== 'win32')('Windows atomic write', () => {
  it('should handle locked files gracefully', async () => {
    const testPath = join(process.cwd(), '.test-windows-lock.json');
    const data = { test: 'value' };

    // Write should succeed even if file is temporarily locked
    atomicWriteJsonSyncWithRetry(testPath, data);

    expect(existsSync(testPath)).toBe(true);
    const content = JSON.parse(readFileSync(testPath, 'utf-8'));
    expect(content).toEqual(data);
  });
});
```

**Step 2: Run Windows tests**

Run: `npm test -- windows-atomic-write.test.ts`
Expected: Tests pass on Windows, skipped on other platforms

**Step 3: Document platform differences**

Add to `docs/standards/runtime-protection.md`:

```markdown
### Windows Platform Notes

- `renameSync` is not atomic when target file is locked
- Directory-level `fsync` silently fails
- Use `maxRetries` parameter in `atomicWriteJsonSyncWithRetry` for robustness
```

**Step 4: Commit**

```bash
git add tests/platform/windows-atomic-write.test.ts docs/standards/runtime-protection.md
git commit -m "test(platform): add Windows atomic write compatibility tests

Resolves TD-3: Windows platform compatibility validation"
```

---

## Task 4: Unify Atomic Write Protection (TD-4)

**Priority:** P2 - Consistency and safety

**Files:**
- Modify: `src/hooks/subagent-tracker/index.ts`

**Step 1: Replace immediate write with atomic write**

```typescript
// src/hooks/subagent-tracker/index.ts
import { atomicWriteJsonSyncWithRetry } from '../../lib/atomic-write';

// Replace this:
// writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");

// With this:
atomicWriteJsonSyncWithRetry(statePath, state);
```

**Step 2: Remove writeTrackingStateImmediate function**

Remove the `writeTrackingStateImmediate()` function entirely, replace all calls with `atomicWriteJsonSyncWithRetry`.

**Step 3: Run tests to verify no regressions**

Run: `npm test -- subagent-tracker`
Expected: All tests pass

**Step 4: Update difference documentation**

Remove D-07 from `docs/standards/runtime-protection.md` (no longer a difference).

**Step 5: Commit**

```bash
git add src/hooks/subagent-tracker/index.ts docs/standards/runtime-protection.md
git commit -m "refactor(hooks): unify atomic write protection in subagent-tracker

Resolves TD-4: Remove immediate write bypass, use atomic write consistently"
```

---

## Verification Checklist

After completing all tasks:

- [ ] All tests pass: `npm test`
- [ ] No TypeScript errors: `npm run build`
- [ ] No lint errors: `npm run lint`
- [ ] CI pipeline passes on GitHub Actions
- [ ] Documentation updated for all changes
- [ ] CHANGELOG.md includes all fixes

---

## Estimated Timeline

- Task 1 (P0): 30 minutes
- Task 2 (P1): 1 hour
- Task 3 (P1): 2 hours
- Task 4 (P2): 1 hour

**Total:** ~4.5 hours
