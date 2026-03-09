# 贡献规范

> **ultrapower-version**: 5.5.5
> **优先级**: P1（推荐遵守）
> **真理之源**: `docs/standards/audit-report.md`
> **覆盖范围**: T-10（贡献者工作流 + 质量门禁）

---

## 目录

1. [贡献前准备](#1-贡献前准备)
2. [分支策略](#2-分支策略)
3. [代码规范](#3-代码规范)
4. [质量门禁](#4-质量门禁)
5. [文档更新要求](#5-文档更新要求)
6. [PR 提交流程](#6-pr-提交流程)

---

## 1. 贡献前准备

### 1.1 环境要求

```bash
node >= 18
npm >= 9
TypeScript >= 5.0
```

### 1.2 安装依赖

```bash
npm install
```

### 1.3 验证环境

```bash
npm run build   # TypeScript 编译
npm test        # 运行测试套件
npm run lint    # ESLint 检查
```

---

## 2. 分支策略

**默认基础分支：`dev`**（不是 `main`）

```bash

# 从 dev 创建功能分支

git checkout dev
git pull origin dev
git checkout -b feat/your-feature-name

# 使用 worktree 隔离（推荐）

git worktree add ../ultrapower-feat -b feat/your-feature-name dev
```

**禁止**：直接向 `main` 提交或创建以 `main` 为目标的 PR。

---

## 3. 代码规范

### 3.1 TypeScript 规范

* 所有公共 API 必须有 JSDoc 注释

* 使用 `as const` 定义枚举类型常量

* 安全边界函数必须接受 `unknown` 类型参数

```typescript
// ✅ 正确示例
/**
 * 校验 mode 参数，防止路径遍历。
 * @param mode - 待校验的输入
 * @returns 若为合法 mode 则返回 true
 */
export function validateMode(mode: unknown): mode is ValidMode {
  return typeof mode === 'string' && (VALID_MODES as readonly string[]).includes(mode);
}
```

### 3.2 安全规范

* mode 参数用于路径构建前必须调用 `assertValidMode()`

* 禁止直接字符串插值未校验的用户输入到文件路径

* 详见 `docs/standards/runtime-protection.md` §2.4

### 3.3 提交信息规范

格式：`type(scope): description`（英文）

| type | 用途 |
| ------ | ------ |
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `refactor` | 重构（不改变行为） |
| `test` | 测试相关 |
| `chore` | 构建/工具链 |

示例：
```
feat(validateMode): add path traversal protection for mode parameter
fix(subagent-tracker): use inferred success status instead of deprecated field
docs(standards): add anti-patterns guide
```

---

## 4. 质量门禁

所有 PR 合并前必须通过以下门禁：

### 4.1 CI Gate（必须）

```bash
tsc --noEmit    # 零类型错误
npm run build   # 构建成功
npm test        # 所有测试通过
```

### 4.2 安全检查（必须）

* 无未校验的 mode 参数路径拼接

* 无 `SubagentStopInput.success` 直接读取

* 无敏感信息写入状态文件

### 4.3 文档同步（必须）

修改以下内容时，对应文档必须同步更新：

| 修改内容 | 必须更新 |
| --------- | --------- |
| `agents/*.md` | `src/agents/definitions.ts`、`docs/REFERENCE.md` |
| `skills/*/SKILL.md` | `commands/*.md`（镜像） |
| `src/hooks/*` | `src/hooks/index.ts`、`src/hooks/bridge.ts` |
| 新执行模式 | `src/lib/validateMode.ts` 的 `VALID_MODES` |
| 工具定义 | `src/tools/index.ts`、`docs/REFERENCE.md` |

---

## 5. ADR 要求

### 5.1 何时需要 ADR

以下情况必须创建 ADR：

* **重大架构变更**: 影响多个模块或系统设计的决策

* **长期技术方向**: 可能影响未来 6 个月以上的决策

* **权衡决策**: 需要在多个方案间做出选择

* **性能优化**: 引入新的性能优化策略

**不需要 ADR 的情况**:

* Bug 修复

* 小型功能增强

* 文档更新

* 依赖升级

### 5.2 ADR 编号规则

* 格式: `ADR-XXX: [决策名称]`

* 编号递增，从 001 开始

* 位置: `docs/adr/ADR-XXX.md`

* 模板: 参考 `docs/adr/template.md`

### 5.3 ADR 审查流程

1. **创建**: 在 PR 中包含新 ADR
2. **审查**: 至少 2 名 reviewer 批准
3. **合并**: ADR 状态改为 "接受"
4. **发布**: 在 CHANGELOG 中记录

### 5.4 ADR 内容要求

每个 ADR 必须包含：

* **背景**: 问题陈述、约束条件

* **决策**: 选择的方案、实施方式

* **后果**: 正面影响、负面影响、权衡

* **替代方案**: 至少 2 个未采用的方案及原因

---

## 6. 文档更新要求

### 6.1 新增执行模式

新增 mode 时必须同步更新：

1. `src/lib/validateMode.ts` — 将新 mode 加入 `VALID_MODES`
2. `src/__tests__/validateMode.test.ts` — 更新测试中的期望数量和值
3. `docs/standards/state-machine.md` — 更新状态文件路径表
4. `docs/CLAUDE.md` — 更新 `state_write` 支持的模式列表
5. `AGENTS.md` — 更新执行模式表

### 5.2 重大架构变更

重大架构变更必须附带 ADR：

1. 创建 `docs/adr/ADR-XXX.md`（使用下一个编号）
2. 在 PR 描述中引用 ADR
3. ADR 必须在 PR 合并前完成审查

**示例**:
```markdown

## 架构决策

本 PR 实现 ADR-001 中的 WorkerStateAdapter 抽象层。

* 创建 `src/workers/` 目录

* 实现 SQLite 和 JSON 适配器

* 详见 `docs/adr/001-worker-state-adapter.md`
```

### 5.3 新增 Skill 或 Init/Setup 命令

新增 skill 或 init/setup 类命令时，必须包含可执行指令：

* skill 的 `### /skill-name init` 章节必须包含具体的 `Bash`/`Write` 调用，不能只有描述性文字

* setup 命令必须包含完整的目录创建和文件初始化步骤

* 禁止只写"初始化系统"而不提供实际命令

```markdown
<!-- ✅ 正确：包含可执行指令 -->

### /ax-context init

1. Bash("mkdir -p .omc/axiom/evolution")
2. Write(".omc/axiom/active_context.md", "...")

<!-- ❌ 错误：只有描述 -->

### /ax-context init

初始化 Axiom 记忆系统。
```

### 5.4 新增 Agent

新增 agent 时必须同步更新：

1. `agents/<name>.md` — agent 提示模板
2. `src/agents/definitions.ts` — agent 定义注册
3. `docs/REFERENCE.md` — agent 列表
4. `AGENTS.md` — agent 概览表

### 5.5 差异点记录

发现代码与规范不一致时：

1. 在 `docs/standards/audit-report.md` 中记录新差异点（D-XX 格式）
2. 在对应规范文档的"差异点说明"章节引用
3. 在 `docs/standards/anti-patterns.md` 中添加对应反模式

---

## 6. 版本与分支管理

### 6.1 动态版本读取模式

`src/installer/index.ts` 使用 `getRuntimePackageVersion()` 从 `package.json` 动态读取版本号，无需硬编码 `VERSION` 常量。

**推荐模式：**

```typescript
// ✅ 动态读取（推荐）
import { getRuntimePackageVersion } from '../lib/version';
const version = getRuntimePackageVersion(); // 从 package.json 读取

// ❌ 硬编码（不推荐）
export const VERSION = '5.1.0'; // 发布时容易遗漏更新
```

**优势：** 发布时只需更新 `package.json`，所有使用 `getRuntimePackageVersion()` 的模块自动跟随，无需逐一同步。

**适用场景：** 新模块需要读取当前版本时，优先使用 `getRuntimePackageVersion()` 而非硬编码常量。

### 6.2 特性分支生命周期

特性分支合并后必须及时清理，避免积累过时分支。

**正确时序：**

```
PR merge → 删除特性分支（本地 + 远程）→ dev 同步到 main（发布时）→ main 同步回 dev
```

**操作命令：**

```bash

# PR 合并后删除远程分支（GitHub 可配置自动删除）

git push origin --delete feat/my-feature

# 删除本地分支

git branch -d feat/my-feature

# 确认清理完成

git branch -a | grep feat/my-feature  # 应无输出
```

**规则：**

* PR merge 后 24 小时内删除对应特性分支

* 禁止在已合并的特性分支上继续开发

* 发布完成后：`dev` → `main`（tag + push），然后 `main` → `dev`（同步）

