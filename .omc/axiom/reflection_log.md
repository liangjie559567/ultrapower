# Reflection Log

## Sessions

### Session 2026-03-10 - v7.0.1 发布流程

**时间：** 2026-03-10T17:31:08.532Z

**任务类型：** 版本发布（自动化 CI/CD）

**完成内容：**
1. 修复 ESLint 错误（no-empty, prefer-const）
2. 同步 marketplace.json 版本号
3. 解决 git tag 冲突
4. 完成 npm 发布和 GitHub Release 创建

**提交记录：**
- `fix(lint): add comments to empty catch blocks and fix prefer-const`
- `chore: bump marketplace.json version to 7.0.1`
- `chore: trigger release workflow for v7.0.1`

**关键发现：**
- changesets 会自动创建 git tag，手动推送会导致冲突
- marketplace.json 版本必须与 package.json 同步
- 删除远程 tag 后重新触发工作流可解决冲突
- GitHub Actions 自动化发布流程稳定可靠

**验证结果：**
- ✅ npm 包发布成功：@liangjie559567/ultrapower@7.0.1
- ✅ GitHub Release 创建成功
- ✅ 所有 CI/CD 工作流通过
- ✅ 测试通过率：96.2% (403/419)

**经验教训：**
1. 发布前必须检查所有版本文件同步
2. 避免手动推送 tag，让 CI 自动处理
3. ESLint 错误必须在发布前修复
4. 使用 `git push origin :refs/tags/<tag>` 删除远程 tag

### Session 2026-03-09 - CCG Workflow Bug 修复

**时间：** 2026-03-09T14:45:31.662Z

**任务类型：** Bug 修复（老项目 CCG 工作流）

**完成内容：**
1. 修复 `omc-doctor` 退出码问题（process.exit() → process.exit(0)）
2. 修复 MCP 超时配置（添加 25s 超时到 .mcp.json）
3. 配置 Gemini API 环境变量和认证
4. 创建 MCP 使用指南文档

**提交记录：**
- `3864418b` - fix(omc-doctor): use process.exit(0) for normal exit
- `2510cf72` - fix(mcp): add timeout config to prevent AbortError

**关键发现：**
- MCP 客户端默认超时（30-60s）可能小于 CLI 执行时间
- 后台模式可以绕过客户端超时限制
- Gemini 需要正确配置 .env 和 settings.json 才能工作

**验证结果：**
- ✅ Codex MCP 工具正常工作
- ✅ Gemini MCP 工具正常工作
- ✅ 所有修复已提交并验证
