---
name: ax-analyze-error
description: "/ax-analyze-error — Axiom 错误分析工作流：根因诊断 → 自动修复 → 知识入队"
triggers: ["ax-analyze-error", "analyze error", "报错了", "修 bug", "错误分析"]
---

# Axiom 错误分析工作流

本工作流对错误进行系统性根因分析并尝试自动修复。

**开始时宣告：** "I'm using the ax-analyze-error skill to diagnose and fix the error."

## 执行步骤

### Step 1: 错误诊断

调用 debugger agent：

```
Task(subagent_type="ultrapower:debugger", model="sonnet", prompt="分析以下错误的根本原因：[错误信息]")
```

输出：
- 根因分析
- 影响范围
- 修复方案（优先级排序）

### Step 2: 自动修复

调用 executor 执行修复：

```
Task(subagent_type="ultrapower:executor", model="sonnet", prompt="修复以下错误（最小变更）：[根因分析结果]")
```

修复后验证：
```bash
tsc --noEmit && npm run build && npm test
```

### Step 3: 修复结果处理

- **修复成功**：
  1. 记录错误到知识库（入队）
  2. 更新 `project_decisions.md` 的 Known Issues
  3. 继续原工作流

- **修复失败（3次后）**：
  1. 输出详细的 [BLOCKED] 报告
  2. 请求用户介入

### Step 4: 知识入队

修复成功后，将错误模式加入学习队列：

```yaml
learning_queue.add:
  source_type: error_fix
  priority: P1
  metadata:
    error_type: "[错误类型]"
    root_cause: "[根因]"
    solution: "[修复方案]"
```

## 错误分类

| 错误类型 | 优先级 | 自动修复 |
|---------|--------|---------|
| 类型错误 | P1 | 是 |
| 构建失败 | P0 | 是 |
| 测试失败 | P1 | 是 |
| 运行时错误 | P0 | 部分 |
| 逻辑错误 | P2 | 否 |
