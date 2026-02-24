---
name: build-fix
description: Fix build and TypeScript errors with minimal changes
---

# 构建修复 Skill

快速修复构建和编译错误，代码改动最小化。在不重构的情况下让构建变绿。

## 使用时机

此 skill 在以下情况激活：
- 用户说 "fix the build"、"build is broken"
- TypeScript 编译失败
- 构建命令或类型检查器报告错误
- 用户请求对错误进行 "minimal fixes"

## 功能

委托给 `build-fixer` agent（Sonnet 模型）执行：

1. **收集错误**
   - 运行项目的类型检查命令（如 `tsc --noEmit`、`mypy`、`cargo check`、`go vet`）
   - 或运行项目构建命令获取构建失败信息
   - 按类型和严重程度分类错误

2. **策略性修复**
   - 在缺失处添加类型注解
   - 在需要处添加 null 检查
   - 修复 import/export 语句
   - 解决模块解析问题
   - 修复阻塞构建的 linter 错误

3. **最小差异策略**
   - 不重构无关代码
   - 不进行架构变更
   - 不进行性能优化
   - 仅做让构建通过所必需的修改

4. **验证**
   - 每次修复后运行项目类型检查命令
   - 确保未引入新错误
   - 构建通过后停止

## Agent 委托

```
Task(
  subagent_type="ultrapower:build-fixer",
  model="sonnet",
  prompt="BUILD FIX TASK

Fix all build and TypeScript errors with minimal changes.

Requirements:
- Run tsc/build to collect errors
- Fix errors one at a time
- Verify each fix doesn't introduce new errors
- NO refactoring, NO architectural changes
- Stop when build passes

Output: Build error resolution report with:
- List of errors fixed
- Lines changed per fix
- Final build status"
)
```

## 停止条件

build-fixer agent 在以下情况停止：
- 类型检查命令以退出码 0 退出
- 构建命令成功完成
- 未引入新错误

## 输出格式

```
BUILD FIX REPORT
================

Errors Fixed: 12
Files Modified: 8
Lines Changed: 47

Fixes Applied:
1. src/utils/validation.ts:15 - Added return type annotation
2. src/components/Header.tsx:42 - Added null check for props.user
3. src/api/client.ts:89 - Fixed import path for axios
...

Final Build Status: ✓ PASSING
Verification: [type check command] (exit code 0)
```

## 最佳实践

- **每次一个修复** —— 更易于验证和调试
- **最小改动** —— 修复时不重构
- **记录原因** —— 对不明显的修复添加注释
- **之后测试** —— 确保测试仍然通过

## 与其他 Skill 配合使用

与其他 skill 组合进行全面修复：

**与 Ultrawork 配合：**
```
/ultrawork fix all build errors
```
为不同文件并行生成多个 build-fixer agent。

**与 Ralph 配合：**
```
/ralph fix the build
```
持续尝试直到构建通过，即使需要多次迭代。

**与 Pipeline 配合：**
```
/pipeline debug "build is failing"
```
使用：explore → architect → build-fixer 工作流。
