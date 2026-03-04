# Release v5.5.13

**发布日期**: 2026-03-04

## 🐛 Bug Fixes

### Workflow Recommender - 中文语言支持

修复了工作流推荐引擎（Workflow Recommender）的意图分类器不支持中文关键词的问题。

**问题描述**:
- 之前版本使用 `\b` 单词边界符，导致中文关键词无法正确匹配
- 中文查询（如"添加功能"、"修复错误"）无法被正确分类

**修复内容**:
- 移除 `\b` 单词边界符，改用优先级匹配算法
- 为所有 7 种意图类型添加中文关键词支持：
  - `bug-fix`: 修复/错误/问题/故障
  - `refactor`: 重构/优化/改进/整个.*架构
  - `review`: 审查/检查/评审
  - `plan`: 规划/设计/架构
  - `explore`: 探索/分析/调查
  - `feature-multiple`: 添加.*多个/实现.*多个
  - `feature-single`: 添加/实现/创建/构建/登录/功能

**验证结果**:
- ✅ 中文查询正确分类："添加功能"→feature-single, "修复错误"→bug-fix, "重构架构"→refactor
- ✅ 英文查询保持兼容："add feature"→feature-single, "fix error"→bug-fix
- ✅ 完整测试套件通过：5783 passed, 10 skipped

**影响范围**:
- `src/features/workflow-recommender/intent-classifier.ts`
- Wizard skill 的意图分类准确度提升

## 🔧 Other Changes

### CI/CD
- 集成状态清理协议到 CI teardown 流程

### Testing
- 修复 Python REPL bridge-manager 超时测试失败

### Axiom Evolution
- 完成 Cycle 17 进化 - 添加 k-071 Vitest mock 完整性模式

### Bug Fixes
- 修复 HUD 模块中 types.ts 和 autopilot.ts 的循环依赖

## 📊 Test Coverage

- **测试文件**: 319 passed
- **测试用例**: 5783 passed, 10 skipped
- **执行时间**: 28.28 秒
- **状态**: ✅ 所有测试通过

## 📦 Installation

```bash
npm install -g @liangjie559567/ultrapower@5.5.13
```

或通过 Claude Code 插件市场更新：

```bash
claude plugin marketplace update ultrapower
claude plugin uninstall ultrapower
claude plugin install ultrapower
```

## 🔗 Links

- **npm**: https://www.npmjs.com/package/@liangjie559567/ultrapower/v/5.5.13
- **GitHub**: https://github.com/liangjie559567/ultrapower/releases/tag/v5.5.13
- **Documentation**: https://github.com/liangjie559567/ultrapower/blob/dev/README.md

---

**Full Changelog**: https://github.com/liangjie559567/ultrapower/compare/v5.5.12...v5.5.13
