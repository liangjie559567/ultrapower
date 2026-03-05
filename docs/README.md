# ultrapower 文档

> **版本**: v5.5.15
> **最后更新**: 2026-03-05

欢迎使用 ultrapower！这是 Claude Code 的多智能体编排框架。

---

## 🚀 快速导航

- [5 分钟安装](./getting-started/installation.md)
- [15 分钟快速开始](./getting-started/quickstart.md)
- [核心概念](./getting-started/concepts.md)

---

## 👥 按角色查找

### 新用户
刚开始使用 ultrapower？从这里开始：
- [快速开始](./getting-started/quickstart.md) - 20 分钟内跑通第一个示例
- [核心概念](./getting-started/concepts.md) - 理解 agents、skills、hooks、tools

### 日常用户
查找特定功能的使用方法：
- [Agents 列表](./features/agents.md) - 50 个专业 agents
- [Skills 列表](./features/skills.md) - 71 个工作流 skills
- [Hooks 系统](./features/hooks.md) - 47 个事件 hooks
- [工具参考](./features/tools.md) - 35 个自定义工具

### 高级用户
深入理解系统架构：
- [状态机设计](./architecture/state-machine.md)
- [Hook 执行顺序](./architecture/hook-execution-order.md)
- [Agent 生命周期](./architecture/agent-lifecycle.md)

### 贡献者
参与项目开发：
- [贡献指南](./standards/contribution-guide.md)
- [代码规范](./standards/runtime-protection.md)
- [反模式](./standards/anti-patterns.md)

---

## 🎯 按场景查找

- [功能开发](./guides/scenario-feature-dev.md) - 从需求到交付的完整流程
- [Bug 调查](./guides/scenario-bug-investigation.md) - 系统化调试方法
- [代码审查](./guides/scenario-code-review.md) - 多维度审查流程

---

## 📚 核心功能

### Agents（智能体）
50 个专业 agents，覆盖构建、审查、领域、产品等多个通道。

**常用 agents**:
- `executor` - 代码实现
- `debugger` - 根因分析
- `architect` - 系统设计
- `code-reviewer` - 代码审查

[查看完整列表 →](./features/agents.md)

### Skills（技能）
71 个工作流 skills，自动化复杂任务。

**高频 skills**:
- `/ultrapower:autopilot` - 全自主执行
- `/ultrapower:team` - 多 agent 协作
- `/ultrapower:ralph` - 持续执行直到完成

[查看完整列表 →](./features/skills.md)

### Axiom 进化系统
自我改进的智能体系统，包含知识收割、模式检测、工作流优化。

[了解更多 →](./features/axiom.md)

---

## 💬 反馈与帮助

### 这篇文档有帮助吗？
- [👍 有帮助](https://github.com/liangjie559567/ultrapower/issues/new?labels=docs-feedback&template=docs-helpful.md)
- [👎 需改进](https://github.com/liangjie559567/ultrapower/issues/new?labels=docs-feedback&template=docs-improvement.md)

### 遇到问题？
- [故障排查指南](./guides/troubleshooting.md)
- [提交 Issue](https://github.com/liangjie559567/ultrapower/issues/new)

---

## 📖 文档结构

```
docs/
├── getting-started/    # 新手入门
├── features/          # 功能参考
├── guides/            # 使用指南
├── architecture/      # 架构设计
├── standards/         # 开发规范
└── api/              # API 参考
```

---

**开始使用**: [安装 ultrapower →](./getting-started/installation.md)
