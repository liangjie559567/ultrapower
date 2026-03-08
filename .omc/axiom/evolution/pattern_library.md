# Pattern Library

## Patterns

### PAT-001: 发布流程标准模式
**出现次数**: 1
**置信度**: 85%
**模式描述**:
```
1. 版本同步（package.json + 7个配置文件）
2. 运行完整测试套件
3. Git commit + tag
4. npm publish
5. GitHub Release
6. CI 验证
```
**适用场景**: npm 包发布
**反模式**: 跳过测试或版本同步

### PAT-002: Skill 集成检查清单
**出现次数**: 1
**置信度**: 90%
**模式描述**:
```
1. 创建 skills/<name>/SKILL.md（含 frontmatter）
2. 更新 skills.test.ts（3处同步）
3. 运行测试验证
4. 更新 CHANGELOG.md
```
**适用场景**: 新增或修改 skill
**反模式**: 仅创建文件不更新测试

### PAT-003: 临时诊断脚本模式
**出现次数**: 1
**置信度**: 80%
**模式描述**: 创建临时 .mjs 脚本快速定位问题，用完即删
**适用场景**: 测试失败根因不明确时
**示例**: check-skills.mjs 定位空描述 skill
