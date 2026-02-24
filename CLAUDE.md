# 开发规范

## 分支策略
- **默认基础分支：`dev`**（不是 `main`）
- 所有 PR 必须以 `dev` 分支为目标
- 禁止直接创建以 `main` 为目标的 PR
- 始终从 `dev` 创建 worktree：`git worktree add <path> -b <branch> dev`

## 创建 PR
创建 PR 时，始终使用：
```
gh pr create --base dev ...
```

## 提交规范
- 所有提交信息、PR 标题和 issue 评论使用英文
- 格式：`type(scope): description`
