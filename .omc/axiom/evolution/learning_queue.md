# Learning Queue

## Queue

### [P1] 2026-03-08 - Skill Frontmatter 验证模式
**来源**: v5.6.0 发布测试失败
**问题**: 新增 skill 缺少 frontmatter 导致测试失败
**解决**: 创建临时脚本定位空描述 skill
**知识点**:
- Skill 必须包含 frontmatter (name, description)
- 测试同步需更新 3 处：skill 数量、expectedSkills 数组、listBuiltinSkillNames
**优先级**: P1（影响发布流程）

### [P2] 2026-03-08 - npm 发布 Provenance 限制
**来源**: 手动发布 npm 包
**问题**: `--provenance` 仅支持 GitHub Actions 环境
**解决**: 使用 `--no-provenance` 标志
**知识点**: 本地发布必须禁用 provenance，CI 发布可启用
**优先级**: P2（文档改进）

### [P1] 2026-03-08 - 发布流程验证清单
**来源**: v5.6.0 完整发布
**成功模式**:
1. 版本同步（8 个文件）
2. 测试验证（6411 tests）
3. Git 标签推送
4. npm 发布
5. GitHub Release 创建
6. CI 状态验证
**优先级**: P1（核心流程）
