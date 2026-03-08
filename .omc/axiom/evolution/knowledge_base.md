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
