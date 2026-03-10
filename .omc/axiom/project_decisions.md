# Project Decisions

## Architecture Decisions

### AD-001: v7.0.1 发布流程 (2026-03-10)
**决策**: 采用 GitHub Actions 自动化发布流程
**背景**: 手动发布容易出错，需要同步多个版本文件
**方案**:
- 使用 changesets 管理版本和 changelog
- CI 工作流验证代码质量（ESLint + 测试）
- Release 工作流自动发布到 npm 和创建 GitHub Release
**结果**: v7.0.1 成功发布，所有自动化流程正常运行

## Technical Constraints

None recorded yet

## Design Patterns

None recorded yet
