---
name: code-review
description: 运行全面的代码审查
---

# 代码审查 Skill

对代码质量、安全性和可维护性进行全面审查，并提供按严重程度分级的反馈。

## 使用时机

此 skill 在以下情况激活：
- 用户请求 "review this code"、"code review"
- 合并 pull request 之前
- 实现主要功能之后
- 用户需要质量评估

## 功能

委托给 `code-reviewer` agent（Opus 模型）进行深度分析：

1. **识别变更**
   - 运行 `git diff` 查找已更改文件
   - 确定审查范围（特定文件或整个 PR）

2. **审查类别**
   - **安全** —— 硬编码密钥、注入风险、XSS、CSRF
   - **代码质量** —— 函数大小、复杂度、嵌套深度
   - **性能** —— 算法效率、N+1 查询、缓存
   - **最佳实践** —— 命名、文档、错误处理
   - **可维护性** —— 重复、耦合、可测试性

3. **严重程度评级**
   - **CRITICAL** —— 安全漏洞（合并前必须修复）
   - **HIGH** —— Bug 或主要代码异味（合并前应修复）
   - **MEDIUM** —— 次要问题（尽可能修复）
   - **LOW** —— 样式/建议（考虑修复）

4. **具体建议**
   - 每个问题的 file:line 位置
   - 具体修复建议
   - 适用时提供代码示例

## Agent 委托

```
Task(
  subagent_type="ultrapower:code-reviewer",
  model="opus",
  prompt="CODE REVIEW TASK

Review code changes for quality, security, and maintainability.

Scope: [git diff or specific files]

Review Checklist:
- Security vulnerabilities (OWASP Top 10)
- Code quality (complexity, duplication)
- Performance issues (N+1, inefficient algorithms)
- Best practices (naming, documentation, error handling)
- Maintainability (coupling, testability)

Output: Code review report with:
- Files reviewed count
- Issues by severity (CRITICAL, HIGH, MEDIUM, LOW)
- Specific file:line locations
- Fix recommendations
- Approval recommendation (APPROVE / REQUEST CHANGES / COMMENT)"
)
```

## 外部模型咨询（推荐）

code-reviewer agent 应咨询 Codex 进行交叉验证。

### 协议
1. **先独立完成审查** —— 独立完成审查
2. **咨询验证** —— 与 Codex 交叉核对结论
3. **批判性评估** —— 永不盲目采纳外部结论
4. **优雅回退** —— 工具不可用时永不阻塞

### 何时咨询
- 安全敏感的代码变更
- 复杂的架构模式
- 不熟悉的代码库或语言
- 高风险的生产代码

### 何时跳过
- 简单重构
- 熟悉的模式
- 时间紧迫的审查
- 小型、独立的变更

### 工具使用
首次使用 MCP 工具前，调用 `ToolSearch("mcp")` 发现延迟加载的 MCP 工具。
使用 `mcp__x__ask_codex` 配合 `agent_role: "code-reviewer"`。
若 ToolSearch 未找到 MCP 工具，回退到 `code-reviewer` Claude agent。

**注意：** Codex 调用最多需要 1 小时。咨询前请考虑审查时间线。

## Output Format

```
CODE REVIEW REPORT
==================

Files Reviewed: 8
Total Issues: 15

CRITICAL (0)
-----------
(none)

HIGH (3)
--------
1. src/api/auth.ts:42
   Issue: User input not sanitized before SQL query
   Risk: SQL injection vulnerability
   Fix: Use parameterized queries or ORM

2. src/components/UserProfile.tsx:89
   Issue: Password displayed in plain text in logs
   Risk: Credential exposure
   Fix: Remove password from log statements

3. src/utils/validation.ts:15
   Issue: Email regex allows invalid formats
   Risk: Accepts malformed emails
   Fix: Use proven email validation library

MEDIUM (7)
----------
...

LOW (5)
-------
...

RECOMMENDATION: REQUEST CHANGES

Critical security issues must be addressed before merge.
```

## 审查检查清单

code-reviewer agent 检查：

### 安全
- [ ] 无硬编码密钥（API keys、密码、token）
- [ ] 所有用户输入已净化
- [ ] SQL/NoSQL 注入防护
- [ ] XSS 防护（转义输出）
- [ ] 状态变更操作的 CSRF 保护
- [ ] 认证/授权正确执行

### 代码质量
- [ ] 函数 < 50 行（指导原则）
- [ ] 圈复杂度 < 10
- [ ] 无深度嵌套代码（> 4 层）
- [ ] 无重复逻辑（DRY 原则）
- [ ] 清晰、描述性的命名

### 性能
- [ ] 无 N+1 查询模式
- [ ] 适当的缓存
- [ ] 高效算法（O(n) 可行时避免 O(n²)）
- [ ] 无不必要的重渲染（React/Vue）

### 最佳实践
- [ ] 错误处理存在且适当
- [ ] 适当级别的日志记录
- [ ] 公共 API 的文档
- [ ] 关键路径的测试
- [ ] 无注释掉的代码

## 批准标准

**APPROVE** —— 无 CRITICAL 或 HIGH 问题，仅有次要改进
**REQUEST CHANGES** —— 存在 CRITICAL 或 HIGH 问题
**COMMENT** —— 仅有 LOW/MEDIUM 问题，无阻塞性关注点

## 与其他 Skill 配合使用

**与 Pipeline 配合：**
```
/pipeline review "implement user authentication"
```
将代码审查作为实现工作流的一部分。

**与 Ralph 配合：**
```
/ralph code-review then fix all issues
```
审查代码，获取反馈，修复直到批准。

**与 Ultrawork 配合：**
```
/ultrawork review all files in src/
```
跨多个文件并行代码审查。

## 最佳实践

- **尽早审查** —— 在问题积累前发现
- **频繁审查** —— 小而频繁的审查优于大型审查
- **优先处理 CRITICAL/HIGH** —— 立即修复安全和 bug
- **考虑上下文** —— 某些"问题"可能是有意的权衡
- **从审查中学习** —— 利用反馈改进编码实践
