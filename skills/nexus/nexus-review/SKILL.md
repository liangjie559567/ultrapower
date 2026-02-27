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

改进文件为 JSON 格式，包含以下字段：id、type、targetFile、confidence、newContent、reason、status。

1. 读取 `.omc/nexus/improvements/` 下所有 `status === "pending"` 的文件
2. 按置信度降序排列
3. 对每个改进建议显示：
   - ID、类型、目标文件
   - 置信度（≥80 标记为 AUTO-APPLY）
   - 原因和证据摘要
   - diff 内容

4. 询问用户对每个建议的操作：
   - `apply`：将改进 JSON 中的 `newContent` 字段内容写入 `targetFile` 路径。然后将该改进 JSON 文件中的 `status` 更新为 `applied`。
   - `skip`：跳过，更新 status 为 `rejected`
   - `auto`：在批量应用前，显示所有置信度 ≥80 的改进列表，并询问：'Apply all N improvements with confidence ≥80? (yes/no)'。用户确认后，对每个改进执行与 `apply` 相同的操作。

## 输出格式

```
nexus Improvements (N pending)
==============================
[1] skill_update | skills/learner/SKILL.md | confidence: 87 [AUTO-APPLY]
    Reason: 触发词 'learn' 在过去 10 次会话中出现 23 次但未触发
    Action? (apply/skip/auto):
```
