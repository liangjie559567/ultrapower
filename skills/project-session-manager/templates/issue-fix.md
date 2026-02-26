# Issue 修复上下文

你正在修复 Issue #{{ISSUE_NUMBER}}：**{{ISSUE_TITLE}}**

## Issue 详情

- **URL**：{{ISSUE_URL}}
- **标签**：{{ISSUE_LABELS}}
- **分支**：`{{BRANCH_NAME}}`

## 描述

{{ISSUE_BODY}}

## 方法

1. **理解 Issue**
   - 如适用，复现问题
   - 找出根本原因
   - 考虑边缘情况

2. **规划修复**
   - 最小化变更以修复问题
   - 不引入回归
   - 考虑向后兼容性

3. **实现**
   - 编写修复代码
   - 添加/更新测试
   - 如需要则更新文档

4. **验证**
   - 运行现有测试
   - 测试具体修复
   - 检查是否有回归

## 命令

```bash
# 运行测试
npm test  # 或适当的测试命令

# 检查构建
npm run build  # 或适当的构建命令

# 完成后创建 PR
gh pr create --title "Fix #{{ISSUE_NUMBER}}: <description>" --body "Fixes #{{ISSUE_NUMBER}}"
```

## 修复清单

- [ ] 已找出根本原因
- [ ] 已实现修复
- [ ] 已添加/更新测试
- [ ] 所有测试通过
- [ ] 未引入回归
- [ ] 已准备好提 PR
