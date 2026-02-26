# 贡献规范

> **ultrapower-version**: 5.0.21
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

- 所有公共 API 必须有 JSDoc 注释
- 使用 `as const` 定义枚举类型常量
- 安全边界函数必须接受 `unknown` 类型参数

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

- mode 参数用于路径构建前必须调用 `assertValidMode()`
- 禁止直接字符串插值未校验的用户输入到文件路径
- 详见 `docs/standards/runtime-protection.md` §2.4

### 3.3 提交信息规范

格式：`type(scope): description`（英文）

| type | 用途 |
|------|------|
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

- 无未校验的 mode 参数路径拼接
- 无 `SubagentStopInput.success` 直接读取
- 无敏感信息写入状态文件

### 4.3 文档同步（必须）

修改以下内容时，对应文档必须同步更新：

| 修改内容 | 必须更新 |
|---------|---------|
| `agents/*.md` | `src/agents/definitions.ts`、`docs/REFERENCE.md` |
| `skills/*/SKILL.md` | `commands/*.md`（镜像） |
| `src/hooks/*` | `src/hooks/index.ts`、`src/hooks/bridge.ts` |
| 新执行模式 | `src/lib/validateMode.ts` 的 `VALID_MODES` |
| 工具定义 | `src/tools/index.ts`、`docs/REFERENCE.md` |

---

## 5. 文档更新要求

### 5.1 新增执行模式

新增 mode 时必须同步更新：

1. `src/lib/validateMode.ts` — 将新 mode 加入 `VALID_MODES`
2. `src/__tests__/validateMode.test.ts` — 更新测试中的期望数量和值
3. `docs/standards/state-machine.md` — 更新状态文件路径表
4. `docs/CLAUDE.md` — 更新 `state_write` 支持的模式列表
5. `AGENTS.md` — 更新执行模式表

### 5.2 新增 Agent

新增 agent 时必须同步更新：

1. `agents/<name>.md` — agent 提示模板
2. `src/agents/definitions.ts` — agent 定义注册
3. `docs/REFERENCE.md` — agent 列表
4. `AGENTS.md` — agent 概览表

### 5.3 差异点记录

发现代码与规范不一致时：

1. 在 `docs/standards/audit-report.md` 中记录新差异点（D-XX 格式）
2. 在对应规范文档的"差异点说明"章节引用
3. 在 `docs/standards/anti-patterns.md` 中添加对应反模式

---

## 6. PR 提交流程

```bash
# 1. 确保基于最新 dev
git fetch origin
git rebase origin/dev

# 2. 运行质量门禁
tsc --noEmit && npm run build && npm test

# 3. 创建 PR（目标分支必须是 dev）
gh pr create --base dev \
  --title "feat(scope): description" \
  --body "## 变更说明\n\n## 测试验证\n\n## 文档更新"
```

**PR 描述模板**：

```markdown
## 变更说明
<!-- 简述本次变更的目的和内容 -->

## 测试验证
<!-- 列出运行的测试命令和结果 -->
- [ ] `tsc --noEmit` 通过
- [ ] `npm run build` 通过
- [ ] `npm test` 通过

## 文档更新
<!-- 列出同步更新的文档 -->
- [ ] 相关规范文档已更新
- [ ] AGENTS.md 已更新（如适用）
```
