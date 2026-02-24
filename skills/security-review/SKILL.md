---
name: security-review
description: 对代码运行全面安全审查
---

# Security Review Skill

进行彻底的安全审计，检查 OWASP Top 10 漏洞、硬编码密钥和不安全模式。

## 使用时机

此 skill 在以下情况激活：
- 用户请求"security review"、"security audit"
- 编写处理用户输入的代码后
- 添加新 API 端点后
- 修改认证/授权逻辑后
- 部署到生产环境前
- 添加外部依赖后

## 功能

委托给 `security-reviewer` agent（Opus 模型）进行深度安全分析：

1. **OWASP Top 10 扫描**
   - A01: 访问控制失效
   - A02: 加密失败
   - A03: 注入（SQL、NoSQL、命令、XSS）
   - A04: 不安全设计
   - A05: 安全配置错误
   - A06: 易受攻击和过时的组件
   - A07: 身份识别和认证失败
   - A08: 软件和数据完整性失败
   - A09: 安全日志和监控失败
   - A10: 服务端请求伪造（SSRF）

2. **密钥检测**
   - 硬编码 API 密钥
   - 源代码中的密码
   - 仓库中的私钥
   - Token 和凭证
   - 含密钥的连接字符串

3. **输入验证**
   - 所有用户输入已净化
   - SQL/NoSQL 注入防护
   - 命令注入防护
   - XSS 防护（输出转义）
   - 路径遍历防护

4. **认证/授权**
   - 正确的密码哈希（bcrypt、argon2）
   - Session 管理安全
   - 访问控制执行
   - JWT 实现安全

5. **依赖安全**
   - 运行 `npm audit` 检查已知漏洞
   - 检查过时依赖
   - 识别高严重性 CVE

## Agent 委托

```
Task(
  subagent_type="ultrapower:security-reviewer",
  model="opus",
  prompt="SECURITY REVIEW TASK

Conduct comprehensive security audit of codebase.

Scope: [specific files or entire codebase]

Security Checklist:
1. OWASP Top 10 scan
2. Hardcoded secrets detection
3. Input validation review
4. Authentication/authorization review
5. Dependency vulnerability scan (npm audit)

Output: Security review report with:
- Summary of findings by severity (CRITICAL, HIGH, MEDIUM, LOW)
- Specific file:line locations
- CVE references where applicable
- Remediation guidance for each issue
- Overall security posture assessment"
)
```

## 外部模型咨询（推荐）

security-reviewer agent 应咨询 Codex 进行交叉验证。

### 协议
1. **先形成自己的安全分析** - 独立完成审查
2. **咨询以验证** - 与 Codex 交叉检查发现
3. **批判性评估** - 绝不盲目采纳外部发现
4. **优雅降级** - 工具不可用时绝不阻塞

### 何时咨询
- 认证/授权代码
- 加密实现
- 不可信数据的输入验证
- 高风险漏洞模式
- 生产部署代码

### 何时跳过
- 低风险工具代码
- 经过充分审计的模式
- 时间紧迫的安全评估
- 已有安全测试的代码

### 工具使用
首次使用 MCP 工具前，调用 `ToolSearch("mcp")` 发现延迟加载的 MCP 工具。
使用 `mcp__x__ask_codex`，`agent_role: "security-reviewer"`。
如果 ToolSearch 未找到 MCP 工具，回退到 `security-reviewer` Claude agent。

**注意：** 安全第二意见价值高。考虑对 CRITICAL/HIGH 发现进行咨询。

## 输出格式

```
SECURITY REVIEW REPORT
======================

Scope: Entire codebase (42 files scanned)
Scan Date: 2026-01-24T14:30:00Z

CRITICAL (2)
------------
1. src/api/auth.ts:89 - Hardcoded API Key
   Finding: AWS API key hardcoded in source code
   Impact: Credential exposure if code is public or leaked
   Remediation: Move to environment variables, rotate key immediately
   Reference: OWASP A02:2021 – Cryptographic Failures

2. src/db/query.ts:45 - SQL Injection Vulnerability
   Finding: User input concatenated directly into SQL query
   Impact: Attacker can execute arbitrary SQL commands
   Remediation: Use parameterized queries or ORM
   Reference: OWASP A03:2021 – Injection

HIGH (5)
--------
3. src/auth/password.ts:22 - Weak Password Hashing
   Finding: Passwords hashed with MD5 (cryptographically broken)
   Impact: Passwords can be reversed via rainbow tables
   Remediation: Use bcrypt or argon2 with appropriate work factor
   Reference: OWASP A02:2021 – Cryptographic Failures

4. src/components/UserInput.tsx:67 - XSS Vulnerability
   Finding: User input rendered with dangerouslySetInnerHTML
   Impact: Cross-site scripting attack vector
   Remediation: Sanitize HTML or use safe rendering
   Reference: OWASP A03:2021 – Injection (XSS)

5. src/api/upload.ts:34 - Path Traversal Vulnerability
   Finding: User-controlled filename used without validation
   Impact: Attacker can read/write arbitrary files
   Remediation: Validate and sanitize filenames, use allowlist
   Reference: OWASP A01:2021 – Broken Access Control

...

MEDIUM (8)
----------
...

LOW (12)
--------
...

DEPENDENCY VULNERABILITIES
--------------------------
Found 3 vulnerabilities via npm audit:

CRITICAL: axios@0.21.0 - Server-Side Request Forgery (CVE-2021-3749)
  Installed: axios@0.21.0
  Fix: npm install axios@0.21.2

HIGH: lodash@4.17.19 - Prototype Pollution (CVE-2020-8203)
  Installed: lodash@4.17.19
  Fix: npm install lodash@4.17.21

...

OVERALL ASSESSMENT
------------------
Security Posture: POOR (2 CRITICAL, 5 HIGH issues)

Immediate Actions Required:
1. Rotate exposed AWS API key
2. Fix SQL injection in db/query.ts
3. Upgrade password hashing to bcrypt
4. Update vulnerable dependencies

Recommendation: DO NOT DEPLOY until CRITICAL and HIGH issues resolved.
```

## 安全清单

security-reviewer agent 验证：

### 认证与授权
- [ ] 密码使用强算法哈希（bcrypt/argon2）
- [ ] Session token 加密随机
- [ ] JWT token 正确签名和验证
- [ ] 所有受保护资源强制执行访问控制
- [ ] 无认证绕过漏洞

### 输入验证
- [ ] 所有用户输入已验证和净化
- [ ] SQL 查询使用参数化（无字符串拼接）
- [ ] NoSQL 查询防止注入
- [ ] 文件上传已验证（类型、大小、内容）
- [ ] URL 已验证以防止 SSRF

### 输出编码
- [ ] HTML 输出已转义以防止 XSS
- [ ] JSON 响应正确编码
- [ ] 错误消息中无用户数据
- [ ] 已设置 Content-Security-Policy 头

### 密钥管理
- [ ] 无硬编码 API 密钥
- [ ] 源代码中无密码
- [ ] 仓库中无私钥
- [ ] 密钥使用环境变量
- [ ] 密钥未在日志或错误中暴露

### 加密
- [ ] 使用强算法（AES-256、RSA-2048+）
- [ ] 正确的密钥管理
- [ ] 随机数生成加密安全
- [ ] 敏感数据强制使用 TLS/HTTPS

### 依赖
- [ ] 依赖中无已知漏洞
- [ ] 依赖已更新
- [ ] 无 CRITICAL 或 HIGH CVE
- [ ] 依赖来源已验证

## 严重性定义

**CRITICAL** - 可利用的漏洞，影响严重（数据泄露、RCE、凭证盗窃）
**HIGH** - 需要特定条件但影响严重的漏洞
**MEDIUM** - 影响有限或难以利用的安全弱点
**LOW** - 最佳实践违规或轻微安全问题

## 修复优先级

1. **轮换暴露的密钥** - 立即（1 小时内）
2. **修复 CRITICAL** - 紧急（24 小时内）
3. **修复 HIGH** - 重要（1 周内）
4. **修复 MEDIUM** - 计划（1 个月内）
5. **修复 LOW** - 积压（方便时）

## 与其他 Skill 配合使用

**与 Pipeline：**
```
/pipeline security "review authentication module"
```
使用：explore → security-reviewer → executor → security-reviewer-low（重新验证）

**与 Swarm：**
```
/swarm 4:security-reviewer "audit all API endpoints"
```
跨多个端点并行安全审查。

**与 Ralph：**
```
/ralph security-review then fix all issues
```
审查、修复、重新审查，直到所有问题解决。

## 最佳实践

- **尽早审查** - 安全设计，而非事后补救
- **频繁审查** - 每次主要功能或 API 变更后
- **自动化** - 在 CI/CD 流水线中运行安全扫描
- **立即修复** - 不要积累安全债务
- **学习** - 从发现中学习以防止未来问题
- **验证修复** - 修复后重新运行安全审查
