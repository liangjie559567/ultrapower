# Axiom 知识库

## 知识条目格式
```
### K-[ID]: [标题]
- 分类: [workflow/pattern/error/best-practice]
- 置信度: [0.0-1.0]
- 来源: [manual/auto-extracted]
- 创建时间: [YYYY-MM-DD]
- 最后验证: [YYYY-MM-DD]
- 内容: [知识描述]
- 应用场景: [何时使用]
```

## 工作流知识

### K-001: TypeScript 构建验证流程
- 分类: workflow
- 置信度: 0.9
- 来源: manual
- 创建时间: 2026-02-24
- 最后验证: 2026-02-24
- 内容: ultrapower 项目使用三步验证：`tsc --noEmit`（类型检查）→ `npm run build`（构建）→ `npm test`（测试）
- 应用场景: 每次代码变更后的 CI 验证

### K-002: ultrapower Agent 文件格式
- 分类: pattern
- 置信度: 0.95
- 来源: manual
- 创建时间: 2026-02-24
- 最后验证: 2026-02-24
- 内容: Agent 文件使用 YAML frontmatter（name, description, model）+ `<Agent_Prompt>` XML 标签包裹内容，内含 Role/Input/Actions/Output_Format/Constraints 章节
- 应用场景: 创建新 agent 文件时

### K-003: ultrapower Skill 文件格式
- 分类: pattern
- 置信度: 0.95
- 来源: manual
- 创建时间: 2026-02-24
- 最后验证: 2026-02-24
- 内容: Skill 文件位于 `skills/*/SKILL.md`，使用 YAML frontmatter（name, description）+ Markdown 内容
- 应用场景: 创建新 skill 文件时

## 错误处理知识

### K-004: 自动修复策略
- 分类: error
- 置信度: 0.8
- 来源: manual
- 创建时间: 2026-02-24
- 最后验证: 2026-02-24
- 内容: 错误自动修复最多尝试 3 次，每次尝试后运行 CI 验证。3 次失败后转为 BLOCKED 状态
- 应用场景: EXECUTING → AUTO_FIX 状态转换时

## 最佳实践知识

### K-005: 分支策略
- 分类: best-practice
- 置信度: 0.9
- 来源: manual
- 创建时间: 2026-02-24
- 最后验证: 2026-02-24
- 内容: 默认基础分支为 `dev`（非 main），所有 PR 以 dev 为目标，使用 `gh pr create --base dev`
- 应用场景: 创建 PR 时

### K-006: Git Commit 规范
- 分类: workflow
- 置信度: 0.95
- 来源: axiom-seed-migration
- 创建时间: 2026-02-24
- 最后验证: 2026-02-24
- 内容: 遵循 Conventional Commits：`type(scope): description`。type: feat/fix/refactor/docs/test/chore/style。提交信息使用英文，用户界面内容使用中文
- 应用场景: 每次 git commit 时

### K-007: 代码审查五要素
- 分类: best-practice
- 置信度: 0.9
- 来源: axiom-seed-migration
- 创建时间: 2026-02-24
- 最后验证: 2026-02-24
- 内容: 正确性 > 可读性 > 性能 > 安全性 > 测试覆盖。重点关注边界条件和错误处理。反模式：函数 >30 行、参数 >4 个、嵌套 >3 层、Magic Numbers
- 应用场景: 代码审查时

### K-008: CI/CD Pipeline 三阶段
- 分类: workflow
- 置信度: 0.8
- 来源: axiom-seed-migration
- 创建时间: 2026-02-24
- 最后验证: 2026-02-24
- 内容: Lint → Test → Build 三阶段。ultrapower 对应：`npm run lint` → `npm test` → `npm run build`。PR 必须通过 CI 才可合并
- 应用场景: CI 流水线配置和 PR 合并前检查

### K-009: 文档三级规范
- 分类: best-practice
- 置信度: 0.8
- 来源: axiom-seed-migration
- 创建时间: 2026-02-24
- 最后验证: 2026-02-24
- 内容: README（项目概述）+ API Doc（代码注释）+ ADR（架构决策记录）。ultrapower 对应：AGENTS.md + TSDoc + docs/ARCHITECTURE.md
- 应用场景: 文档编写时

### K-010: Feature-First 项目结构
- 分类: architecture
- 置信度: 0.85
- 来源: axiom-seed-migration
- 创建时间: 2026-02-24
- 最后验证: 2026-02-24
- 内容: 按功能（Feature-First）组织代码，而非按类型。ultrapower 对应：`src/hooks/[feature]/`、`src/features/[feature]/`，每个 feature 包含 index.ts + types.ts + constants.ts
- 应用场景: 新模块创建时

## 废弃知识
<!-- 置信度降至 0 以下的知识条目移至此处 -->
