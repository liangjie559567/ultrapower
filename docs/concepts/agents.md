# Agents 参考

## Agent 分类

### 构建/分析通道

| Agent | 模型 | 用途 |
|-------|------|------|
| `explore` | haiku | 代码库发现、符号映射 |
| `analyst` | opus | 需求澄清、验收标准 |
| `planner` | opus | 任务排序、执行计划 |
| `architect` | opus | 系统设计、架构决策 |
| `debugger` | sonnet | 根因分析、故障诊断 |
| `executor` | sonnet | 代码实现、功能开发 |
| `deep-executor` | opus | 复杂自主任务 |
| `verifier` | sonnet | 完成验证、测试充分性 |

### 审查通道

| Agent | 模型 | 用途 |
|-------|------|------|
| `style-reviewer` | haiku | 格式、命名规范 |
| `quality-reviewer` | sonnet | 逻辑缺陷、可维护性 |
| `api-reviewer` | sonnet | API 契约、版本控制 |
| `security-reviewer` | sonnet | 漏洞、认证授权 |
| `performance-reviewer` | sonnet | 性能热点、优化 |
| `code-reviewer` | opus | 综合审查 |

### 领域专家

| Agent | 模型 | 用途 |
|-------|------|------|
| `dependency-expert` | sonnet | SDK/API 评估 |
| `test-engineer` | sonnet | 测试策略、覆盖率 |
| `build-fixer` | sonnet | 构建/类型错误 |
| `designer` | sonnet | UI/UX 设计 |
| `writer` | haiku | 文档编写 |
| `git-master` | sonnet | Git 操作 |

## 使用示例

### 直接调用

```bash
# 实现功能
/ultrapower:executor "Add user login API"

# 调试问题
/ultrapower:debugger "Investigate memory leak"

# 代码审查
/ultrapower:code-reviewer "Review auth module"
```

### 指定模型

```typescript
Task({
  subagent_type: "ultrapower:executor",
  model: "haiku",  // 快速简单任务
  prompt: "Add input validation"
})
```
