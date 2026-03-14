<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-14 | Updated: 2026-03-14 -->

# skills/ - 工作流 Skills 系统

**用途：** 71 个工作流 skills 的定义和实现。每个 skill 对应一个工作流模式或执行模式。

**版本：** 7.2.0

## 关键文件

| 文件 | 描述 |
| ------ | ------ |
| `AGENTS.md` | 本文件 - Skills 系统概览 |
| `*/SKILL.md` | 每个 skill 的定义文档 |
| `*/index.ts` | Skill 实现入口 |

## Skills 分类

| 分类 | 数量 | 示例 | 用途 |
| ------ | ------ | ------ | ------ |
| 执行模式 | 8 | autopilot, ralph, ultrawork, team, pipeline | 自主执行和编排 |
| 工作流 | 25+ | plan, analyze, code-review, security-review | 专业工作流 |
| Axiom 命令 | 15 | ax-draft, ax-review, ax-implement, ax-reflect | Axiom 系统命令 |
| 工具类 | 20+ | note, learner, omc-setup, mcp-setup, hud | 配置和工具 |
| 其他 | 5+ | cancel, skill, trace, release | 杂项 |

## 目录结构

```
skills/
├── autopilot/          # 自主执行模式
├── ralph/              # 持久循环模式
├── ultrawork/          # 并行编排模式
├── team/               # Team 协调模式
├── pipeline/           # 顺序链式模式
├── plan/               # 规划 skill
├── analyze/            # 分析 skill
├── code-review/        # 代码审查 skill
├── security-review/    # 安全审查 skill
├── ax-draft/           # Axiom 草稿 skill
├── ax-review/          # Axiom 评审 skill
├── ax-implement/       # Axiom 实现 skill
├── ax-reflect/         # Axiom 反思 skill
├── omc-setup/          # OMC 设置 skill
├── mcp-setup/          # MCP 设置 skill
└── ... (更多 skills)
```

## 面向 AI 智能体

### 在此目录中工作

1. **添加新 skill**
   - 创建 `skills/my-skill/` 目录
   - 编写 `SKILL.md` 定义文档
   - 实现 `index.ts` 处理逻辑
   - 在 `src/skills/index.ts` 中注册

1. **修改现有 skill**
   - 更新 `SKILL.md` 文档
   - 修改 `index.ts` 实现
   - 同步 `commands/*.md` 中的对应命令定义

1. **测试 skill**
   - 使用 `/skill-name` 触发 skill
   - 验证输出和状态变化
   - 检查与其他 skills 的交互

### Skill 与 Command 关系

* `skills/*/SKILL.md` - Skill 完整定义（包含提示词）

* `commands/*.md` - 命令定义（引用 skill）

* 两者应保持功能同步

### 修改检查清单

| 修改位置 | 更新位置 |
| --------- | --------- |
| `skills/*/SKILL.md` | `skills/AGENTS.md` (本文件) |
| `skills/*/index.ts` | 对应 `SKILL.md` |
| 新增 skill | `src/skills/index.ts` 注册 |
| Skill 数量变化 | `/AGENTS.md` 根文件 |

### 常见任务

```bash

# 查看所有 skills

ls -la skills/

# 测试 skill

/skill-name "prompt"

# 查看 skill 定义

cat skills/my-skill/SKILL.md
```

### 执行模式 Skills

| Skill      | 用途                         | 模型   | 并行度 |
| ---------- | ---------------------------- | ------ | ------ |
| autopilot  | 从想法到代码的全自主执行     | sonnet | 1      |
| ralph      | 带验证的自引用循环           | sonnet | 1      |
| ultrawork  | 最大并行度的 agent 编排      | sonnet | N      |
| team       | N 个协调 agents 的分阶段流水线 | sonnet | N      |
| ultrapilot | Team 的兼容性外观            | sonnet | N      |
| pipeline   | 顺序 agent 链式执行          | sonnet | 1      |
| swarm      | Team 的兼容性外观            | sonnet | N      |
