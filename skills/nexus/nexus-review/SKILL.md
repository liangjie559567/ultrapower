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

1. 读取 `.omc/nexus/improvements/` 下所有 `status === "pending"` 的文件
2. 按置信度降序排列
3. 对每个改进建议显示：
   - ID、类型、目标文件
   - 置信度（≥80 标记为 AUTO-APPLY）
   - 原因和证据摘要
   - diff 内容

4. 询问用户对每个建议的操作：
   - `apply`：应用改进，更新 status 为 `applied`
   - `skip`：跳过，更新 status 为 `rejected`
   - `auto`：自动应用所有置信度 ≥80 的建议

## 输出格式

```
nexus Improvements (N pending)
==============================
[1] skill_update | skills/learner/SKILL.md | confidence: 87 [AUTO-APPLY]
    Reason: 触发词 'learn' 在过去 10 次会话中出现 23 次但未触发
    Action? (apply/skip/auto):
```
