---
description: 知识图谱索引 - 管理所有知识条目的元信息
schema_version: 2
version: 1.0
last_updated: 2026-03-05
entries: 77
cycle: 18
---

# Knowledge Base (知识图谱索引)

本文件是知识系统的中央索引，记录所有知识条目的元信息。

## 1. 索引表 (Knowledge Index)

| ID | Title | Category | Confidence | Created | Status |
|----|-------|----------|------------|---------|--------|
| k-039 | Skill Tracking Gap in extractSkillName (skill 追踪缺口) | debugging | 0.95 | 2026-02-27 | active |
| k-040 | Empty toolName Records as Noise in usage_metrics (空工具名噪音) | tooling | 0.9 | 2026-02-27 | active |
| k-041 | nexus toolCalls Hardcoded Empty Array (nexus 工具调用数据缺失) | architecture | 0.9 | 2026-02-27 | active |
| k-001 | Global Configuration Pattern (全局配置模式) | architecture | 0.9 | 2026-02-08 | active |
| k-002 | Evolution Engine Architecture (自进化引擎架构) | architecture | 0.85 | 2026-02-08 | active |
| k-003 | GitHub Automation Fallback Strategy (GitHub 自动化降级策略) | tooling | 0.8 | 2026-02-08 | active |
| k-004 | Context Completeness Pattern (上下文完整性模式) | architecture | 0.95 | 2026-02-08 | active |
| k-005 | Agent Native Orchestration (纯 Agent 编排) | architecture | 0.9 | 2026-02-09 | active |
| k-006 | Flutter Widget Lifecycle | architecture | 0.9 | 2026-02-09 | active |
| k-007 | Flutter State Management with Stacked | architecture | 0.9 | 2026-02-09 | active |
| k-008 | Flutter Navigation Best Practices | architecture | 0.85 | 2026-02-09 | active |
| k-009 | Flutter Performance Optimization | architecture | 0.85 | 2026-02-09 | active |
| k-010 | Flutter Testing Strategy | architecture | 0.8 | 2026-02-09 | active |
| k-011 | Flutter Error Handling Pattern | debugging | 0.85 | 2026-02-09 | active |
| k-012 | Flutter Theme and Styling | architecture | 0.8 | 2026-02-09 | active |
| k-013 | Flutter Responsive Layout | architecture | 0.8 | 2026-02-09 | active |
| k-014 | Flutter Localization (i18n) | tooling | 0.75 | 2026-02-09 | active |
| k-015 | Flutter Platform Channels | architecture | 0.75 | 2026-02-09 | active |
| k-016 | Dart Null Safety Patterns | architecture | 0.95 | 2026-02-09 | active |
| k-017 | Dart Async/Await Best Practices | architecture | 0.9 | 2026-02-09 | active |
| k-018 | Dart Extension Methods | pattern | 0.85 | 2026-02-09 | active |
| k-019 | Dart Freezed и Immutable Data | pattern | 0.85 | 2026-02-09 | active |
| k-020 | Dart Collection Operations | pattern | 0.85 | 2026-02-09 | active |
| k-021 | Git Commit Conventions | workflow | 0.95 | 2026-02-09 | active |
| k-022 | Code Review Checklist | workflow | 0.9 | 2026-02-09 | active |
| k-023 | Project Structure Convention | architecture | 0.85 | 2026-02-09 | active |
| k-024 | CI/CD Pipeline Best Practices | workflow | 0.8 | 2026-02-09 | active |
| k-025 | Documentation Standards | workflow | 0.8 | 2026-02-09 | active |
| k-026 | Codex CLI Best Practices (Windows) | tooling | 0.95 | 2026-02-12 | active |
| k-027 | Async Interaction Pattern (Turn-Based Resume) | pattern | 0.9 | 2026-02-12 | active |
| k-028 | Unique Artifact Injection Pattern | architecture | 0.95 | 2026-02-12 | active |
| k-029 | Axiom Full-Chain Workflow Validation | workflow | 0.9 | 2026-02-26 | active |
| k-030 | assertValidMode() Path Traversal Protection | security | 0.95 | 2026-02-26 | active |
| k-031 | Exclusive Modes Set (4 modes, not 2) | architecture | 0.9 | 2026-02-26 | active |
| k-032 | Atomic Write + Silent Failure Pattern (被动学习写入) | pattern | 0.95 | 2026-02-26 | active |
| k-033 | Promise.race Timer Leak Prevention | security | 0.95 | 2026-02-26 | active |
| k-034 | Regex Injection Prevention in Dynamic Patterns | security | 0.95 | 2026-02-26 | active |
| k-035 | Bounded Growth Collections (entry caps + key sanitization) | pattern | 0.9 | 2026-02-26 | active |
| k-036 | Release Skill Version File Checklist (CLAUDE.md missing) | workflow | 0.9 | 2026-02-27 | active |
| k-037 | Dynamic Version Reading Pattern (getRuntimePackageVersion) | pattern | 0.95 | 2026-02-27 | active |
| k-038 | Branch Lifecycle: Delete After Merge | workflow | 0.85 | 2026-02-27 | active |
| k-042 | nexus TS→Python Data Flow (事件→进化→自修改) | architecture | 0.95 | 2026-02-27 | active |
| k-043 | Empty Session Guard in session-reflector.ts | pattern | 0.95 | 2026-02-27 | active |
| k-044 | Case-Insensitive toolName Check in extractSkillName | debugging | 0.95 | 2026-02-27 | active |
| k-045 | gh pr merge --delete-branch Deletes Head Branch (dev) | workflow | 0.9 | 2026-02-27 | active |
| k-046 | Plugin Registry Version Drift (installed_plugins.json) | tooling | 0.9 | 2026-02-27 | active |
| k-047 | REFERENCE.md Dual Count Declaration Sync (TOC + body) | workflow | 0.9 | 2026-02-27 | active |
| k-048 | Two-Pass Tech Debt Scanning Strategy (技术债两轮扫描策略) | workflow | 0.9 | 2026-02-27 | active |
| k-049 | Extend Existing Class Before Calling (扩展现有类而非重造) | architecture | 0.9 | 2026-02-27 | active |
| k-050 | Circular Dep Prevention via Parameter Passing (循环依赖防护：参数传递模式) | architecture | 0.95 | 2026-02-27 | active |
| k-051 | Sub-PRD File Location Must Be Grep-Verified (Sub-PRD 函数位置需 grep 验证) | workflow | 0.9 | 2026-02-27 | active |
| k-052 | readFileSync Mock Call Count Awareness (mock 调用次数感知) | debugging | 0.9 | 2026-02-27 | active |
| k-053 | omc-doctor: curl-install vs plugin-install Migration Path | workflow | 0.95 | 2026-02-27 | active |
| k-054 | omc install --refresh-hooks Flag Does Not Exist | tooling | 0.95 | 2026-02-27 | active |
| k-055 | Backup Before Delete: .bak Directory Convention | workflow | 0.9 | 2026-02-27 | active |
| k-056 | deepinit AGENTS.md Must Be Excluded from Agent Definition Loaders | workflow | 0.95 | 2026-02-27 | active |
| k-057 | Windows Bash Hook Path: $USERPROFILE not %USERPROFILE% | platform | 0.95 | 2026-02-27 | active |
| k-058 | Plugin Cache Empty Dir: copyTemplatesToCache() Must Handle Empty Base | tooling | 0.95 | 2026-02-27 | active |
| k-059 | TypeScript+ESM @ts-ignore for .mjs Dynamic Import in .ts Tests | tooling | 0.95 | 2026-02-27 | active |
| k-060 | GitHub Actions 4-Job Dependency Graph (build-test→publish→parallel) | workflow | 0.9 | 2026-02-27 | active |
| k-061 | execSync Does Not Support windowsHide Option (only spawn/fork/exec do) | tooling | 0.95 | 2026-02-28 | active |
| k-062 | getRuntimePackageVersion() Returns 'unknown' String Requires Explicit Guard | debugging | 0.95 | 2026-02-28 | active |
| k-063 | Learning Queue Block Format: Block-First Parser with Table Fallback | pattern | 0.95 | 2026-03-02 | active |
| k-064 | Queue Archiver ID Deduplication (loadArchiveIds before append) | pattern | 0.9 | 2026-03-02 | active |
| k-065 | Archive Scroll-Window Retention: done > 10 triggers, keep newest 10 | architecture | 0.95 | 2026-03-02 | active |
| k-066 | actions/setup-node@v4 registry-url NODE_AUTH_TOKEN Override Behavior | tooling | 0.95 | 2026-03-02 | active |
| k-067 | GitHub Actions Default GITHUB_TOKEN Lacks contents:write Permission | workflow | 0.95 | 2026-03-02 | active |
| k-068 | Agent Timeout Protection Three-Layer Architecture | architecture | 0.9 | 2026-03-04 | active |
| k-069 | DFS Cycle Detection with Three-Color Marking | pattern | 0.9 | 2026-03-04 | active |
| k-070 | ESM Import Path Must Include .js Extension | tooling | 0.95 | 2026-03-04 | active |
| k-071 | Vitest Mock Completeness: Poll Loop Functions Must Be Mocked | testing | 0.95 | 2026-03-04 | active |
| k-072 | Release Workflow Standard Template (8-Step Checklist) | workflow | 0.95 | 2026-03-05 | active |
| k-073 | Git Stash Three-Step Pattern for Uncommitted Changes | workflow | 0.9 | 2026-03-05 | active |
| k-074 | Version Number Sync Checklist (8 Files) | workflow | 0.95 | 2026-03-05 | active |
| k-075 | CHANGELOG Prepend Pattern (Bash Command) | pattern | 0.95 | 2026-03-05 | active |
| k-076 | Git Lock File Pre-Check Pattern | workflow | 0.9 | 2026-03-05 | active |
| k-077 | CI Detached HEAD Test Pattern | testing | 0.95 | 2026-03-06 | active || k-078 | stdio Configuration Best Practice | tooling | 0.95 | 2026-03-06 | active || k-079 | Minimal Fix Principle (Surgical Approach) | pattern | 0.95 | 2026-03-06 | active |

## 2. 分类统计 (Category Stats)

| Category | Count | Description |
|----------|-------|-------------|
| architecture | 20 | 架构相关知识 |
| debugging | 6 | 调试技巧 |
| pattern | 9 | 代码模式 |
| workflow | 22 | 工作流相关 |
| tooling | 9 | 工具使用 |
| security | 3 | 安全相关知识 |
| platform | 1 | 平台兼容性 |
| testing | 1 | 测试相关知识 |


## 3. 标签云 (Tag Cloud)

> 使用频率: (tag: count)

- flutter: 10
- dart: 5
- memory: 2
- automation: 2
- config: 1
- axiom: 1
- gemini: 1
- evolution: 1
- modules: 1
- github: 1
- fallback: 1
- context: 1
- best-practice: 1
- architecture: 1
- orchestration: 1
- anti-pattern: 1
- widget: 1
- lifecycle: 1
- stacked: 1
- state-management: 1
- mvvm: 1
- navigation: 1
- routing: 1
- performance: 1
- optimization: 1
- testing: 1
- unit-test: 1
- widget-test: 1
- error-handling: 1
- exception: 1
- theme: 1
- ui: 1
- design-system: 1
- responsive: 1
- layout: 1
- adaptive: 1
- i18n: 1
- localization: 1
- l10n: 1
- platform-channel: 1
- native: 1
- ios: 1
- android: 1
- null-safety: 1
- type-system: 1
- async: 1
- future: 1
- stream: 1
- extension: 1
- utility: 1
- freezed: 1
- immutable: 1
- data-class: 1
- collections: 1
- list: 1
- map: 1
- git: 1
- commit: 1
- conventional-commits: 1
- code-review: 1
- quality: 1
- checklist: 1
- project-structure: 1
- clean-architecture: 1
- folder: 1
- ci-cd: 1
- github-actions: 1
- documentation: 1
- dartdoc: 1
- readme: 1

## 4. 知识质量管理

### 4.1 Confidence 分数说明
- `0.9+`: 高置信度，经过多次验证
- `0.7-0.9`: 中等置信度，单次成功经验
- `0.5-0.7`: 低置信度，需要更多验证
- `<0.5`: 待清理，可能已过时

### 4.2 清理规则
- Confidence < 0.5 且超过 30 天未使用 → 标记为 `deprecated`

---

## 5. 知识条目详情

### k-072: Release Workflow Standard Template (8-Step Checklist)

**分类**: workflow
**置信度**: 0.95
**创建时间**: 2026-03-05
**标签**: release, git, ci-cd, npm, github-actions

**描述**:
v5.5.14 发布流程标准化模板，包含完整的 8 步检查清单，适用于所有后续版本发布。

**适用场景**:
- npm 包版本发布
- GitHub Release 创建
- 多文件版本同步
- CI/CD 自动化发布

**关键步骤**:
1. **版本同步**（8 个文件必须同步）:
   - package.json
   - plugin.json
   - marketplace.json（两处 version 字段）
   - docs/CLAUDE.md（OMC:VERSION 注释）
   - CLAUDE.md（版本引用）
   - README.md（版本徽章）
   - src/installer/index.ts（VERSION 常量）

2. **测试验证**: `npm run test:run` 全部通过

3. **Git 提交**: `git commit -m "chore: bump version to X.Y.Z"`

4. **Tag 推送**: `git tag vX.Y.Z && git push origin main && git push origin vX.Y.Z`

5. **CI 监控三阶段**:
   - publish job（npm 发布）
   - github-release job（创建 Release）
   - marketplace-sync job（同步 marketplace.json）

6. **验证**:
   - npm: https://www.npmjs.com/package/@liangjie559567/ultrapower
   - GitHub: https://github.com/liangjie559567/ultrapower/releases

7. **dev→main 合并**: `git merge dev --no-ff`

8. **清理**: 删除临时分支、检查未提交更改

**注意事项**:
- marketplace.json 版本不同步会导致用户安装旧版本
- CI 自动接管 npm 发布，无需手动执行
- 遇到未提交更改使用 git stash 三步法（见 k-073）

**相关知识**: k-073, k-045, k-060, k-066, k-067

---

### k-073: Git Stash Three-Step Pattern for Uncommitted Changes

**分类**: workflow
**置信度**: 0.9
**创建时间**: 2026-03-05
**标签**: git, stash, workflow, branch-management

**描述**:
处理未提交更改的标准三步模式，确保操作可逆且不丢失工作内容。

**适用场景**:
- 分支切换前有未提交更改
- 合并前需要清理工作区
- 临时保存工作状态
- 需要在干净工作区执行操作

**标准流程**:
```bash
# Step 1: 暂存更改（带描述信息）
git stash push -m "描述性信息"

# Step 2: 执行操作（切换分支/合并/变基等）
git checkout main
git merge dev --no-ff
git push origin main

# Step 3: 恢复更改
git checkout dev
git stash pop
```

**优势**:
- 保留更改内容，操作可逆
- 支持描述信息，便于追溯
- 适用于所有 git 操作场景

**注意事项**:
- `stash pop` 可能产生冲突，需手动解决
- 使用 `git stash list` 查看所有 stash
- 使用 `git stash apply` 保留 stash 副本
- 避免长期依赖 stash，应及时提交

**实际案例**:
v5.5.14 发布时，dev→main 合并前遇到 `.omc/notepad.md` 未提交更改，使用此模式成功完成合并并恢复更改。

**相关知识**: k-072, k-021, k-038, k-045

### k-074: Version Number Sync Checklist (8 Files)

**分类**: workflow
**置信度**: 0.95
**创建时间**: 2026-03-05
**标签**: release, version, sync, checklist

**描述**:
多个 package.json 文件容易遗漏导致版本不一致。v5.5.15 发布时根目录 package.json 初次未更新，由 verifier 发现。

**完整检查清单**（8 个文件）:
1. package.json
2. packages/*/package.json（所有子包）
3. .claude-plugin/plugin.json
4. .claude-plugin/marketplace.json（两处 version 字段）
5. docs/CLAUDE.md（OMC:VERSION 注释）
6. CLAUDE.md（版本引用）
7. README.md（版本徽章）
8. src/installer/index.ts（VERSION 常量）

**自动化方案**:
创建 scripts/check-version-sync.sh 脚本自动验证版本一致性。

**相关知识**: k-072, k-036, k-037

---

### k-075: CHANGELOG Prepend Pattern (Bash Command)

**分类**: pattern
**置信度**: 0.95
**创建时间**: 2026-03-05
**标签**: changelog, file-operation, bash, atomic-write

**描述**:
Write 工具会覆盖整个文件，不适合 CHANGELOG 更新。使用 bash 命令实现前置插入。

**标准命令**:
```bash
{ echo "新内容"; cat 原文件; } > 临时文件 && mv 临时文件 原文件
```

**适用场景**:
- CHANGELOG.md 更新
- 任何需要在文件开头插入内容的场景

**关键点**:
- 使用临时文件避免数据丢失
- 确保原子性操作（&& 连接符）
- 适用于所有文本文件

**相关知识**: k-072, k-032

---

### k-076: Git Lock File Pre-Check Pattern

**分类**: workflow
**置信度**: 0.9
**创建时间**: 2026-03-05
**标签**: git, lock-file, error-prevention

**描述**:
.git/index.lock 残留导致 git 操作失败。v5.5.15 发布时遇到此问题。

**预检查命令**:
```bash
[ -f .git/index.lock ] && rm .git/index.lock
```

**适用场景**:
- git commit
- git checkout
- git merge
- 所有修改索引的 git 操作

**错误信息**:
```
error: Unable to create '.git/index.lock': File exists
```

**根因**:
git 操作被中断（Ctrl+C、进程崩溃）导致锁文件残留。

**相关知识**: k-072, k-021

---

## k-077: CI Detached HEAD Test Pattern
**Category**: testing
**Confidence**: 0.95
**Created**: 2026-03-06
**Status**: active
**Source**: LQ-059

### Problem
CI 在 tag checkout 时处于 detached HEAD 状态，`getCurrentBranch()` 返回 null，导致测试失败。

### Solution
测试断言需要处理 null 值：
```typescript
expect(branch === null || typeof branch === 'string').toBe(true);
```

### Context
- 本地测试在分支上运行（branch 有值）
- CI 测试在 tag 上运行（branch 为 null）
- 两者环境不同，测试需要兼容

### Applicability
所有涉及 git 状态的测试（分支、提交、状态检查）

---


## k-078: stdio Configuration Best Practice
**Category**: tooling
**Confidence**: 0.95
**Created**: 2026-03-06
**Status**: active
**Source**: LQ-060

### Problem
`execSync` 的 `stdio: 'pipe'` 捕获 stderr，当 stderr 有内容时抛出异常（即使退出码为 0）。

### Solution
对于验证步骤使用 `stdio: 'inherit'`：
```typescript
execSync(cmd, { stdio: 'inherit', encoding: 'utf-8' });
```

### Context
- `stdio: 'pipe'` 适合需要捕获输出的场景
- `stdio: 'inherit'` 适合验证步骤，容忍 stderr 警告
- Release workflow 中测试命令应使用 inherit

### Applicability
所有 CI 验证步骤、测试命令、构建命令

---


## k-079: Minimal Fix Principle (Surgical Approach)
**Category**: pattern
**Confidence**: 0.95
**Created**: 2026-03-06
**Status**: active
**Source**: LQ-061

### Problem
过度修复引入新 bug，增加代码审查负担。

### Solution
只改必要代码：
- release-steps.mjs: 1 行（stdio 配置）
- git-utils.test.ts: 5 行（测试断言）

### Context
- 定位问题 → 最小化修复 → 验证 → 提交
- 降低风险、易于审查、回滚成本低

### Applicability
所有 bug 修复、紧急修复、生产环境修复

---

