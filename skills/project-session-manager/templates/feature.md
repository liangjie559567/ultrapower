# 功能开发上下文

你正在开发功能：**{{FEATURE_NAME}}**

## 详情

- **分支**：`{{BRANCH_NAME}}`
- **基础分支**：`{{BASE_BRANCH}}`
- **项目**：{{PROJECT}}

## 功能范围

{{FEATURE_DESCRIPTION}}

## 开发方法

1. **规划**
   - 定义需求
   - 拆分为子任务
   - 识别依赖关系

2. **实现**
   - 遵循项目模式
   - 编写简洁、可测试的代码
   - 增量提交

3. **测试**
   - 为新代码编写单元测试
   - 如需要则编写集成测试
   - 手动测试

4. **文档**
   - 更新相关文档
   - 在需要的地方添加代码注释
   - 如适用则更新 CHANGELOG

## 命令

```bash
# 运行测试
npm test  # 或适当的测试命令

# 检查构建
npm run build  # 或适当的构建命令

# 准备好后创建 PR
gh pr create --title "Feature: {{FEATURE_NAME}}" --body "## Summary\n\n<description>\n\n## Changes\n\n- <change 1>\n- <change 2>"
```

## 功能清单

- [ ] 已理解需求
- [ ] 实现完成
- [ ] 测试已编写并通过
- [ ] 文档已更新
- [ ] 已准备好提 PR
