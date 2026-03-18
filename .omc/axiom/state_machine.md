# Axiom State Machine

## 状态定义
- IDLE: 系统就绪，等待指令
- PLANNING: 需求分析与规划中
- CONFIRMING: 等待用户确认
- EXECUTING: 任务执行中
- AUTO_FIX: 自动修复错误
- BLOCKED: 遇到阻塞，需人工介入
- ARCHIVING: 归档与反思

## 当前状态
IDLE

## 转换历史
- 2026-03-18 11:01: ARCHIVING → IDLE (实施完成)
- 2026-03-18 11:05: IDLE → ARCHIVING (反思开始)
- 2026-03-18 11:06: ARCHIVING → IDLE (反思完成)
