# Agents 参考手册（49 个）

ultrapower v5.6.9 包含 49 个专业 AI agents，按通道分类。

## 快速导航

- [构建通道](#构建通道) - 5 个
- [审查通道](#审查通道) - 6 个
- [领域专家](#领域专家) - 18 个
- [产品通道](#产品通道) - 5 个
- [Axiom 专家](#axiom-专家) - 10 个

---

## 构建通道

| Agent | 模型 | 用途 |
|-------|------|------|
| `explore` | haiku | 代码库发现、符号/文件映射 |
| `analyst` | opus | 需求澄清、验收标准 |
| `planner` | opus | 任务排序、执行计划 |
| `architect` | opus | 系统设计、接口定义 |
| `executor` | sonnet | 代码实现、重构 |

---

## 审查通道

| Agent | 模型 | 用途 |
|-------|------|------|
| `style-reviewer` | haiku | 格式、命名、lint 规范 |
| `quality-reviewer` | sonnet | 逻辑缺陷、可维护性 |
| `api-reviewer` | sonnet | API 契约、兼容性 |
| `security-reviewer` | sonnet | 漏洞、认证/授权 |
| `performance-reviewer` | sonnet | 热点、复杂度优化 |
| `code-reviewer` | opus | 综合代码审查 |

---

## 领域专家

| Agent | 模型 | 用途 |
|-------|------|------|
| `debugger` | sonnet | 根因分析、故障诊断 |
| `verifier` | sonnet | 完成证据验证 |
| `dependency-expert` | sonnet | SDK/API/包评估 |
| `test-engineer` | sonnet | 测试策略、覆盖率 |
| `quality-strategist` | sonnet | 质量规划 |
| `build-fixer` | sonnet | 构建/类型错误修复 |
| `designer` | sonnet | UX/UI 架构 |
| `writer` | haiku | 文档编写 |
| `qa-tester` | sonnet | 集成测试 |
| `scientist` | sonnet | 数据分析 |
| `document-specialist` | sonnet | 文档研究 |
| `git-master` | sonnet | Git 工作流 |
| `database-expert` | sonnet | 数据库设计 |
| `devops-engineer` | sonnet | CI/CD、容器化 |
| `i18n-specialist` | sonnet | 国际化支持 |
| `accessibility-auditor` | sonnet | 无障碍审查 |
| `api-designer` | sonnet | API 设计 |
| `deep-executor` | opus | 复杂多步骤任务 |

---

## 产品通道

| Agent | 模型 | 用途 |
|-------|------|------|
| `product-manager` | sonnet | 问题定义、PRD |
| `ux-researcher` | sonnet | UX 研究 |
| `information-architect` | sonnet | 信息架构 |
| `product-analyst` | sonnet | 产品分析 |
| `critic` | opus | 批判性审查 |

---

## Axiom 专家

| Agent | 模型 | 用途 |
|-------|------|------|
| `axiom-drafter` | sonnet | Draft PRD 生成 |
| `axiom-reviewer` | opus | 专家评审聚合 |
| `axiom-decomposer` | opus | 任务拆解 |
| `axiom-implementer` | sonnet | 实施执行 |
| `axiom-analyzer` | sonnet | 错误分析 |
| `axiom-reflector` | opus | 会话反思 |
| `axiom-evolver` | sonnet | 知识库更新 |
| `axiom-monitor` | haiku | 状态监控 |
| `axiom-rollbacker` | sonnet | 回滚管理 |
| `vision` | sonnet | 视觉分析 |

---

## 模型分布

| 模型 | 数量 | 用途 |
|------|------|------|
| haiku | 4 | 快速查找、轻量扫描 |
| sonnet | 32 | 标准实现、调试、审查 |
| opus | 13 | 架构、深度分析 |

---

## 使用指南

### 调用方式

```bash
# 直接调用
Task(subagent_type="ultrapower:executor", model="sonnet", prompt="实现功能")

# Team 流水线
/team "构建系统"

# Axiom 工作流
/ax-implement
```

### 生命周期

1. 初始化 → 加载系统提示词
2. 执行 → 运行任务
3. 输出 → 返回结果
4. 验证 → Verifier 检查
5. 修复 → 路由到修复 agent

---

参考：[Skills 手册](SKILLS.md)
