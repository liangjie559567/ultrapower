# 代码质量审查员 Prompt 模板

派发代码质量审查员 subagent 时使用此模板。

**目的：** 验证实现是否构建良好（简洁、已测试、可维护）

**仅在规格合规审查通过后才派发。**

```
Task tool (superpowers:code-reviewer):
  Use template at requesting-code-review/code-reviewer.md

  WHAT_WAS_IMPLEMENTED: [来自实现者的报告]
  PLAN_OR_REQUIREMENTS: [计划文件] 中的任务 N
  BASE_SHA: [任务前的提交]
  HEAD_SHA: [当前提交]
  DESCRIPTION: [任务摘要]
```

**代码审查员返回：** 优点、问题（严重/重要/次要）、评估
