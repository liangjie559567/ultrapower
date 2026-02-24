# Axiom Skills Router（技能路由表）

<!-- Source: C:\Users\ljyih\Desktop\Axiom\.agent\rules\skills.rule -->
<!-- Migrated: 2026-02-24 -->

根据任务类型调用对应能力。

## 技能路由表

| 任务类型 | ultrapower 对应 skill/agent | 说明 |
| :--- | :--- | :--- |
| 需求分析（Gate） | `ultrapower:analyst` | 需求澄清、验收标准 |
| 产品设计（Draft） | `ultrapower:brainstorming` | 设计对话、方案探索 |
| 评审仲裁（Review） | `ultrapower:code-reviewer` | 综合审查 |
| 系统架构（Manifest） | `ultrapower:architect` | 系统设计、边界定义 |
| 读写记忆 | `notepad_read/write` + `project_memory_*` | OMC 内置工具 |
| 错误分析 | `ultrapower:debugger` | 根因分析 |
| UI/UX 设计 | `ultrapower:designer` | UX/UI 架构 |
| 自进化 | `ultrapower:learner` | 知识提取与进化 |
| 代码生成 | `ultrapower:executor` | 代码实现 |
| DAG 分析 | `ultrapower:planner` | 任务排序、依赖分析 |
| 测试策略 | `ultrapower:test-engineer` | 测试覆盖、TDD |
| 安全审查 | `ultrapower:security-reviewer` | 漏洞检测 |

## 使用说明

在 ultrapower 中，通过 `Task(subagent_type="ultrapower:[agent]")` 调用对应 agent。

示例：
```
Task(subagent_type="ultrapower:analyst", model="opus", prompt="分析需求...")
Task(subagent_type="ultrapower:executor", model="sonnet", prompt="实现功能...")
```
