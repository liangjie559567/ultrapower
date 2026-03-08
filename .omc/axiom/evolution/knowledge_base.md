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
