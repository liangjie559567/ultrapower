# Knowledge Base

## Entries

### KB-001: Skill Frontmatter 必需字段
**置信度**: 95%
**来源**: v5.6.0 测试失败分析
**内容**: 所有 skill 必须包含 YAML frontmatter，包含 `name` 和 `description` 字段
**验证**: skills.test.ts 强制验证
**应用场景**: 创建新 skill 时

### KB-002: 测试同步三要素
**置信度**: 100%
**来源**: ccg-workflow skill 集成
**内容**: 新增 skill 需同步更新：
1. skill 数量断言 (toHaveLength)
2. expectedSkills 数组
3. listBuiltinSkillNames 测试
**验证**: 所有测试通过
**应用场景**: skill 增删时

### KB-003: npm Provenance 环境限制
**置信度**: 90%
**来源**: 本地发布失败
**内容**: `npm publish --provenance` 仅在 GitHub Actions 中可用，本地发布需 `--no-provenance`
**验证**: 成功发布 v5.6.0
**应用场景**: 手动发布流程

### KB-004: CCG 功能模块化设计模式
**置信度**: 90%
**来源**: CCG workflow routing 实现
**内容**: 新功能应拆分为独立模块（detector/router/sanitizer/workflow），通过统一入口点组合，避免单体文件膨胀
**验证**: ccg-skill.ts 仅 31 行，职责清晰
**应用场景**: 添加新功能模块时

### KB-005: Ultrapilot 可选功能扩展模式
**置信度**: 95%
**来源**: Architect 任务分解集成
**内容**: 向后兼容的功能扩展应通过可选配置标志（useAIDecomposition）+ 默认值（false）实现，保持既有行为不变
**验证**: 所有 6411 测试通过，无破坏性变更
**应用场景**: 扩展现有系统功能时

### KB-006: 增量功能开发模式
**置信度**: 95%
**来源**: CCG Workflow 路由增强实现
**内容**: 复杂功能应分 3 个 Phase 实现，每个 Phase 独立测试和提交：Phase 1 技术栈检测（5 测试）、Phase 2 项目结构分析（5 测试）、Phase 3 智能任务分配（5 测试）
**验证**: 所有 6426 测试通过，每个 Phase 独立可验证
**应用场景**: 实现跨多个模块的复杂功能时

### KB-007: 文件类型路由模式
**置信度**: 90%
**来源**: CCG task-assigner 实现
**内容**: 基于文件扩展名进行任务分配：UI 文件（.tsx/.jsx/.vue/.css）→ Gemini，逻辑文件（.ts/.js）→ Codex，测试文件 → Codex，混合变更 → Claude 协调
**验证**: 5 个测试用例覆盖所有路由场景
**应用场景**: 多模型协作系统的任务路由设计

### KB-008: 异步文件 I/O 最佳实践
**置信度**: 95%
**来源**: CCG 代码审查修复
**内容**: Node.js 中始终使用 fs.promises 而非同步操作（fs.existsSync/readFileSync），避免阻塞事件循环
**验证**: 修复后所有 6426 测试通过，性能提升
**应用场景**: 所有涉及文件系统操作的代码

### KB-009: 代码审查分级修复策略
**置信度**: 90%
**来源**: CCG 代码审查流程
**内容**: 代码审查问题按严重程度分级修复：CRITICAL/HIGH 优先修复，MEDIUM/LOW 可延后。确保关键问题优先解决
**验证**: 3 个 HIGH 问题全部修复后验证通过
**应用场景**: 代码审查反馈处理流程
