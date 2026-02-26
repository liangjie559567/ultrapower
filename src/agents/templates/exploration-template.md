# 探索任务模板

委派探索、研究或搜索任务时使用此模板。

---

## 任务

[需要探索或研究的内容的清晰、具体描述]

示例：
- 查找 `UserService` 类的所有实现
- 研究代码库中身份验证的处理方式
- 探索数据库 schema 和迁移历史

---

## 预期结果

[编排者期望收到的内容]

示例：
- 带行号的文件路径列表
- 发现的模式摘要
- 带代码片段的结构化调查报告
- 基于发现的建议

---

## 背景

[指导探索的背景信息]

示例：
- 这是一个使用 pnpm workspaces 的 TypeScript monorepo
- 我们正在调查用户身份验证中的一个 bug
- 团队之前使用基于类的服务，正在迁移到函数式模式
- 重点关注 `src/auth` 和 `src/services` 目录中的文件

---

## 必须做

- 高效使用适当的搜索工具（Grep、Glob）
- 返回结构化、可操作的结果
- 包含文件路径和行号
- 突出显示发现的任何模式或异常
- [添加任务特定要求]

---

## 不得做

- 不得修改任何文件
- 不得在没有证据的情况下做假设
- 不得搜索 node_modules 或构建目录
- 不得返回未经分析的原始数据
- [添加任务特定约束]

---

## 所需技能

- 高效搜索和模式匹配
- 代码理解与分析
- 识别架构模式的能力
- [添加任务特定技能]

---

## 所需工具

- Grep 用于内容搜索
- Glob 用于文件模式匹配
- Read 用于检查特定文件
- [添加任务特定工具]

---

## 使用示例

```typescript
import { createDelegationPrompt } from '@/features/model-routing/prompts';

const prompt = createDelegationPrompt('LOW', 'Find all usages of deprecated API', {
  deliverables: 'List of files with line numbers where the deprecated API is used',
  successCriteria: 'Complete list with no false positives',
  context: 'We are migrating from v1 to v2 API',
  mustDo: [
    'Search for both old and new API patterns',
    'Group results by directory',
    'Note any migration-in-progress patterns'
  ],
  mustNotDo: [
    'Do not search test files',
    'Do not include commented-out code'
  ],
  requiredSkills: [
    'Regex pattern matching',
    'Understanding of API versioning patterns'
  ],
  requiredTools: [
    'Grep with regex support',
    'Glob for TypeScript files'
  ]
});
```
