---
task: T-08
title: Skill 集成
depends: [T-06]
---

# T-08: Skill 集成

## 目标
扩展 `skills/trace/SKILL.md` 增加 `--observe` 子命令；扩展 `skills/ax-status/SKILL.md` 增加可观测性摘要区块。

## skills/trace/SKILL.md 修改

在现有 trace skill 末尾追加：

```markdown
## --observe 模式

当用户使用 `--observe` 参数时，调用 QueryEngine 输出可观测性报告：

### 参数
- `--session <id>`：过滤指定 session
- `--agent <type>`：过滤指定 agent 类型
- `--tool <name>`：过滤指定工具
- `--cost`：仅显示成本摘要
- `--last <n>`：限制返回条数（默认 20）

### 输出格式
\`\`\`
=== Agent 执行摘要 ===
agent_type       count  avg_ms  total_ms
executor           12    4230    50760
explore             5     890     4450

=== 工具调用分析 ===
tool_name        count  avg_ms  p95_ms  failure%
Bash                45    1200    3400      2.2%
Read                30     180     420      0.0%

=== 成本摘要 ===
model              cost_usd  input_tok  output_tok
claude-sonnet-4-6    $0.042     12000       2800
\`\`\`
```

## skills/ax-status/SKILL.md 修改

在状态仪表盘输出中增加「可观测性摘要」区块：

```markdown
## 可观测性摘要（本 session）

调用 QueryEngine.getAgentRuns / getToolCalls / getCostSummary，
输出：
- 本 session agent 调用次数 + 总耗时
- 最慢工具 Top 3（按 p95_ms）
- 本 session 估算成本（USD）
```

## 验收
- `/trace --observe` 输出格式化报告
- `/ax-status` 包含可观测性摘要区块
