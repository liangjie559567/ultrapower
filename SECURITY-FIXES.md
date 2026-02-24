# PR #135 安全修复

## 摘要

修复了权限处理系统中三个可能允许任意命令执行的关键安全漏洞。

## 变更内容

### 1. Shell 元字符注入防护（严重）

**文件：** `src/hooks/permission-handler/index.ts`

**问题：** 原始的 `isSafeCommand()` 只检查命令是否以安全模式开头，但没有防止 shell 元字符注入。攻击者可以通过以下命令绕过安全模式检查：
- `git status; rm -rf /`（分号链接）
- `git status && malicious`（AND 链接）
- `git status | sh`（管道到 shell）
- `git status $(whoami)`（命令替换）

**修复：** 添加了 `DANGEROUS_SHELL_CHARS` 正则表达式，拒绝任何包含 shell 元字符的命令：
```typescript
const DANGEROUS_SHELL_CHARS = /[;&|`$()<>\n\\]/;
```

此正则表达式阻止：
- `;` - 命令链接
- `&` - 后台执行和 AND/OR 运算符
- `|` - 管道到其他命令
- `` ` `` - 命令替换（反引号）
- `$` - 变量展开和命令替换
- `()` - 子 shell 执行
- `<>` - 重定向运算符
- `\n` - 换行注入
- `\\` - 转义序列

### 2. 活跃模式全量自动批准已移除（严重）

**问题：** 原始代码有两个独立检查：
1. 自动批准安全命令
2. 在活跃模式（autopilot/ralph/ultrawork）期间自动批准所有命令

这意味着在活跃模式期间，即使是危险命令如 `rm -rf /` 也会在没有用户确认的情况下被自动批准。

**修复：** 将活跃模式检查改为需要同时满足两个条件：
```typescript
// Before (INSECURE):
if (isActiveModeRunning(input.cwd)) {
  return { continue: true, decision: { behavior: 'allow' } };
}

// After (SECURE):
if (isActiveModeRunning(input.cwd) && isSafeCommand(command)) {
  return { continue: true, decision: { behavior: 'allow' } };
}
```

现在在活跃模式期间，只有通过安全命令检查（包括 shell 元字符验证）的命令才会被自动批准。

### 3. 移除不安全的文件读取器（高危）

**问题：** 安全模式包含 `cat`、`head` 和 `tail`，允许读取任意文件，包括：
- `/etc/passwd` - 系统用户信息
- `/etc/shadow` - 密码哈希
- `~/.ssh/id_rsa` - 私有 SSH 密钥
- `.env` 文件 - 环境密钥
- 任何其他敏感文件

**修复：** 从 `SAFE_PATTERNS` 中移除了这些模式：
```typescript
// REMOVED:
/^cat /,
/^head /,
/^tail /,
```

这些命令应通过正常权限流程，用户可以逐案批准/拒绝文件访问。

## 测试

创建了包含 69 个测试的全面测试套件，覆盖：

### Shell 注入防护（16 个测试）
- 分号链接变体
- 管道链接
- AND/OR 运算符
- 命令替换（反引号和 `$()`）
- 变量展开
- 重定向攻击
- 子 shell 执行
- 换行注入
- 反斜杠转义

### 活跃模式安全（4 个测试）
- 活跃模式期间安全命令仍然自动批准
- 活跃模式期间危险命令不自动批准
- 活跃模式期间 shell 注入不自动批准
- 活跃模式期间已移除的不安全命令不自动批准

### 已移除的不安全命令（5 个测试）
- `cat /etc/passwd`
- `cat ~/.ssh/id_rsa`
- `head /etc/shadow`
- `tail /var/log/auth.log`
- `cat secrets.env`

### 安全命令（22 个测试）
验证合法的安全命令仍然正常工作：
- Git 读取操作
- 测试运行器（npm、pnpm、yarn、pytest、cargo）
- 类型检查和 lint（tsc、eslint、prettier）
- 基本文件列表（ls）

## 验证

```bash
# TypeScript compilation
npx tsc --noEmit
✓ No errors

# All tests pass
npm test
✓ 966 tests passed
✓ 0 failures

# Permission handler specific tests
npm test src/hooks/permission-handler/__tests__/index.test.ts
✓ 69 tests passed
```

## 影响

这些修复防止了：
1. **命令注入攻击** - 攻击者无法将恶意命令链接到安全命令
2. **权限提升** - 活跃模式不再自动批准危险命令
3. **任意文件访问** - 从自动批准中移除了不安全的文件读取命令

权限系统现在在自动批准前正确验证所有命令，确保：
- 只有真正安全的命令才会被自动批准
- Shell 元字符被完全阻止
- 文件访问通过正常权限流程控制
- 活跃模式维持安全边界

## 变更的文件

- `src/hooks/permission-handler/index.ts` - 安全修复
- `src/hooks/permission-handler/__tests__/index.test.ts` - 全面测试覆盖（新增）
- `SECURITY-FIXES.md` - 本文档（新增）
