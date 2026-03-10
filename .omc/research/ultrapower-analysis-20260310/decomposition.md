# Research Decomposition

**Goal:** 全面深度分析 ultrapower 代码库的架构、组件关系和实现模式

**Session ID:** ultrapower-analysis-20260310
**Created:** 2026-03-10T02:56:38.792Z

## Stage 1: 核心架构与入口点分析
- **Focus:** 分析 src/ 目录结构、主入口点、核心模块组织
- **Hypothesis:** 系统采用模块化架构，通过 index.ts 暴露统一 API
- **Scope:** src/index.ts, src/agents/, src/hooks/, src/tools/, src/features/
- **Tier:** MEDIUM

## Stage 2: Agent 系统实现机制
- **Focus:** 49 个 agents 的定义、注册、路由和执行机制
- **Hypothesis:** Agent 通过 definitions.ts 集中管理，支持三级模型路由
- **Scope:** src/agents/, agents/*.md, agent 提示模板
- **Tier:** HIGH

## Stage 3: Skills 工作流编排
- **Focus:** 71 个 skills 的实现、触发机制、与 commands 的映射关系
- **Hypothesis:** Skills 通过 SKILL.md 定义，与 commands/*.md 镜像同步
- **Scope:** skills/*/SKILL.md, commands/*.md, skill bridge 构建
- **Tier:** MEDIUM

## Stage 4: Hooks 事件系统
- **Focus:** 43 个 hooks 的类型、执行顺序、输入消毒机制
- **Hypothesis:** Hooks 通过 bridge-normalize 实现安全输入过滤
- **Scope:** src/hooks/, hooks/, hook 执行协议
- **Tier:** MEDIUM

## Stage 5: 自定义工具集成
- **Focus:** 35 个工具（LSP/AST/Python REPL/State/Notepad/Memory）的实现
- **Hypothesis:** 工具通过 MCP 协议暴露，支持按组禁用
- **Scope:** src/tools/, MCP 服务器配置
- **Tier:** MEDIUM

## Stage 6: 执行模式状态机
- **Focus:** autopilot/ralph/ultrawork/team/pipeline 等模式的状态转换
- **Hypothesis:** 状态通过 .omc/state/ 持久化，支持恢复和取消
- **Scope:** src/hooks/autopilot/, src/hooks/ralph/, 状态管理
- **Tier:** HIGH

## Stage 7: 安全与运行时防护
- **Focus:** 路径遍历防护、Hook 输入消毒、状态文件权限控制
- **Hypothesis:** 通过 assertValidMode 和白名单过滤实现安全边界
- **Scope:** src/lib/validateMode.ts, bridge-normalize.ts, 安全规范
- **Tier:** HIGH
