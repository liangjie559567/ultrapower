# Sub-PRD: T-1h — daemon.ts 临时文件方案替代代码注入

**任务 ID:** T-1h
**目标文件:** `src/features/rate-limit-wait/daemon.ts`
**估计工时:** 5h
**依赖:** T-1g（串行：共同修改子进程通信路径）
**状态:** 待实现
**生成时间:** 2026-02-26

---

## 问题分析

### 当前实现的漏洞（第 425-430 行）

```typescript
const daemonScript = `
  import('${modulePath}').then(({ pollLoop }) => {
    const config = ${JSON.stringify(cfg)};
    return pollLoop(config);
  }).catch((err) => { console.error(err); process.exit(1); });
`;

const child = spawn('node', ['-e', daemonScript], { ... });
```

### 代码注入风险矩阵

| 风险点 | 触发条件 | 影响 |
|--------|---------|------|
| 反引号注入 | `cfg` 中任何字段含反引号（ ` ）| 破坏模板字符串语法，导致语法错误或代码执行异常 |
| 换行符注入 | `cfg.stateFilePath` 含 `\n` | `-e` 参数被 shell 解析时可能截断脚本 |
| 引号注入 | `cfg.logFilePath` 含单/双引号 | JSON.stringify 虽会转义引号，但与模板字符串边界组合可能产生歧义 |
| Unicode 注入 | 路径含特殊 Unicode 字符 | 某些平台的 `spawn` 参数传递可能产生编码问题 |
| Windows 路径 | 反斜杠在 `-e` 脚本中 | `C:\Users\...` 在字符串字面量中需转义 |

### 根因

`JSON.stringify(cfg)` 将对象序列化为 JSON 字符串并直接嵌入 JavaScript 源代码。虽然 `JSON.stringify` 本身正确转义 JSON 特殊字符，但当该字符串嵌入模板字面量（`` ` `` 分隔符）时：

1. 若 `cfg` 中的字符串值含有反引号，模板字面量提前终止
2. `node -e` 的参数长度限制在某些操作系统下为 131072 字节（Linux ARG_MAX），大型 config 对象可能超限
3. 代码可读性差，调试困难——子进程崩溃时无法获得清晰的错误信息

---

## 架构约束分析

### 不可变约束

| 约束 | 来源 | 原因 |
|------|------|------|
| `stdio: 'ignore'` 必须保持 | fire-and-forget daemon 设计 | 父进程 `child.unref()` 后立即退出，stdin/stdout pipe 会阻止进程独立运行 |
| 不使用环境变量直接传 config | 安全 + 兼容性 | Windows 环境块上限约 32KB；`/proc/*/environ` 暴露敏感数据 |
| 不使用 stdin 方案 | `stdio: 'ignore'` 冲突 | `stdio: 'ignore'` 将 stdin 设为 `/dev/null`，子进程无法从 stdin 读取 |
| `createMinimalDaemonEnv()` 的 allowlist 机制 | 防止凭证泄漏 | 只传递安全的系统环境变量 |

### T-1g 的决定（依赖项）

T-1g 决定子进程是否继续使用 `-e` 内联脚本模式还是改用独立 `.js` 文件。本任务（T-1h）在 T-1g 基础上处理 config 传递问题：

- **如果 T-1g 保留 `-e` 模式：** T-1h 修改 daemonScript，使其从临时文件读取 config 而非内联 JSON
- **如果 T-1g 改用文件模式：** T-1h 同样在文件中添加从临时文件读取 config 的逻辑

两种情况的临时文件方案设计一致，差异仅在于读取代码的载体。

---

## 修复方案设计

### 总体思路

```
父进程                          子进程
─────────────────────────────────────────────────────
1. cfg → JSON.stringify
2. 写入 /tmp/omc-daemon-cfg-{uuid}.json (mode 0600)
3. env['OMC_DAEMON_CONFIG_FILE'] = tmpPath
4. spawn('node', ['-e', daemonScript], { env })
5. child.unref()                  6. 读取 OMC_DAEMON_CONFIG_FILE
                                  7. fs.unlinkSync(tmpPath)  ← 立即删除
                                  8. JSON.parse → config
                                  9. pollLoop(config)
```

### 临时文件规格

| 属性 | 规格 |
|------|------|
| 目录 | `os.tmpdir()`（跨平台，尊重 TMPDIR/TMP/TEMP 环境变量） |
| 文件名 | `omc-daemon-cfg-{uuid}.json`（UUID 由 `crypto.randomUUID()` 生成） |
| 权限 | `0o600`（仅所有者读写，与现有 `SECURE_FILE_MODE` 一致） |
| 格式 | `JSON.stringify(cfg, null, 0)`（紧凑 JSON，无多余空白） |
| 编码 | UTF-8 |
| 生命周期 | 父进程写入 → 子进程读取后立即 `unlink` |

### UUID 生成方案

使用 Node.js 内置 `crypto.randomUUID()`（Node 14.17.0+ 可用，无需额外依赖）：

```typescript
import { randomUUID } from 'crypto';
// 生成如：'9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
const uuid = randomUUID();
const tmpPath = join(tmpdir(), `omc-daemon-cfg-${uuid}.json`);
```

**不使用 `Math.random()` 的原因：** 安全随机性不足，存在碰撞风险（虽然概率极低）。

### 父进程写入逻辑

```typescript
// 伪代码（实际实现由 executor 完成）
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { writeFileSync, chmodSync } from 'fs';
import { join } from 'path';

function writeDaemonConfigFile(cfg: Required<DaemonConfig>): string {
  const uuid = randomUUID();
  const tmpPath = join(tmpdir(), `omc-daemon-cfg-${uuid}.json`);
  const content = JSON.stringify(cfg);

  // 先写入，再设置权限（原子性：避免写入期间被读取）
  writeFileSync(tmpPath, content, { encoding: 'utf-8', mode: 0o600 });

  return tmpPath;
}
```

**错误处理：** 如果 `writeFileSync` 抛出（磁盘满、权限不足），`startDaemon` 函数的外层 `try/catch` 会捕获并返回 `{ success: false, message: ..., error: ... }`。无需降级到旧方案（旧方案本身是安全漏洞）。

### 子进程读取逻辑（内联 daemonScript 版本）

```typescript
// 伪代码（实际内联于 daemonScript 字符串中）
const daemonScript = `
  import { readFileSync, unlinkSync } from 'fs';
  import { fileURLToPath } from 'url';

  const configPath = process.env.OMC_DAEMON_CONFIG_FILE;
  if (!configPath) {
    console.error('[daemon] OMC_DAEMON_CONFIG_FILE not set');
    process.exit(1);
  }

  let config;
  try {
    const raw = readFileSync(configPath, 'utf-8');
    config = JSON.parse(raw);
  } catch (err) {
    console.error('[daemon] Failed to read config file:', err.message);
    process.exit(1);
  } finally {
    // 原子清理：无论成功失败都删除临时文件
    try { unlinkSync(configPath); } catch {}
  }

  import('${modulePath}').then(({ pollLoop }) => {
    return pollLoop(config);
  }).catch((err) => { console.error(err); process.exit(1); });
`;
```

**关键设计决策：**
- `unlinkSync` 放在 `finally` 块确保即使 `JSON.parse` 失败也会清理文件
- 子进程中的 `try/catch` 独立于父进程——父进程已 `unref()` 无法感知子进程的清理结果
- 使用 `unlinkSync` 而非异步 `unlink`——子进程启动阶段同步代码更简单可靠

### env 传递

```typescript
const daemonEnv = createMinimalDaemonEnv();
daemonEnv['OMC_DAEMON_CONFIG_FILE'] = tmpPath;  // 添加临时文件路径

const child = spawn('node', ['-e', daemonScript], {
  detached: true,
  stdio: 'ignore',
  cwd: process.cwd(),
  env: daemonEnv,  // 包含临时文件路径的环境
});
```

**为何环境变量传路径是安全的：**
- 路径本身不含敏感数据（仅 UUID 文件名）
- 路径长度远小于 Windows 32KB 限制
- `/proc/*/environ` 暴露的是路径而非 config 内容（文件已被子进程删除）

---

## POC 验证方案

### 验证目标

1. 证明临时文件被正确写入并拥有 0600 权限
2. 证明子进程成功读取 config 并启动
3. 证明子进程启动后临时文件被删除（不残留）
4. 证明含特殊字符的 config 能正确传递

### 验证脚本（手动 POC）

```bash
# 在项目根目录执行
node --input-type=module << 'EOF'
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { writeFileSync, existsSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';

// 模拟含特殊字符的 config
const cfg = {
  pollIntervalMs: 60000,
  stateFilePath: '/home/user/.omc/state/daemon.json',
  // 特殊字符测试：反引号、换行、引号
  logFilePath: '/tmp/test`log\n"path"/daemon.log',
  verbose: false,
};

const uuid = randomUUID();
const tmpPath = join(tmpdir(), `omc-daemon-cfg-${uuid}.json`);

// 写入
writeFileSync(tmpPath, JSON.stringify(cfg), { encoding: 'utf-8', mode: 0o600 });

// 验证文件存在和权限
const stat = statSync(tmpPath);
console.log('文件存在:', existsSync(tmpPath));
console.log('权限:', (stat.mode & 0o777).toString(8));  // 应为 '600'

// 模拟子进程读取和删除
const raw = readFileSync(tmpPath, 'utf-8');
const parsed = JSON.parse(raw);
unlinkSync(tmpPath);

console.log('解析成功:', JSON.stringify(parsed) === JSON.stringify(cfg));
console.log('文件已删除:', !existsSync(tmpPath));
console.log('含特殊字符的路径完整保留:', parsed.logFilePath === cfg.logFilePath);
EOF
```

### 预期输出

```
文件存在: true
权限: 600
解析成功: true
文件已删除: true
含特殊字符的路径完整保留: true
```

---

## 实现步骤

### 步骤 1：添加必要 import（第 15-18 行区域）

在现有 import 中添加：
- `import { tmpdir } from 'os';`（已有 `homedir`，同模块）
- `import { randomUUID } from 'crypto';`

### 步骤 2：添加 `writeDaemonConfigFile` 函数

在 `createMinimalDaemonEnv` 函数（第 83 行）之前添加新函数：

```typescript
/**
 * Write daemon config to a temporary file for secure IPC.
 * Returns the temp file path. Caller is responsible for adding
 * the path to daemon env as OMC_DAEMON_CONFIG_FILE.
 * The daemon subprocess will delete the file after reading.
 */
function writeDaemonConfigFile(cfg: Required<DaemonConfig>): string {
  const uuid = randomUUID();
  const tmpPath = join(tmpdir(), `omc-daemon-cfg-${uuid}.json`);
  writeFileSync(tmpPath, JSON.stringify(cfg), { encoding: 'utf-8', mode: 0o600 });
  return tmpPath;
}
```

### 步骤 3：修改 `startDaemon` 函数（第 422-440 行）

替换 daemonScript 的 config 注入方式，并在 env 中加入临时文件路径：

**修改前（第 425-440 行）：**
```typescript
const daemonScript = `
  import('${modulePath}').then(({ pollLoop }) => {
    const config = ${JSON.stringify(cfg)};
    return pollLoop(config);
  }).catch((err) => { console.error(err); process.exit(1); });
`;

const child = spawn('node', ['-e', daemonScript], {
  detached: true,
  stdio: 'ignore',
  cwd: process.cwd(),
  env: createMinimalDaemonEnv(),
});
```

**修改后：**
```typescript
// Write config to temp file for safe IPC (avoids code injection via JSON.stringify)
const configFilePath = writeDaemonConfigFile(cfg);

const daemonScript = `
  import { readFileSync as _rfs, unlinkSync as _uls } from 'fs';
  const _cfgPath = process.env.OMC_DAEMON_CONFIG_FILE;
  let _config;
  try {
    _config = JSON.parse(_rfs(_cfgPath, 'utf-8'));
  } catch(_e) {
    console.error('[daemon] config read failed:', _e.message);
    process.exit(1);
  } finally {
    try { _uls(_cfgPath); } catch {}
  }
  import('${modulePath}').then(({ pollLoop }) => {
    return pollLoop(_config);
  }).catch((err) => { console.error(err); process.exit(1); });
`;

const daemonEnv = createMinimalDaemonEnv();
daemonEnv['OMC_DAEMON_CONFIG_FILE'] = configFilePath;

const child = spawn('node', ['-e', daemonScript], {
  detached: true,
  stdio: 'ignore',
  cwd: process.cwd(),
  env: daemonEnv,
});
```

**注意：** 变量名使用下划线前缀（`_rfs`, `_uls`, `_cfgPath`, `_config`）以避免与 `import()` 模块中的同名变量冲突（内联脚本共享作用域）。

### 步骤 4：错误处理增强

在 `startDaemon` 的 `catch` 块中，若 `writeDaemonConfigFile` 抛出，需确保不残留临时文件。由于写入失败时文件不存在，无需额外清理。但若写入成功后 `spawn` 失败，需清理：

```typescript
// 伪代码（在 catch 块中添加）
catch (error) {
  // 清理可能残留的临时文件（spawn 失败时子进程不会执行 unlink）
  if (configFilePath) {
    try { unlinkSync(configFilePath); } catch {}
  }
  return {
    success: false,
    message: 'Failed to start daemon',
    error: error instanceof Error ? error.message : String(error),
  };
}
```

### 步骤 5：验证 TypeScript 类型检查

```bash
cd /path/to/ultrapower && npx tsc --noEmit
```

---

## 测试场景

### 场景 1：正常 config 传递

**前提：** 标准 `DaemonConfig`（所有字段为默认值）
**操作：** 调用 `startDaemon()`
**预期：**
- 临时文件被创建于 `os.tmpdir()`，命名为 `omc-daemon-cfg-{uuid}.json`
- daemon 进程正常启动（PID 文件存在）
- 临时文件在子进程启动后 <5 秒内消失
- `isDaemonRunning()` 返回 `true`

**验证方式：**
```typescript
// 在 startDaemon 返回前，短暂监控 tmpdir 中的 omc-daemon-cfg-*.json 文件
// 确认文件创建后被删除
```

### 场景 2：含特殊字符的路径 config

**前提：** config 中 `stateFilePath` 含反引号、换行符、引号：
```typescript
const cfg = {
  stateFilePath: '/tmp/test`dir\n"path"/state.json',
  logFilePath: "/tmp/log'dir/daemon.log",
  // ... 其他默认值
};
```
**操作：** 调用 `startDaemon(cfg)`
**预期：**
- daemon 正常启动（不崩溃）
- `pollLoop` 接收到的 config 路径与输入完全一致（无转义损失）
- 无 JavaScript 语法错误

### 场景 3：tmpdir 不可写时的错误处理

**前提：** 模拟 `os.tmpdir()` 不可写（测试时可临时改变 `TMPDIR` 环境变量指向只读目录）
**操作：** 调用 `startDaemon()`
**预期：**
- `startDaemon()` 返回 `{ success: false, message: 'Failed to start daemon', error: '...' }`
- 无进程被创建
- 无残留临时文件

### 场景 4：子进程读取临时文件后立即删除（文件不残留）

**前提：** 正常启动场景
**操作：**
1. 调用 `startDaemon()`
2. 等待 2 秒
3. 检查 `os.tmpdir()` 中是否存在 `omc-daemon-cfg-*.json`

**预期：**
- 2 秒后不存在任何 `omc-daemon-cfg-*.json` 文件
- `ls $(node -e "require('os').tmpdir()")'/omc-daemon-cfg-*.json'` 返回空

### 场景 5：`OMC_DAEMON_CONFIG_FILE` 未设置时子进程优雅退出

**前提：** 直接运行 daemonScript 但不设置 `OMC_DAEMON_CONFIG_FILE`
**操作：** `node -e "<daemonScript>"`（不带环境变量）
**预期：**
- 子进程打印 `[daemon] config read failed: ...`
- 子进程以 exit code 1 退出
- 不崩溃（无未捕获异常）

### 场景 6：大型 config 对象（边界测试）

**前提：** config 中某个字段值为 10000 字符的字符串
**操作：** 调用 `startDaemon(cfg)` 并验证进程启动
**预期：**
- 临时文件正常写入（不受命令行参数长度限制）
- daemon 正常启动

---

## 验收标准

- [ ] **AC-1：无代码注入** `cfg` 不再以任何形式嵌入到 JavaScript 源代码字符串中（`daemonScript` 中不包含 `JSON.stringify(cfg)`）
- [ ] **AC-2：临时文件规范** 临时文件：
  - 位于 `os.tmpdir()` 目录下
  - 命名格式为 `omc-daemon-cfg-{uuid}.json`（UUID 由 `crypto.randomUUID()` 生成）
  - 权限为 `0o600`（仅所有者读写）
- [ ] **AC-3：路径通过 env 传递** 临时文件路径通过 `OMC_DAEMON_CONFIG_FILE` 环境变量传递给子进程（不通过命令行参数或代码字符串）
- [ ] **AC-4：原子清理** 子进程在成功读取 config 后立即调用 `unlinkSync` 删除临时文件（`finally` 块保证即使解析失败也执行清理）
- [ ] **AC-5：fire-and-forget 不受影响** `stdio: 'ignore'` 保持不变，`child.unref()` 在 `spawn` 后立即调用，父进程可正常退出
- [ ] **AC-6：spawn 失败时清理** 若 `spawn` 抛出异常，catch 块中执行临时文件清理（无残留）
- [ ] **AC-7：TypeScript 零错误** `npx tsc --noEmit` 在修改后返回零错误
- [ ] **AC-8：特殊字符兼容** 含反引号、换行符、单/双引号的路径经临时文件传递后，`pollLoop` 接收到的值与原始值完全一致
- [ ] **AC-9：POC 验证通过** 手动运行 POC 验证脚本，所有输出项均为 `true`

---

## 风险评估

### 风险 1：子进程删除临时文件前父进程已退出——竞态条件

**可能性：** 低
**影响：** 低
**说明：** 父进程 `child.unref()` 后立即返回，子进程独立运行。若系统负载极高，子进程启动延迟超过 10 分钟（极端情况），临时文件可能在异常关机时残留。
**缓解：** 文件命名含 UUID，残留文件不影响其他进程。可在 `startDaemon` 开头添加清理过期临时文件的逻辑（>1 小时的 `omc-daemon-cfg-*.json` 视为残留）。

### 风险 2：tmpdir 磁盘满导致写入失败

**可能性：** 极低
**影响：** 中（daemon 无法启动）
**缓解：** `writeFileSync` 抛出异常被 `catch` 块捕获，`startDaemon` 返回有意义的错误信息。日志中包含具体错误。

### 风险 3：Windows 上 `tmpdir()` 路径含空格

**可能性：** 中（Windows 上常见如 `C:\Users\John Doe\AppData\Local\Temp`）
**影响：** 低
**说明：** 路径通过 `process.env.OMC_DAEMON_CONFIG_FILE` 传递，子进程用 `readFileSync(configPath)` 读取——路径不经 shell 解析，空格无影响。
**缓解：** 无需额外处理，`spawn` 的 env 传递机制和 Node.js `readFileSync` 均正确处理含空格路径。

### 风险 4：T-1g 的变更与 T-1h 冲突

**可能性：** 中
**影响：** 中（需要合并 daemonScript 内容）
**缓解：** T-1h 串行依赖 T-1g，必须在 T-1g 完成后开始。实现时以 T-1g 的最终 `daemonScript` 为基础添加临时文件读取逻辑。

### 风险 5：子进程 `readFileSync` 调用时临时文件尚未同步到磁盘

**可能性：** 极低
**影响：** 低
**说明：** 父进程 `writeFileSync` 是同步调用，完成后才调用 `spawn`。操作系统的文件系统缓冲在同一机器上对另一进程是可见的（无网络文件系统情况下）。
**缓解：** 无需额外处理。若出现该问题（网络文件系统场景），子进程 catch 块会捕获错误并以 exit code 1 退出。

---

*Sub-PRD 生成完成。实现需等待 T-1g 完成后串行执行。*
