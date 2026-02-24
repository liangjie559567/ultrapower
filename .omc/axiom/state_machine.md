# Axiom 状态机定义

## 状态列表

| 状态 | 描述 | 允许转换到 |
|------|------|-----------|
| IDLE | 空闲，等待新任务 | PLANNING |
| PLANNING | 需求分析和规划中 | CONFIRMING, IDLE |
| CONFIRMING | 等待用户确认 | EXECUTING, PLANNING, IDLE |
| EXECUTING | 任务执行中 | AUTO_FIX, ARCHIVING, BLOCKED |
| AUTO_FIX | 自动修复错误中（最多3次） | EXECUTING, BLOCKED |
| BLOCKED | 阻塞，需要人工介入 | EXECUTING, IDLE |
| ARCHIVING | 归档任务结果 | IDLE |

## 当前状态
- 状态: IDLE
- 进入时间: 2026-02-24
- 前一状态: -

## 状态转换规则

### IDLE → PLANNING
- 触发: 用户提交新需求
- 动作: 调用 axiom-requirement-analyst

### PLANNING → CONFIRMING
- 触发: 需求分析通过（PASS）
- 动作: 展示 Draft PRD，等待用户确认

### CONFIRMING → EXECUTING
- 触发: 用户确认 PRD
- 动作: 调用 axiom-system-architect 生成任务 DAG

### EXECUTING → AUTO_FIX
- 触发: CI 检查失败
- 动作: 调用 axiom-worker 自动修复（计数器 +1）

### AUTO_FIX → BLOCKED
- 触发: 修复次数 >= 3
- 动作: 记录错误，通知用户

### EXECUTING → ARCHIVING
- 触发: 所有任务完成，CI 通过
- 动作: 归档任务，更新知识库

### ARCHIVING → IDLE
- 触发: 归档完成
- 动作: 触发进化引擎（可选）
