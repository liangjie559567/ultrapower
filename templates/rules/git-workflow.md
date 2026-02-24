# Git 工作流规则

## 提交信息格式

```
<type>: <description>

<optional body>
```

类型：feat, fix, refactor, docs, test, chore, perf, ci

## Pull Request 工作流

创建 PR 时：
1. 分析完整提交历史（不只是最新提交）
2. 使用 `git diff [base-branch]...HEAD` 查看所有变更
3. 起草全面的 PR 摘要
4. 包含带 TODO 的测试计划
5. 新分支使用 `-u` 标志推送

## 功能实现工作流

1. **先规划** - 使用 `planner` agent
2. **TDD 方式** - 使用 `tdd-guide` agent
3. **代码审查** - 编写代码后使用 `code-reviewer` agent
4. **提交** - 遵循 conventional commits 格式

## 分支命名

- `feature/` - 新功能
- `fix/` - Bug 修复
- `refactor/` - 代码重构
- `docs/` - 文档变更

## [自定义] 项目特定 Git 规则

在此添加项目特定的 git 工作流：
- 分支保护规则
- 必需的审查者
- CI/CD 要求
