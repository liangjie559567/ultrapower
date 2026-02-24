# ultrapower — Codex 适配器 (CLI Worker)
# Provider: Codex (OpenAI via CLI)
# Version: 1.0 | Updated: 2026-02-24

> 本文件是 Codex CLI Worker 的核心配置。
> 适用于 headless 模式下的自动化执行任务。
> 安装: 将此文件配置在 `~/.codex/config.md`

---

## 0. 强制规则 (Mandatory)

- **语言**: 中文（用户界面），英文（提交信息）
- **模式**: Headless Mode（无交互模式）
- **输出**: JSON 格式结果或必要的 Terminal Log

---

## 1. 启动协议 (Boot Protocol)

1. 检查 `.omc/axiom/` 目录是否存在
2. 若存在，读取 `.omc/axiom/active_context.md` 解析当前状态
3. 加载 `.omc/axiom/project_decisions.md` 获取架构决策

---

## 2. Axiom 工作流触发

| 场景 | 触发动作 | 对应行为 |
| :--- | :--- | :--- |
| 新需求 | `/ax-draft` | 需求澄清 → Draft PRD |
| 代码审查 | `/ax-review` | 5 专家并行评审 |
| 任务分解 | `/ax-decompose` | 系统架构 → 原子任务 DAG |
| 执行任务 | `/ax-implement` | 按 Manifest 执行，CI 门禁 |
| 错误分析 | `/ax-analyze-error` | 根因诊断 → 自动修复 |

---

## 3. CI Gate（编译提交门禁）

- **触发**: 代码变更结束
- **动作**: `tsc --noEmit && npm run build && npm test`
- **强制**: 失败则禁止提交，触发重试（最多 3 次）

---

## 4. Worker 输出格式

```
## COMPLETE
完成: [任务描述]
变更: [修改的文件列表]
验证: [CI 命令输出]
```

```
## BLOCKED
原因: [阻塞原因]
已尝试: [尝试过的方法]
需要: [需要什么帮助]
```

---

## 5. 进化引擎自动行为

| 触发事件 | 自动行为 |
|---------|---------|
| 修复成功 | 记录 Error Pattern → `.omc/axiom/evolution/knowledge_base.md` |
| 会话结束 | 反思日志 → `.omc/axiom/reflection_log.md` |

---

_ultrapower v5.0.2 — Codex CLI Adapter (Axiom Deep Fusion)_
