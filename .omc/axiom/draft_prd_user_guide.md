# Draft PRD: ultrapower 用户使用指南

**版本**: v1.0
**创建时间**: 2026-03-05
**状态**: Draft
**优先级**: P1

---

## 1. 问题陈述

### 1.1 核心问题
用户不知道如何使用 ultrapower 项目，导致：
- 新用户无法快速上手
- 功能发现困难
- 安装配置门槛高
- 版本更新不清晰

### 1.2 目标用户
- **主要受众**: 已熟悉 Claude Code 的用户
- **使用场景**: 想要通过 ultrapower 增强 Claude Code 的多 agent 编排能力

### 1.3 影响范围
- 用户体验
- 项目采用率
- 社区活跃度
- 支持成本

---

## 2. 目标与成功指标

### 2.1 目标
1. **快速上手**: 5 分钟内完成安装并运行第一个示例
2. **功能发现**: 用户能快速了解核心功能（agents/skills/hooks/tools）
3. **配置清晰**: 提供清晰的配置指南
4. **更新简单**: 明确的版本更新流程

### 2.2 成功指标
- 新用户首次成功执行时间 < 5 分钟
- 文档覆盖率 > 90%（核心功能）
- 用户反馈问题减少 50%

---

## 3. 解决方案

### 3.1 文档结构

#### 3.1.1 README.md 更新
**内容**:
- 项目简介（1 段话）
- 快速开始（3 步安装 + 1 个示例）
- 核心功能概览（agents/skills/hooks/tools）
- 链接到详细文档

**位置**: 项目根目录 `README.md`

#### 3.1.2 独立用户手册
**内容**:
- 完整安装指南（Claude Code + ultrapower）
- 功能详解（50 agents + 71 skills + 35 hooks + 35 tools）
- 配置指南（MCP/hooks/steering）
- 常见问题（FAQ）
- 版本更新指南

**位置**: `docs/USER_GUIDE.md`

#### 3.1.3 交互式教程
**内容**:
- `/ultrapower:tutorial` skill
- 引导用户完成 5 个核心场景：
  1. 安装与配置
  2. 使用第一个 agent
  3. 创建自定义 skill
  4. 配置 hook
  5. 团队协作模式

**位置**: `skills/tutorial/SKILL.md`

### 3.2 快速开始指南（优先级 P0）

**目标**: 5 分钟内让用户运行起来

**步骤**:
```markdown
## 快速开始

### 1. 安装 ultrapower
```bash
npm install -g @liangjie559567/ultrapower
```

### 2. 配置 Claude Code 插件
```bash
/plugin marketplace add https://github.com/liangjie559567/ultrapower
/plugin install omc@ultrapower
```

### 3. 初始化配置
```bash
/ultrapower:omc-setup
```

### 4. 运行第一个示例
```bash
# 使用 autopilot 模式构建一个简单功能
autopilot "创建一个 hello world 函数"
```
```

### 3.3 功能概览（优先级 P1）

**agents 分类**:
- 构建/分析通道（8 个）
- 审查通道（6 个）
- 领域专家（16 个）
- 产品通道（4 个）
- Axiom 通道（14 个）

**skills 分类**:
- 工作流 skills（autopilot/ralph/ultrawork/team 等）
- Agent 快捷方式（analyze/deepsearch/tdd 等）
- 工具类（cancel/note/hud 等）

**hooks 系统**:
- 事件驱动执行
- 自动化工作流

**tools 分类**:
- LSP 工具（12 个）
- AST 工具（2 个）
- Python REPL（1 个）
- Notepad/State/Memory 工具

---

## 4. 技术实现

### 4.1 文件变更

| 文件 | 操作 | 优先级 |
|------|------|--------|
| README.md | 更新（添加快速开始） | P0 |
| docs/USER_GUIDE.md | 创建（完整手册） | P1 |
| skills/tutorial/SKILL.md | 创建（交互式教程） | P1 |
| docs/INSTALLATION.md | 创建（详细安装指南） | P2 |
| docs/FAQ.md | 创建（常见问题） | P2 |

### 4.2 实施计划

**Phase 1: 快速开始（P0）**
- 更新 README.md
- 添加 3 步安装指南
- 添加 1 个示例

**Phase 2: 完整手册（P1）**
- 创建 docs/USER_GUIDE.md
- 功能详解
- 配置指南

**Phase 3: 交互式教程（P1）**
- 创建 /ultrapower:tutorial skill
- 5 个核心场景

**Phase 4: 补充文档（P2）**
- FAQ
- 故障排查
- 版本迁移指南

---

## 5. 验收标准

### 5.1 Phase 1（快速开始）
- [ ] README.md 包含 3 步安装指南
- [ ] 新用户能在 5 分钟内运行第一个示例
- [ ] 安装步骤经过测试验证

### 5.2 Phase 2（完整手册）
- [ ] docs/USER_GUIDE.md 覆盖所有核心功能
- [ ] 包含配置示例和代码片段
- [ ] 链接到相关文档（REFERENCE.md/CLAUDE.md）

### 5.3 Phase 3（交互式教程）
- [ ] /ultrapower:tutorial skill 可正常运行
- [ ] 5 个场景全部可执行
- [ ] 提供清晰的进度反馈

---

## 6. 风险与依赖

### 6.1 风险
- 文档与代码不同步（需要建立更新机制）
- 示例代码可能过时（需要 CI 验证）

### 6.2 依赖
- 无外部依赖
- 需要现有文档（REFERENCE.md/CLAUDE.md）作为参考

---

## 7. 后续优化

- 添加视频教程
- 多语言支持
- 社区贡献指南
- 最佳实践案例库

---

**下一步**: 用户确认 Draft PRD → 进入专家评审阶段（/ax-review）
