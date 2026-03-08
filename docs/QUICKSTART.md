# 快速入门指南

## 5 分钟快速上手

### 安装

在 Claude Code 中运行：

```bash
/plugin marketplace add https://github.com/liangjie559567/ultrapower
/plugin install omc@ultrapower
/ultrapower:omc-setup
```

### 第一个命令

```bash
autopilot "创建一个 hello world 函数"
```

### 验证安装

```bash
/ultrapower:omc-doctor
```

---

## 最常用的 5 个 Skills

| Skill | 用途 | 示例 |
|-------|------|------|
| **autopilot** | 全自动从想法到代码 | `autopilot "添加用户认证"` |
| **ultrawork** | 并行执行多个任务 | `ultrawork "任务1" "任务2"` |
| **team** | 多 agent 协作编排 | `team "设计并实现登录流程"` |
| **deepinit** | 代码库深度初始化 | `deepinit` |
| **analyze** | 调试和根因分析 | `analyze "为什么测试失败"` |

---

## 最常用的 3 个执行模式

### 1. autopilot - 从想法到代码

自动完成整个开发流程：需求 → 设计 → 实现 → 测试 → 验证

```bash
autopilot "实现用户登录功能"
```

**何时使用**：明确的单一需求，希望快速交付

### 2. ralph - 持续执行直到完成

带验证循环的自引用执行，失败自动修复

```bash
ralph "构建完整的支付系统"
```

**何时使用**：复杂任务，需要多轮迭代和自动修复

### 3. team - 分阶段多 agent 协作

规划 → PRD → 执行 → 验证 → 修复（循环）

```bash
team "重构认证模块"
```

**何时使用**：大型功能，需要专业 agents 分工协作

---

## 常见问题 Top 3

### Q1: 如何选择执行模式？

| 场景 | 推荐模式 |
|------|---------|
| 简单功能，快速交付 | `autopilot` |
| 复杂任务，需要自动修复 | `ralph` |
| 大型功能，需要多 agent 协作 | `team` |
| 多个独立任务并行 | `ultrawork` |

### Q2: 如何查看可用的 agents？

```bash
/ultrapower:omc-help
```

查看完整列表：[docs/REFERENCE.md](./REFERENCE.md)

### Q3: 如何停止运行中的任务？

```bash
/ultrapower:cancel
```

使用 `--force` 清除所有状态：

```bash
/ultrapower:cancel --force
```

---

## 下一步

- 详细文档：[docs/REFERENCE.md](./REFERENCE.md)
- 架构设计：[docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- 故障排查：[docs/guides/troubleshooting-guide.md](./guides/troubleshooting-guide.md)
- 工作流指南：[docs/guides/workflow-recommendation-guide.md](./guides/workflow-recommendation-guide.md)
