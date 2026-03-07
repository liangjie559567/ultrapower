# Security Vulnerability Analysis Report - Stage 5

**Analysis Date:** 2026-03-06
**Objective:** Identify security vulnerabilities beyond path traversal (command injection, code injection, prototype pollution, insecure deserialization, information disclosure)

---

## Executive Summary

分析了 ultrapower 代码库中的安全漏洞，重点关注命令注入、代码注入、原型污染、不安全反序列化和信息泄露。**发现 3 个中等风险漏洞和 2 个低风险问题**。路径遍历防护已修复（P0）。

---

## [FINDING:S1] Command Injection via Windows Shell Execution

**Vulnerability Type:** Command Injection (CWE-78)
**Severity:** MEDIUM
**Confidence:** HIGH

### Description
在 MCP 服务器（Codex/Gemini）中，Windows 平台使用 `shell: true` 执行外部 CLI 命令。虽然 `model` 参数经过正则验证，但如果攻击者能控制环境变量或工作目录，可能导致命令注入。

### [EVIDENCE:S1]
- **Files:**
  - `src/mcp/gemini-core.ts:119`
  - `src/mcp/codex-core.ts:233`
  - `src/mcp/codex-core.ts:413`
- **Vulnerability Pattern:**
```typescript
const child = spawn('gemini', args, {
  stdio: ['pipe', 'pipe', 'pipe'],
  ...(cwd ? { cwd } : {}),
  ...(process.platform === 'win32' ? { shell: true } : {})
});
```

### Attack Vector
1. `model` 参数通过 `MODEL_NAME_REGEX` 验证（仅允许字母数字、点、连字符、下划线）
2. 但 `cwd` (working_directory) 参数虽有边界检查，在 Windows 上可能包含特殊字符
3. 如果 `cwd` 包含 `&` 或 `|` 等 shell 元字符，可能在 `shell: true` 模式下被解释

### Mitigation Status
**PARTIAL** - `model` 参数已验证，`cwd` 有 worktree 边界检查，但未对 shell 元字符进行清理。

### Recommendation
1. 在 Windows 上避免 `shell: true`，使用 `.cmd` 扩展名显式调用
2. 或对 `cwd` 参数进行 shell 元字符转义验证
3. 添加 `cwd` 路径的字符白名单检查（仅允许字母数字、`/\:.-_`）

---

## [FINDING:S2] Information Disclosure via Error Messages

**Vulnerability Type:** Information Disclosure (CWE-209)
**Severity:** MEDIUM
**Confidence:** HIGH

### Description
多个错误处理路径泄露敏感的内部路径信息、进程 ID 和系统配置，可能帮助攻击者进行侦察。

### [EVIDENCE:S2]
- **Files:**
  - `src/mcp/gemini-core.ts:489` - 泄露 `working_directory` 完整路径
  - `src/mcp/gemini-core.ts:506` - 泄露 `worktreeRoot` 路径
  - `src/mcp/gemini-core.ts:704` - 泄露 PID 和文件路径
  - `src/tools/python-repl/bridge-manager.ts:367` - 泄露 stderr 缓冲区（最多 64KB）
  - `src/mcp/shared-exec.ts:93-96` - 详细错误消息包含路径策略

### Attack Vector
攻击者通过触发错误条件（如无效路径、权限错误）收集：
- 文件系统结构和 worktree 位置
- 进程 ID（用于进程注入攻击）
- Python 环境路径
- 配置策略（`OMC_ALLOW_EXTERNAL_WORKDIR` 等）

### Example Leakage
```typescript
return singleErrorBlock(
  `E_WORKDIR_INVALID: working_directory '${args.working_directory}' is outside the project worktree (${worktreeRoot}).\n` +
  `Requested: ${args.working_directory}\n` +
  `Resolved working directory: ${baseDirReal}\n` +
  `Worktree root: ${worktreeRoot}\n` +
  `Path policy: ${pathPolicy}\n` +
  `Suggested: use a working_directory within the project worktree, or set OMC_ALLOW_EXTERNAL_WORKDIR=1 to bypass`
);
```

### Recommendation
1. 使用通用错误消息，避免泄露完整路径
2. 仅在调试模式下记录详细信息到日志文件
3. 对外部用户返回错误代码而非详细描述
4. 移除 "Suggested" 提示中的环境变量绕过建议

---

## [FINDING:S3] Potential Process Hijacking via PID Reuse

**Vulnerability Type:** Race Condition / Process Hijacking (CWE-367)
**Severity:** LOW
**Confidence:** MEDIUM

### Description
Python bridge 进程管理使用 PID + start time 验证进程身份，但在 `verifyProcessIdentity` 失败时的处理存在竞态窗口。

### [EVIDENCE:S3]
- **File:** `src/tools/python-repl/bridge-manager.ts:170-192`
- **Vulnerable Pattern:**
```typescript
export async function verifyProcessIdentity(meta: BridgeMeta): Promise<boolean> {
  if (!isProcessAlive(meta.pid)) {
    return false;
  }

  if (meta.processStartTime !== undefined) {
    const currentStartTime = await getProcessStartTime(meta.pid);
    if (currentStartTime === undefined) {
      return false; // Fail-closed
    }
    if (currentStartTime !== meta.processStartTime) {
      return false; // PID reuse detected
    }
  }
  return true;
}
```

### Attack Vector
1. 攻击者等待 bridge 进程终止
2. 在 `verifyProcessIdentity` 检查和实际使用 PID 之间的窗口期，启动恶意进程占用相同 PID
3. 如果 `processStartTime` 未记录（旧版本元数据），验证会通过

### Mitigation Status
**GOOD** - 代码已实现 fail-closed 策略，但存在 TOCTOU 窗口。

### Recommendation
1. 在所有 PID 操作前立即重新验证身份
2. 使用进程句柄而非 PID（Windows）或 pidfd（Linux 5.3+）
3. 确保所有新生成的进程都记录 `processStartTime`

---

## [FINDING:S4] Insecure JSON Deserialization - Low Risk

**Vulnerability Type:** Insecure Deserialization (CWE-502)
**Severity:** LOW
**Confidence:** MEDIUM

### Description
代码库中大量使用 `JSON.parse()` 处理外部输入（状态文件、配置文件、MCP 响应），但未对解析后的对象进行原型污染防护。

### [EVIDENCE:S4]
- **Files:** 138 个文件使用 `JSON.parse()`
- **Key Locations:**
  - `src/lib/safe-json.ts:22` - 通用 JSON 解析器，无原型污染检查
  - `src/hooks/bridge-normalize.ts` - Hook 输入解析
  - `src/mcp/job-state-db.ts` - MCP 任务状态反序列化
  - `src/team/inbox-outbox.ts` - 团队消息反序列化

### Attack Vector
攻击者通过构造包含 `__proto__` 或 `constructor.prototype` 的 JSON 污染对象原型：
```json
{
  "__proto__": {
    "isAdmin": true
  }
}
```

### Mitigation Status
**PARTIAL** - 测试用例显示已意识到此问题（`validateMode.test.ts:52` 测试 `__proto__`），但未在所有 JSON 解析点实施防护。

### Recommendation
1. 使用 `JSON.parse()` 的 reviver 函数过滤危险键
2. 或使用 `Object.create(null)` 创建无原型对象
3. 在 `safe-json.ts` 中添加原型污染检测

---

## [FINDING:S5] Sensitive Hook Input Filtering - Good Practice

**Vulnerability Type:** N/A (Security Control)
**Severity:** INFO
**Confidence:** HIGH

### Description
这是一个**正面发现** - `bridge-normalize.ts` 实现了严格的 hook 输入过滤机制，有效防止了注入攻击。

### [EVIDENCE:S5]
- **File:** `src/hooks/bridge-normalize.ts:106-119`
- **Security Controls:**
  1. 敏感 hooks 使用严格白名单（`SENSITIVE_HOOKS`）
  2. Zod schema 验证结构
  3. 未知字段被丢弃并记录警告
  4. 必需字段验证（`REQUIRED_KEYS`）

### Implementation
```typescript
const SENSITIVE_HOOKS = new Set([
  'permission-request',
  'setup-init',
  'setup-maintenance',
  'session-end',
]);

const STRICT_WHITELIST: Record<string, string[]> = {
  'permission-request': ['sessionId', 'toolName', 'toolInput', 'directory', ...],
  'session-end': ['sessionId', 'directory'],
};
```

### Strength
- 防御深度：Zod 验证 + 白名单 + 必需字段检查
- Fail-closed：未知字段被丢弃而非传递
- 审计：所有丢弃操作都记录警告

---

## Non-Findings (Verified Safe)

### ✓ Code Injection (eval/Function)
- **Status:** NOT FOUND
- **Evidence:** 仅在测试文件中使用 `eval()` 和 `new Function()` 用于安全测试
- **Files:** `src/lib/__tests__/plugin-security.test.ts`

### ✓ Prototype Pollution in Object Operations
- **Status:** MITIGATED
- **Evidence:**
  - `validateMode()` 明确拒绝 `__proto__`（`validateMode.test.ts:52`）
  - 测试覆盖原型污染场景（`bridge-security.test.ts:618`）
  - 未发现不安全的 `Object.assign()` 或 spread 操作用于用户输入

### ✓ Shell Injection in spawn() Arguments
- **Status:** MITIGATED
- **Evidence:**
  - 所有 `spawn()` 调用使用数组参数（非字符串）
  - `model` 参数通过严格正则验证
  - 仅在 Windows 上使用 `shell: true`，且参数已验证

---

## Summary Statistics

| Category | Count | Severity Distribution |
|----------|-------|----------------------|
| Command Injection | 1 | MEDIUM |
| Information Disclosure | 1 | MEDIUM |
| Process Hijacking | 1 | LOW |
| Insecure Deserialization | 1 | LOW |
| Security Controls (Positive) | 1 | INFO |
| **Total Findings** | **5** | **2 MEDIUM, 2 LOW, 1 INFO** |

---

## Priority Recommendations

### P1 (High Priority)
1. **[S2] 减少错误消息中的信息泄露**
   - 移除完整路径和环境变量提示
   - 使用错误代码替代详细描述

### P2 (Medium Priority)
2. **[S1] 加固 Windows shell 执行**
   - 对 `cwd` 参数添加字符白名单验证
   - 或避免 `shell: true`，使用显式 `.cmd` 调用

3. **[S4] 添加原型污染防护**
   - 在 `safe-json.ts` 中实现 reviver 函数
   - 过滤 `__proto__`、`constructor`、`prototype` 键

### P3 (Low Priority)
4. **[S3] 增强进程身份验证**
   - 在 PID 操作前重新验证
   - 考虑使用进程句柄（Windows）

---

## Conclusion

ultrapower 代码库的安全态势**良好**。路径遍历防护已修复（P0），hook 输入过滤机制健壮。发现的漏洞主要是信息泄露和边缘情况，无严重的远程代码执行或权限提升风险。

**关键优势：**
- 严格的输入验证（model 名称、agent 角色、路径边界）
- 深度防御（Zod + 白名单 + 必需字段）
- Fail-closed 策略（验证失败时拒绝而非降级）

**改进空间：**
- 减少错误消息详细程度
- 统一 JSON 反序列化安全处理
- 文档化安全假设和威胁模型

---

**Report Generated:** 2026-03-06T18:14:51.454Z
**Analyst:** Scientist Agent
**Stage:** 5 - Security Vulnerability Analysis
