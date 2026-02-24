# Axiom 架构决策记录

## 决策格式
每条决策包含：类型、内容、时间、原因

## 架构决策

### ADR-001: 技术栈选择
- 类型: Architecture
- 时间: 2026-02-24
- 内容: 使用 TypeScript/Node.js 作为主要技术栈
- 原因: ultrapower 项目基于 TypeScript，保持一致性
- 验证命令: `tsc --noEmit && npm run build && npm test`

### ADR-002: 状态存储位置
- 类型: Architecture
- 时间: 2026-02-24
- 内容: Axiom 状态文件存储在 `.omc/axiom/` 目录
- 原因: 与 ultrapower OMC 状态目录 `.omc/state/` 保持一致的命名空间

### ADR-003: 命令前缀规范
- 类型: Rule
- 时间: 2026-02-24
- 内容: 所有 Axiom 命令使用 `/ax-` 前缀
- 原因: 避免与 ultrapower 原生命令冲突，保持简洁

## 库选择决策

## 规则决策
