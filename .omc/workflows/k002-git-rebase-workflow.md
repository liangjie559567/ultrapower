# Git Rebase工作流

## 背景
在多人协作中，远程分支经常领先本地分支。使用merge会产生额外的合并提交，污染历史记录。Rebase保持线性历史，便于代码审查和问题追踪。

## 实现步骤

1. **检查本地状态**
   ```bash
   git status
   ```
   确保工作目录干净，无未提交的更改。

2. **执行rebase**
   ```bash
   git pull --rebase origin main
   ```
   将本地提交重新应用到远程最新提交之上。

3. **解决冲突（如有）**
   ```bash
   # 编辑冲突文件
   git add <resolved-files>
   git rebase --continue
   ```

4. **推送更新**
   ```bash
   git push origin <branch>
   ```

## 验证方法

- 检查git log是否为线性历史：`git log --oneline --graph`
- 确认本地提交在远程之后：`git log origin/main..HEAD`
- 验证所有测试通过：`npm test`

## 注意事项

- **不要rebase已推送的公共分支**：会破坏他人的本地历史
- **冲突解决后需要继续**：`git rebase --continue`，不要用merge
- **如果出错可以中止**：`git rebase --abort` 回到原始状态
- **强制推送需谨慎**：仅在确认无他人依赖时使用 `git push --force-with-lease`
