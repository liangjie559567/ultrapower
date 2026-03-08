---
description: 代码模式库 - 存储可复用的代码模式和模板
version: 1.0
last_updated: 2026-03-08
---

# Pattern Library (代码模式库)

本文件存储从项目中识别出的可复用代码模式。

## 1. 模式索引 (Pattern Index)

| ID | Name | Category | Occurrences | Confidence | Status |
|----|------|----------|-------------|------------|--------|
| P-001 | Markdown Workflow Pattern | workflow-def | 5 | 0.9 | active |
| P-002 | assertValidMode() Guard Pattern | security | 1 | 0.95 | pending |
| P-003 | Multi-Expert Parallel Review Pattern | workflow-def | 1 | 0.9 | pending |
| P-004 | Case-Sensitivity Anti-Pattern in String Comparisons | debugging | 2 | 0.95 | pending |
| P-005 | Plugin Registry Path Drift Anti-Pattern | tooling | 1 | 0.9 | pending |
| P-006 | Two-Pass Tech Debt Scanning | workflow-def | 1 | 0.9 | pending |
| P-007 | Circular Dependency via Parameter Passing | architecture | 1 | 0.95 | pending |
| P-008 | Backup-Before-Delete Convention (.bak suffix) | workflow | 1 | 0.9 | pending |
| P-009 | omc install Flag Validation (no --refresh-hooks) | tooling | 1 | 0.95 | active |
| P-010 | deepinit AGENTS.md Exclusion from Agent Definition Loaders | workflow-def | 1 | 0.95 | active |
| P-011 | Windows Bash Hook Path: Shell Syntax Mismatch Anti-Pattern | platform | 1 | 0.95 | pending |
| P-012 | Block-First-with-Fallback Format Parser | architecture | 1 | 0.9 | pending |
| P-013 | GitHub Actions CI Permission and Secret Configuration Anti-Pattern | ci-cd | 2 | 0.95 | active |
| P-014 | Documentation Automation Script Pattern | workflow-def | 1 | 0.95 | pending |
| P-015 | Priority-Driven Task Execution Pattern | workflow-def | 1 | 0.9 | pending |
| P-016 | Agent Model Parameter Routing (not suffix variants) | architecture | 1 | 0.95 | pending |

## 2. 模式分类 (Categories)

| Category | Description | Count |
|----------|-------------|-------|
| workflow-def | 工作流定义模式 | 6 |
| data-layer | 数据层模式 | 0 |
| ui-layer | UI 层模式 | 0 |
| business-logic | 业务逻辑模式 | 0 |
| tooling | 工具使用反模式 | 2 |
| security | 安全防护模式 | 1 |
| debugging | 调试反模式 | 1 |
| architecture | 架构设计模式 | 2 |
| platform | 平台兼容性反模式 | 1 |
| ci-cd | CI/CD 配置反模式 | 1 |

---

## 3. 模式详情 (Pattern Details)

### P-001: Markdown Workflow Pattern

**Category**: workflow-def  
**Occurrences**: 5 (start.md, feature-flow.md, analyze-error.md, evolve.md, reflect.md)  
**Confidence**: 0.9  
**First Seen**: 2026-02-08  
**Files**: `.agent/workflows/*.md`

**Description**:
> 使用 Markdown 定义原子工作流，包含 Trigger, Steps 和 Output Format 三要素。

**Template**:
```markdown
---
description: [Short Description]
---

# /command - [Workflow Name]

## Trigger
- 用户输入 `/command`

## Steps
// turbo (if auto-run)
1. Step 1...
2. Step 2...

## Output Format
(Template)
```


**Usage**:
```dart
final data = await repository.getWithCache('user_profile', () => api.fetchProfile());
```

### P-002: assertValidMode() Guard Pattern

**Category**: security
**Occurrences**: 1 (src/lib/validateMode.ts)
**Confidence**: 0.95
**First Seen**: 2026-02-26
**Status**: pending (需要 3 次出现才能提升为 active)

**Description**:
> 所有使用 mode 参数构建文件路径的代码，必须先调用 assertValidMode()。validateMode() 返回 boolean，assertValidMode() 抛出异常。测试需覆盖非字符串类型（null/undefined/number/array）。

**Template**:
```typescript
// ❌ 错误：直接使用 mode 构建路径
const path = `.omc/state/${mode}-state.json`;

// ✅ 正确：先验证再使用
assertValidMode(mode); // 抛出异常而非返回 false
const path = `.omc/state/${mode}-state.json`;
```

**Related**: AP-S01, k-030

---

### P-003: Multi-Expert Parallel Review Pattern

**Category**: workflow-def
**Occurrences**: 1 (ax-review workflow)
**Confidence**: 0.9
**First Seen**: 2026-02-26
**Status**: pending

**Description**:
> 5 个专家角色（UX/Product/Domain/Tech/Critic）并行评审同一 PRD，各自输出独立报告，再由聚合器进行冲突仲裁。发现差异点数量远超单一评审者。

**Template**:
```
ax-review workflow:
  parallel: [axiom-ux-director, axiom-product-director, axiom-domain-expert, axiom-tech-lead, axiom-critic]
  aggregate: axiom-review-aggregator
  output: rough_prd.md + diff_list.md
```

**Related**: LQ-001, k-029

---

### P-004: Case-Sensitivity Anti-Pattern in String Comparisons

**Category**: debugging
**Occurrences**: 2 (usage-tracker.ts extractSkillName — k-039 + k-044)
**Confidence**: 0.95
**First Seen**: 2026-02-27
**Status**: pending (需要 3 次出现才能提升为 active)

**Description**:
> 在同一函数中对 toolName 进行字符串比较时，未统一大小写，导致大写输入（如 `"Skill"`）无法匹配小写字面量（如 `'skill'`）。同一函数出现两次相同 bug（k-039: `=== 'Task'` 漏掉 Skill，k-044: `=== 'skill'` 大小写不匹配）。

**Template**:
```typescript
// ❌ 错误：直接比较，大小写敏感
if (toolName === 'skill') { ... }

// ✅ 正确：先 toLowerCase() 再比较
if (toolName.toLowerCase() === 'skill') { ... }

// ✅ 最佳实践：在函数入口统一规范化
const normalizedToolName = toolName.toLowerCase();
if (normalizedToolName === 'skill' || normalizedToolName === 'task') { ... }
```

**Related**: k-039, k-044, LQ-012

---

### P-005: Plugin Registry Path Drift Anti-Pattern

**Category**: tooling
**Occurrences**: 1 (installed_plugins.json — k-046)
**Confidence**: 0.9
**First Seen**: 2026-02-27
**Status**: pending (需要 3 次出现才能提升为 active)

**Description**:
> 本地开发安装插件后，`installed_plugins.json` 中的 `installPath` 可能仍指向旧 npm 缓存路径（如 v5.0.23），而非当前本地开发目录。导致 hook 文件 MODULE_NOT_FOUND。根因：`omc-setup` 未包含注册表同步步骤。

**Template**:
```json
// ❌ 错误：installPath 指向旧 npm 缓存
{
  "installPath": "~/.claude/plugins/cache/ultrapower/ultrapower/5.0.23",
  "version": "5.0.23"
}

// ✅ 正确：installPath 指向本地开发目录，version 同步
{
  "installPath": "/path/to/local/ultrapower",
  "version": "5.2.1"
}
```

**Prevention**: `omc-setup` 应在本地开发安装后自动同步 `installed_plugins.json`。

**Related**: k-046, LQ-014

### P-007: Circular Dependency via Parameter Passing

**Category**: architecture
**Occurrences**: 1 (src/lib/plugin-registry.ts — k-050)
**Confidence**: 0.95
**First Seen**: 2026-02-27
**Status**: pending (需要 3 次出现才能提升为 active)

**Description**:
> 当新模块 A 需要调用模块 B 的判断逻辑，但 B 已 import A（或 B 的依赖链包含 A）时，不能在 A 中 import B。解决方案：将判断结果作为参数传入，由调用方在调用前判断并传入。文件顶部加注释说明禁止 import 的原因，防止未来误加。

**Template**:
```typescript
// ❌ 错误：A import B，但 B 已 import A → 循环依赖
// plugin-registry.ts
import { isProjectScopedPlugin } from './auto-update.js'; // FORBIDDEN

// ✅ 正确：将判断结果作为参数传入
// plugin-registry.ts
// IMPORTANT: Do NOT import auto-update.ts or installer/index.ts (circular dep)
export function syncPluginRegistry(options: { skipIfProjectScoped?: boolean }) {
  if (options.skipIfProjectScoped) return { skipped: true };
  // ...
}

// auto-update.ts（调用方）
import { syncPluginRegistry } from '../lib/plugin-registry.js';
syncPluginRegistry({ skipIfProjectScoped: isProjectScopedPlugin() });
```

**Related**: k-050, LQ-018

---

### P-010: deepinit AGENTS.md Exclusion from Agent Definition Loaders

**Category**: workflow-def
**Occurrences**: 1 (src/__tests__/installer.test.ts:39 — k-056)
**Confidence**: 0.95
**First Seen**: 2026-02-27
**Status**: active

**Description**:
> `deepinit` 在 `agents/` 目录下生成 `AGENTS.md` 作为目录文档（无 `name:` frontmatter）。任何读取该目录下所有 `.md` 文件的加载器，必须明确排除 `AGENTS.md`，否则会因 `nameMatch` 为 null 导致测试失败或运行时错误。

**Template**:
```typescript
// ❌ 错误：读取所有 .md 文件，包含 deepinit 生成的 AGENTS.md
for (const file of readdirSync(agentsDir)) {
  if (file.endsWith('.md')) {
    definitions[file] = readFileSync(join(agentsDir, file), 'utf-8');
  }
}

// ✅ 正确：明确排除 AGENTS.md 目录文档
for (const file of readdirSync(agentsDir)) {
  if (file.endsWith('.md') && file !== 'AGENTS.md') {
    definitions[file] = readFileSync(join(agentsDir, file), 'utf-8');
  }
}
```

**Root Cause**: deepinit 生成的目录文档与 agent 定义文件共存于同一目录，加载器必须明确排除非 agent 文件。

**Related**: k-056, LQ-024

---

### P-011: Windows Bash Hook Path: Shell Syntax Mismatch Anti-Pattern

**Category**: platform
**Occurrences**: 1 (src/installer/hooks.ts — k-057)
**Confidence**: 0.95
**First Seen**: 2026-02-27
**Status**: pending (需要 3 次出现才能提升为 active)

**Description**:
> Claude Code 在 Windows 上通过 bash（Git Bash/WSL）运行 hooks，而非 cmd.exe。`%USERPROFILE%`（cmd.exe 语法）在 bash 中不展开，只有 `$USERPROFILE`（bash 语法）才正确。任何生成 hook 命令路径的代码，必须使用 bash 语法，并使用正斜杠。

**Template**:
```typescript
// ❌ 错误：使用 cmd.exe 语法，bash 不展开
const hookCmd = `node "%USERPROFILE%/.claude/hooks/my-hook.mjs"`;

// ✅ 正确：使用 bash 语法，正斜杠
const hookCmd = `node "$USERPROFILE/.claude/hooks/my-hook.mjs"`;

// ✅ getHomeEnvVar() 正确实现
function getHomeEnvVar(): string {
  return process.platform === 'win32' ? '$USERPROFILE' : '$HOME';
}
```

**Prevention**: 已安装用户的 `settings.json` 不会自动更新，`omc-setup` 应包含 hooks 路径格式检查步骤。

**Related**: k-057, LQ-025

---

## 4. 模式匹配规则 (Detection Rules)

> 定义如何自动检测代码中的模式

### 规则格式
```yaml
pattern_id: P-xxx
triggers:
  - keyword: "getWithCache"
  - structure: "class.*Repository.*_cache"
min_occurrences: 3
```

---

## 5. 待验证模式 (Pending Patterns)

> 出现次数不足，暂未提升为正式模式

| ID | Name | Occurrences | Notes |
|----|------|-------------|-------|
| - | - | - | 暂无 |


### P-014: Documentation Automation Script Pattern

**Category**: workflow-def
**Occurrences**: 1 (scripts/sync-version.mjs, validate-counts.mjs, check-links.mjs)
**Confidence**: 0.95
**First Seen**: 2026-03-08
**Status**: pending (需要 3 次出现才能提升为 active)

**Description**:
> 创建自动化脚本防止文档漂移，包含 dry-run 模式和 fix 模式。脚本从源代码读取真实数据，与文档声明对比，自动修复差异。

**Template**:
```javascript
// scripts/sync-version.mjs
import { readFileSync, writeFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const version = pkg.version;

const files = [
  'README.md',
  'docs/CLAUDE.md',
  '.claude-plugin/plugin.json',
  // ...
];

const dryRun = process.argv.includes('--dry-run');

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  const updated = content.replace(/version: \d+\.\d+\.\d+/g, `version: ${version}`);
  
  if (dryRun) {
    console.log(`[DRY-RUN] Would update ${file}`);
  } else {
    writeFileSync(file, updated);
    console.log(`Updated ${file}`);
  }
}
```

**npm 脚本配置**:
```json
{
  "sync:version": "node scripts/sync-version.mjs",
  "sync:version:dry": "node scripts/sync-version.mjs --dry-run",
  "validate:counts": "node scripts/validate-counts.mjs",
  "validate:counts:fix": "node scripts/validate-counts.mjs --fix"
}
```

**Related**: k-077, k-078

---

### P-015: Priority-Driven Task Execution Pattern

**Category**: workflow-def
**Occurrences**: 1 (v5.5.34 session)
**Confidence**: 0.9
**First Seen**: 2026-03-08
**Status**: pending (需要 3 次出现才能提升为 active)

**Description**:
> 将任务按优先级分层（P0/P1/P2/P3），优先完成阻塞性任务，确保关键路径不被延误。P0 完成前不开始 P1，P1 完成前不开始 P2/P3。

**Template**:
```
P0 (Critical - 阻塞发布):
  - 版本同步
  - 构建修复
  - 关键 bug 修复

P1 (High - 防止未来问题):
  - 自动化脚本
  - 测试覆盖
  - CI/CD 改进

P2 (Medium - 用户体验):
  - 文档改进
  - 快速入门指南
  - 错误信息优化

P3 (Low - 长期价值):
  - 架构文档
  - 最佳实践
  - 性能优化
```

**执行顺序**:
1. 完成所有 P0 任务
2. 完成所有 P1 任务
3. P2/P3 可并行执行
4. 时间不足时，P3 延后

**Related**: k-079, k-072

---


### P-016: Agent Model Parameter Routing (not suffix variants)

**Category**: architecture
**Occurrences**: 1 (docs/shared/agent-tiers.md, docs/partials/agent-tiers.md)
**Confidence**: 0.95
**First Seen**: 2026-03-08
**Status**: pending (需要 3 次出现才能提升为 active)

**Description**:
> Agent 架构使用统一 agent 名称 + `model` 参数路由到不同模型层级，而非 `-low/-medium/-high` 后缀变体。文档声明后缀变体会误导用户调用不存在的 agent。

**Template**:
```typescript
// ❌ 错误：使用不存在的后缀变体
Task(subagent_type="ultrapower:executor-low", prompt="...")
Task(subagent_type="ultrapower:executor-medium", prompt="...")
Task(subagent_type="ultrapower:executor-high", prompt="...")

// ✅ 正确：统一 agent + model 参数
Task(subagent_type="ultrapower:executor", model="haiku", prompt="...")
Task(subagent_type="ultrapower:executor", model="sonnet", prompt="...")
Task(subagent_type="ultrapower:executor", model="opus", prompt="...")
```

**模型选择指南**:
- **haiku**: 快速查找、轻量扫描、简单修复
- **sonnet**: 标准实现、调试、审查
- **opus**: 架构设计、深度分析、复杂重构

**文档修复**:
- 移除所有 `-low/-medium/-high` 后缀变体说明
- 更新为 `model` 参数架构
- 简化 agent 工具矩阵

**Related**: k-080, k-001, k-005

---

