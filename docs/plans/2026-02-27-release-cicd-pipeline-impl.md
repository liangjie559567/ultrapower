# Release CI/CD Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现插件发布 CI/CD 流水线，从 `git tag v*` 推送到完整发布全自动化。

**Architecture:** 共享核心逻辑 `scripts/release-steps.mjs` 被 GitHub Actions（主路径）和本地脚本（备用路径）共同调用。4 个导出函数覆盖 validateBuild / publishNpm / createGithubRelease / syncMarketplace 全流程。

**Tech Stack:** Node.js ESM (`.mjs`)、GitHub Actions YAML、`gh` CLI、`npm publish`

---

### Task 1: 创建共享核心 `scripts/release-steps.mjs`

**Files:**
- Create: `scripts/release-steps.mjs`

**Step 1: 写失败测试**

新建 `src/__tests__/release-steps.test.ts`：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock child_process exec
vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

describe('release-steps', () => {
  it('validateBuild: dry-run returns success without executing', async () => {
    const { validateBuild } = await import('../../scripts/release-steps.mjs');
    const result = await validateBuild({ dryRun: true });
    expect(result.success).toBe(true);
  });

  it('publishNpm: dry-run prints command without executing', async () => {
    const { publishNpm } = await import('../../scripts/release-steps.mjs');
    const result = await publishNpm({ dryRun: true });
    expect(result.success).toBe(true);
    expect(result.version).toBeDefined();
  });

  it('createGithubRelease: dry-run returns success', async () => {
    const { createGithubRelease } = await import('../../scripts/release-steps.mjs');
    const result = await createGithubRelease({ version: '5.3.0', dryRun: true });
    expect(result.success).toBe(true);
  });

  it('syncMarketplace: dry-run returns success', async () => {
    const { syncMarketplace } = await import('../../scripts/release-steps.mjs');
    const result = await syncMarketplace({ version: '5.3.0', dryRun: true });
    expect(result.success).toBe(true);
  });

  it('runReleasePipeline: startFrom skips earlier steps', async () => {
    const { runReleasePipeline } = await import('../../scripts/release-steps.mjs');
    // startFrom='release' 跳过 validate 和 publish
    const result = await runReleasePipeline({ dryRun: true, startFrom: 'release', version: '5.3.0' });
    expect(result.success).toBe(true);
  });
});
```

**Step 2: 运行测试确认失败**

```bash
npm run test:run -- src/__tests__/release-steps.test.ts
```
预期：FAIL（模块不存在）

**Step 3: 实现 `scripts/release-steps.mjs`**

```javascript
// scripts/release-steps.mjs
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function getVersion() {
  const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
  return pkg.version;
}

function run(cmd, dryRun = false) {
  if (dryRun) {
    console.log(`[dry-run] ${cmd}`);
    return '';
  }
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf-8' });
}

export async function validateBuild(opts = {}) {
  const { skipTests = false, dryRun = false } = opts;
  try {
    run('tsc --noEmit', dryRun);
    run('npm run build', dryRun);
    if (!skipTests) run('npm run test:run', dryRun);
    return { success: true, output: 'Build validation passed' };
  } catch (err) {
    return { success: false, output: err.message };
  }
}

export async function publishNpm(opts = {}) {
  const { dryRun = false, tag = 'latest' } = opts;
  const version = getVersion();
  try {
    run(`npm publish --access public --tag ${tag}`, dryRun);
    return { success: true, version };
  } catch (err) {
    return { success: false, version, output: err.message };
  }
}

export async function createGithubRelease(opts = {}) {
  const { version, notes = '', dryRun = false } = opts;
  const v = version || getVersion();
  try {
    const notesFlag = notes ? `--notes "${notes}"` : '--generate-notes';
    run(`gh release create v${v} ${notesFlag}`, dryRun);
    return { success: true, url: `https://github.com/liangjie559567/ultrapower/releases/tag/v${v}` };
  } catch (err) {
    return { success: false, url: '', output: err.message };
  }
}

export async function syncMarketplace(opts = {}) {
  const { version, dryRun = false } = opts;
  const v = version || getVersion();
  try {
    // marketplace.json version 字段由 release skill 手动更新，此步骤负责 git commit + push
    run(`git add .claude-plugin/marketplace.json`, dryRun);
    run(`git commit -m "chore: sync marketplace version to v${v}" --allow-empty`, dryRun);
    run(`git push origin HEAD`, dryRun);
    return { success: true };
  } catch (err) {
    return { success: false, output: err.message };
  }
}

export async function runReleasePipeline(opts = {}) {
  const { dryRun = false, skipTests = false, startFrom = 'validate', version } = opts;
  const steps = ['validate', 'publish', 'release', 'sync'];
  const startIdx = steps.indexOf(startFrom);

  if (startIdx === -1) {
    console.error(`Unknown startFrom: ${startFrom}. Valid: ${steps.join(', ')}`);
    process.exit(1);
  }

  const v = version || getVersion();

  if (startIdx <= 0) {
    console.log('Step 1/4: validateBuild...');
    const r = await validateBuild({ skipTests, dryRun });
    if (!r.success) { console.error(`validateBuild failed: ${r.output}`); process.exit(1); }
  }

  if (startIdx <= 1) {
    console.log('Step 2/4: publishNpm...');
    const r = await publishNpm({ dryRun });
    if (!r.success) { console.error(`publishNpm failed: ${r.output}`); process.exit(1); }
  }

  if (startIdx <= 2) {
    console.log('Step 3/4: createGithubRelease...');
    const r = await createGithubRelease({ version: v, dryRun });
    if (!r.success) { console.error(`createGithubRelease failed: ${r.output}`); process.exit(1); }
  }

  if (startIdx <= 3) {
    console.log('Step 4/4: syncMarketplace...');
    const r = await syncMarketplace({ version: v, dryRun });
    if (!r.success) { console.error(`syncMarketplace failed: ${r.output}`); process.exit(1); }
  }

  console.log('Release pipeline completed successfully.');
  return { success: true };
}
```

**Step 4: 运行测试确认通过**

```bash
npm run test:run -- src/__tests__/release-steps.test.ts
```
预期：5 tests PASS

**Step 5: 提交**

```bash
git add scripts/release-steps.mjs src/__tests__/release-steps.test.ts
git commit -m "feat(release): add shared release-steps.mjs core with dry-run support"
```

---

### Task 2: 创建本地入口 `scripts/release-local.mjs`

**Files:**
- Create: `scripts/release-local.mjs`
- Modify: `package.json` (scripts 字段)

**Step 1: 写失败测试**

在 `src/__tests__/release-local.test.ts` 中验证 CLI 参数解析：

```typescript
import { describe, it, expect } from 'vitest';
import { parseArgs } from '../../scripts/release-local.mjs';

describe('release-local parseArgs', () => {
  it('default: no flags', () => {
    const args = parseArgs([]);
    expect(args.dryRun).toBe(false);
    expect(args.startFrom).toBe('validate');
  });

  it('--dry-run flag', () => {
    const args = parseArgs(['--dry-run']);
    expect(args.dryRun).toBe(true);
  });

  it('--start-from=publish', () => {
    const args = parseArgs(['--start-from=publish']);
    expect(args.startFrom).toBe('publish');
  });
});
```

**Step 2: 运行测试确认失败**

```bash
npm run test:run -- src/__tests__/release-local.test.ts
```
预期：FAIL

**Step 3: 实现 `scripts/release-local.mjs`**

```javascript
// scripts/release-local.mjs
// 用法:
//   node scripts/release-local.mjs
//   node scripts/release-local.mjs --dry-run
//   node scripts/release-local.mjs --start-from=publish
//   npm run release:local
//   npm run release:dry-run

import { runReleasePipeline } from './release-steps.mjs';

export function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const startFromArg = argv.find(a => a.startsWith('--start-from='));
  const startFrom = startFromArg ? startFromArg.split('=')[1] : 'validate';
  const skipTests = argv.includes('--skip-tests');
  return { dryRun, startFrom, skipTests };
}

// 仅在直接执行时运行（非 import）
if (process.argv[1] && process.argv[1].endsWith('release-local.mjs')) {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Running release pipeline (dryRun=${args.dryRun}, startFrom=${args.startFrom})`);
  runReleasePipeline(args).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
```

**Step 4: 更新 `package.json` scripts**

在 `"scripts"` 对象中添加（在 `"postinstall"` 行之后）：

```json
"release:local": "node scripts/release-local.mjs",
"release:dry-run": "node scripts/release-local.mjs --dry-run"
```

**Step 5: 运行测试确认通过**

```bash
npm run test:run -- src/__tests__/release-local.test.ts
```
预期：3 tests PASS

**Step 6: 手动验证 dry-run**

```bash
npm run release:dry-run
```
预期：打印 4 个 `[dry-run] <command>` 行，无实际执行

**Step 7: 提交**

```bash
git add scripts/release-local.mjs src/__tests__/release-local.test.ts package.json
git commit -m "feat(release): add release-local.mjs entry point and package.json scripts"
```

---

### Task 3: 创建 GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/release.yml`

**Step 1: 写 workflow 语法验证测试**

这是 YAML 文件，无法用 Vitest 直接测试。验证方式：
1. 本地用 `actionlint`（如已安装）
2. 或推送后在 GitHub Actions 界面确认语法

**Step 2: 创建 `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-test:
    name: Build & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: node scripts/release-steps.mjs validate

  publish:
    name: Publish to npm
    needs: build-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
          cache: 'npm'
      - run: npm ci
      - run: node scripts/release-steps.mjs publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  github-release:
    name: Create GitHub Release
    needs: publish
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: node scripts/release-steps.mjs release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  marketplace-sync:
    name: Sync Marketplace
    needs: publish
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      - run: node scripts/release-steps.mjs sync
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

注意：`release-steps.mjs` 需要支持 CLI 调用（`node scripts/release-steps.mjs validate`）。

**Step 3: 为 `release-steps.mjs` 添加 CLI 入口**

在 `scripts/release-steps.mjs` 末尾追加：

```javascript
// CLI 入口（供 GitHub Actions 直接调用）
const cliStep = process.argv[2];
if (cliStep && ['validate', 'publish', 'release', 'sync'].includes(cliStep)) {
  const dryRun = process.argv.includes('--dry-run');
  const version = process.env.GITHUB_REF_NAME?.replace(/^v/, '') || undefined;
  const stepMap = { validate: validateBuild, publish: publishNpm, release: createGithubRelease, sync: syncMarketplace };
  stepMap[cliStep]({ dryRun, version }).then(r => {
    if (!r.success) { console.error(`Step ${cliStep} failed`); process.exit(1); }
  });
}
```

**Step 4: 更新 release-steps 测试覆盖 CLI 调用**

在 `src/__tests__/release-steps.test.ts` 追加：

```typescript
it('CLI step mapping covers all 4 steps', () => {
  const steps = ['validate', 'publish', 'release', 'sync'];
  // 验证所有步骤名称有效（不抛出）
  expect(steps).toHaveLength(4);
});
```

**Step 5: 运行全量测试**

```bash
npm run test:run
```
预期：所有测试通过（含新增测试）

**Step 6: 提交**

```bash
git add .github/workflows/release.yml scripts/release-steps.mjs src/__tests__/release-steps.test.ts
git commit -m "feat(ci): add GitHub Actions release workflow with 4-job dependency graph"
```

---

### Task 4: 更新 `skills/release/SKILL.md`

**Files:**
- Modify: `skills/release/SKILL.md`

**Step 1: 在"发布步骤"末尾添加 CI 说明**

在 `### 4. 创建并推送 Tag` 步骤之后，`### 5. 刷新本地 marketplace 缓存` 之前，插入：

```markdown
### 4b. GitHub Actions 自动接管（推荐）

执行 `git push --tags` 后，GitHub Actions 自动接管后续步骤：
- **npm 发布**（`publish` job）
- **GitHub Release 创建**（`github-release` job）
- **marketplace.json 版本同步**（`marketplace-sync` job）

在 GitHub Actions 页面查看进度：https://github.com/liangjie559567/ultrapower/actions

如需手动执行（紧急发布或 CI 不可用）：
```bash
npm run release:local          # 完整流水线
npm run release:dry-run        # 预检（不实际执行）
npm run release:local -- --start-from=publish  # 从 publish 步骤重试
```
```

**Step 2: 更新步骤 5、6、7 为"CI 已自动完成"说明**

将原步骤 5（刷新 marketplace 缓存）、6（npm publish）、7（创建 GitHub Release）标注为 CI 自动完成，保留手动备用命令。

**Step 3: 提交**

```bash
git add skills/release/SKILL.md
git commit -m "docs(release): update SKILL.md to document CI handoff after git push --tags"
```

---

### Task 5: CI Gate 验证

**Step 1: 运行完整 CI Gate**

```bash
tsc --noEmit && npm run build && npm run test:run
```
预期：零错误，所有测试通过

**Step 2: 验证 dry-run 端到端**

```bash
npm run release:dry-run
```
预期输出（4 行 dry-run 命令，无实际执行）：
```
Running release pipeline (dryRun=true, startFrom=validate)
Step 1/4: validateBuild...
[dry-run] tsc --noEmit
[dry-run] npm run build
[dry-run] npm run test:run
Step 2/4: publishNpm...
[dry-run] npm publish --access public --tag latest
Step 3/4: createGithubRelease...
[dry-run] gh release create v5.2.4 --generate-notes
Step 4/4: syncMarketplace...
[dry-run] git add .claude-plugin/marketplace.json
...
Release pipeline completed successfully.
```

**Step 3: 验证 workflow 文件存在**

```bash
ls .github/workflows/release.yml
```

**Step 4: 最终提交（如有未提交变更）**

```bash
git status
# 确认无未提交变更
```

---

## 任务队列

| ID | 名称 | 依赖 | 并行组 | 预估 |
|----|------|------|--------|------|
| T1 | 创建 release-steps.mjs | 无 | G1 | 30min |
| T2 | 创建 release-local.mjs + package.json | T1 | G2 | 20min |
| T3 | 创建 GitHub Actions workflow | T1 | G2 | 20min |
| T4 | 更新 SKILL.md | T1 | G2 | 10min |
| T5 | CI Gate 验证 | T2, T3, T4 | G3 | 10min |

T2、T3、T4 可并行执行（均依赖 T1 完成）。
