# Axiom — Codex 适配器 (CLI Worker)
# Provider: Codex (OpenAI via CLI)
# Version: 4.2 (Hybrid) | Updated: 2026-02-12

> 本文件是 Codex CLI Worker 的核心配置。
> 适用于 headless 模式下的自动化执行任务。

---

## 0. 强制语言规则 (Mandatory)

- **语言**: 强制中文 (Chinese Mandatory)，包括 Log 输出、Git Commit Message。
- **模式**: Headless Mode (无交互模式)。禁止请求用户输入，除 Critical Error 外。
- **简洁**: 仅输出 JSON 格式的结果或必要的 Terminal Log。

---

## 1. 启动协议 (Boot Protocol)

### 1.1 环境检查
1. **加载上下文**: 读取 `manifest.md` 和分配的 `Sub-PRD`。
2. **依赖检查**: 确认 `node`, `git` 等命令可用。
3. **状态同步**: 检查 Task ID (T-xxx) 的 Dependency 是否满足。

### 1.2 执行模式加载
- **Standard Mode**: 读取 `.omc/axiom/project_decisions.md`。
- **Fast Track**: 仅加载核心 Prompt，跳过次要规则。

---

## 2. 智能工作流触发 (Smart Workflow Triggers)

| 场景 | 触发动作 | 对应行为 |
| :--- | :--- | :--- |
| **Dispatcher 调用** | 接收 Prompt | 执行微循环 |
| **编译失败** | `/ax-analyze-error` | 自动调用错误分析技能 |
| **测试失败** | Retry (Max 3) | 尝试自动修复代码 |
| **任务完成** | Update Manifest | 勾选 `[x] T-xxx` 并提交 |

---

## 3. Codex 专属能力映射 (CLI Native)

| 操作 | Native Capability | 限制 |
|------|-------------------|-----|
| 文件读写 | `FileSystem` | 必须是 Absolute Path |
| 命令执行 | `Shell` | 必须检查 `SafeToAutoRun` |
| 结果回传 | `JSON Stream` | 严格遵循 stdout 格式 |

### Codex 最佳实践
- **JSONL Output**: 所有关键事件必须通过 JSONL 输出，以便 Dispatcher 解析。
- **Atomic Commits**: 每个 Task 完成后必须独立 Commit。
- **Self-Correction**: 遇到错误优先尝试自修复，而非立即报错。

---

## 4. 门禁规则 (Gatekeeper Rules)

### 4.1 编译提交门禁 (CI Gate)
- **触发**: 代码变更结束。
- **动作**: `tsc --noEmit && npm run build && npm test`。
- **强制**: 失败则禁止 Commit，并触发重试。

### 4.2 范围门禁 (Scope Gate)
- **触发**: 修改文件。
- **检查**: 是否在 `manifest.md` 定义的 `Impact Scope` 内。
- **动作**: 越界修改触发警告。

---

## 5. 进化引擎自动行为 (Evolution Auto Behaviors)

| 触发事件 | 自动行为 |
|---------|---------|
| 修复成功 | 记录 Error Pattern -> `project_decisions.md` |
| 性能瓶颈 | 记录慢函数 -> `performance_log.md` |

_Axiom v4.2 — Codex CLI Adapter (ultrapower integration)_
