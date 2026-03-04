# Phase 2 集成验证计划

**生成时间**: 2026-03-04 14:54
**目标**: 验证 Phase 2 新功能在实际场景下的可用性

---

## 验证范围

### 1. Wizard (交互式新手引导)
**文件**: `src/features/wizard/`, `skills/wizard/SKILL.md`
**测试场景**:
- [ ] 调用 `/wizard` 触发引导流程
- [ ] 回答 3 个问题（任务类型、项目规模、团队协作）
- [ ] 验证推荐结果是否合理
- [ ] 检查推荐的 agent/skill 是否可执行

**验收标准**: 推荐结果与用户意图匹配，无崩溃

---

### 2. 工作流推荐引擎
**文件**: `src/features/workflow-recommender/`
**测试场景**:
- [ ] 输入不同类型的任务描述
- [ ] 验证意图分类准确性（7 种意图）
- [ ] 验证上下文信号检测（文件数、关键词）
- [ ] 检查推荐置信度是否合理（70-95%）

**验收标准**: 意图分类准确率 >80%，推荐合理

---

### 3. 任务模板库
**文件**: `templates/tasks/`, `src/features/task-templates/`
**测试场景**:
- [ ] 加载 5 个模板（feature-development, bug-fix, code-review, refactoring, security-audit）
- [ ] 验证模板结构完整性
- [ ] 测试 Wizard 集成（模板自动应用）

**验收标准**: 所有模板可加载，结构符合规范

---

### 4. 故障排查手册
**文件**: `docs/troubleshooting/`, `src/features/diagnostics/`
**测试场景**:
- [ ] 触发常见错误（TypeScript 错误、文件系统错误、权限错误）
- [ ] 验证 ErrorMatcher 能否识别错误类别
- [ ] 验证 SolutionSuggester 推荐是否有效
- [ ] 测试与 `/omc-doctor` 的集成

**验收标准**: 错误匹配准确，解决方案可执行

---

## 验证方法

### 快速验证（30 分钟）✅ 已完成
1. ✅ 单元测试回归：`npm test` - 5783 passed, 10 skipped
2. ✅ 类型检查：`tsc --noEmit` - 零错误（已修复 5 个 ESM 导入问题）
3. ✅ 循环依赖：`npx madge --circular --extensions ts src/` - 零依赖

**修复内容**:
- `src/features/diagnostics/index.ts`: 添加 .js 扩展
- `src/features/diagnostics/solution-suggester.ts`: 添加 .js 扩展
- `src/features/task-templates/wizard-integration.ts`: 添加 .js 扩展 + 类型注解
- `src/team/types.ts`: 删除重复的 WorkerBackend/WorkerCapability 定义
- `src/hooks/index.ts`: 修正 HookInput/HookOutput 导出路径

### 功能验证（1-2 小时）✅ 已完成
1. ✅ Wizard (交互式新手引导)
   - 核心逻辑验证通过：WizardEngine 正确处理 3 问题流程
   - 推荐引擎验证通过：single+simple→executor, multiple+independent→ultrawork, single+complex→autopilot
2. ✅ 工作流推荐引擎
   - 基本功能可用：classifyIntent, analyzeContext, getRecommendation 正常工作
   - ⚠️ 发现问题：意图分类准确度不足（3 个不同查询返回相同 feature-single）
3. ✅ 任务模板库
   - 5 个模板加载成功：feature-development, bug-fix, code-review, refactoring, security-audit
   - TemplateLoader 正常工作
4. ✅ 故障排查手册
   - ErrorMatcher 正确识别 TypeScript 错误类别
   - SolutionSuggester 提供对应解决方案

### 集成验证（2-3 小时）✅ 已完成
1. ✅ 在真实项目中使用 Wizard
2. ✅ 测试工作流推荐的端到端流程
3. ✅ 验证故障排查工具的实际效果

### 完整回归测试 ✅ 已完成
- 测试文件：319 passed
- 测试用例：5783 passed, 10 skipped
- 总耗时：28.28秒
- 执行时间：2026-03-04 23:18

---

## 问题追踪

| 功能 | 问题描述 | 严重性 | 状态 |
|------|---------|--------|------|
| 工作流推荐引擎 | 意图分类准确度不足，不支持中文 | P2 | ✅ 已修复 |

**修复内容**:
- 改进意图分类器：优先级匹配 + 中英文支持
- 移除 \b 边界符以支持中文关键词匹配
- 验证通过：中英文意图识别正确，完整测试套件 5783 passed

---

## 验收决策

**✅ 通过** - P2 问题已修复，所有功能验证通过

**通过条件**:
- ✅ 所有测试通过（5783 passed, 10 skipped）
- ✅ 4 个新功能基本可用
- ✅ 无 P0/P1 阻塞问题
- ✅ P2 问题已修复

**下一步行动**: 执行 `/ultrapower:release` 发布 v5.0.24
