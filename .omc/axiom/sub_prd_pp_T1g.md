# Sub-PRD: T-1g — daemon.ts Windows ESM import URL 修复

**任务 ID：** T-1g
**目标文件：** `src/features/rate-limit-wait/daemon.ts`
**估计工时：** 4h
**优先级：** P0
**依赖：** 无（POC 验证为前置条件，非任务依赖）
**状态：** 待实现

---

## 问题分析

### 根本原因

Node.js ESM `import()` 动态导入函数要求 specifier 必须是合法的 URL 或相对路径，在 Windows 上拒绝接受 Win32 绝对路径格式。

**失败路径示例（Windows）：**
```
C:\Users\ljyih\Desktop\ultrapower\dist\features\rate-limit-wait\daemon.js
```

**Node.js 错误表现：**
```
Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: Only file and data URLs are supported by the default ESM loader.
Received protocol 'c:'
```

### 失败位置

`src/features/rate-limit-wait/daemon.ts` 第 424-430 行：

```typescript
// 第 424 行：modulePath 是 Win32 绝对路径，如 C:\Users\...\daemon.js
const modulePath = __filename.replace(/\.ts$/, '.js');

// 第 425-430 行：直接将 Win32 路径字符串插入 import() 调用
const daemonScript = `
  import('${modulePath}').then(({ pollLoop }) => {
    const config = ${JSON.stringify(cfg)};
    return pollLoop(config);
  }).catch((err) => { console.error(err); process.exit(1); });
`;
```

### 技术背景

1. `__filename`（第 34 行）通过 `fileURLToPath(import.meta.url)` 获取，返回平台原生路径：
   - Windows：`C:\Users\ljyih\Desktop\ultrapower\dist\features\rate-limit-wait\daemon.js`
   - Unix：`/home/user/ultrapower/dist/features/rate-limit-wait/daemon.js`

2. Node.js ESM loader 对 `import()` specifier 的处理规则：
   - 接受：`file:///C:/Users/.../daemon.js`（file URL）
   - 接受：`./daemon.js`（相对路径，但跨进程不适用）
   - **拒绝**：`C:\Users\...\daemon.js`（Win32 绝对路径，协议头被识别为 `c:`）
   - Unix 绝对路径（`/home/...`）在部分 Node.js 版本中可工作，但非规范行为

3. `daemonScript` 是注入到子进程 `-e` 参数中执行的内联 JS，子进程无法通过相对路径定位文件，必须使用绝对 file URL。

### 参考实现

`src/hooks/bridge.ts` 第 16 行和第 1252 行已有正确用法：

```typescript
// 第 16 行：导入 pathToFileURL
import { pathToFileURL } from 'url';

// 第 1252 行：将文件路径转换为 file URL 进行比较
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
```

`pathToFileURL` 是 Node.js `url` 模块内置函数，正确处理跨平台路径转换：
- 输入：`C:\Users\ljyih\Desktop\ultrapower\dist\features\rate-limit-wait\daemon.js`
- 输出：`file:///C:/Users/ljyih/Desktop/ultrapower/dist/features/rate-limit-wait/daemon.js`

---

## 代码定位

### 精确修改位置

**文件：** `src/features/rate-limit-wait/daemon.ts`

| 行号 | 当前内容 | 变更类型 |
|------|---------|---------|
| 17 | `import { fileURLToPath } from 'url';` | 修改：追加 `pathToFileURL` 导入 |
| 424 | `const modulePath = __filename.replace(/\.ts$/, '.js');` | 保留 |
| 425-430 | `import('${modulePath}')...` | 修改：将 `modulePath` 替换为 `moduleUrl` |

### 完整上下文（修改前）

```typescript
// 第 17 行
import { fileURLToPath } from 'url';

// 第 33-34 行
// ESM compatibility: __filename is not available in ES modules
const __filename = fileURLToPath(import.meta.url);

// 第 422-430 行
// Fork a new process for the daemon using dynamic import() for ESM compatibility.
// The project uses "type": "module", so require() would fail with ERR_REQUIRE_ESM.
const modulePath = __filename.replace(/\.ts$/, '.js');
const daemonScript = `
  import('${modulePath}').then(({ pollLoop }) => {
    const config = ${JSON.stringify(cfg)};
    return pollLoop(config);
  }).catch((err) => { console.error(err); process.exit(1); });
`;
```

---

## 修复方案

### 变更 1：更新 import 语句（第 17 行）

**修改前：**
```typescript
import { fileURLToPath } from 'url';
```

**修改后：**
```typescript
import { fileURLToPath, pathToFileURL } from 'url';
```

### 变更 2：修复 daemonScript 中的 import() 调用（第 424-430 行）

**修改前：**
```typescript
const modulePath = __filename.replace(/\.ts$/, '.js');
const daemonScript = `
  import('${modulePath}').then(({ pollLoop }) => {
    const config = ${JSON.stringify(cfg)};
    return pollLoop(config);
  }).catch((err) => { console.error(err); process.exit(1); });
`;
```

**修改后：**
```typescript
const modulePath = __filename.replace(/\.ts$/, '.js');
const moduleUrl = pathToFileURL(modulePath).href;
const daemonScript = `
  import('${moduleUrl}').then(({ pollLoop }) => {
    const config = ${JSON.stringify(cfg)};
    return pollLoop(config);
  }).catch((err) => { console.error(err); process.exit(1); });
`;
```

### 跨平台处理逻辑说明

`pathToFileURL` 的行为：

| 平台 | 输入 | 输出 |
|------|------|------|
| Windows | `C:\Users\ljyih\Desktop\ultrapower\dist\features\rate-limit-wait\daemon.js` | `file:///C:/Users/ljyih/Desktop/ultrapower/dist/features/rate-limit-wait/daemon.js` |
| macOS | `/Users/user/ultrapower/dist/features/rate-limit-wait/daemon.js` | `file:///Users/user/ultrapower/dist/features/rate-limit-wait/daemon.js` |
| Linux | `/home/user/ultrapower/dist/features/rate-limit-wait/daemon.js` | `file:///home/user/ultrapower/dist/features/rate-limit-wait/daemon.js` |

- `pathToFileURL` 是 Node.js 标准库函数，无需额外依赖
- 对 Unix 路径，输出也是合法 file URL，不破坏现有行为
- `.href` 属性返回字符串形式的 URL（如 `file:///...`），可直接嵌入模板字符串

---

## POC 验证方案

### 前置条件

在执行此任务前，需在 Windows 11 真实环境完成以下 POC 验证（非此任务职责，但须确认已通过）：

**POC 验证脚本（在 Windows PowerShell 中执行）：**

```powershell
# 步骤 1：构建项目
cd C:\Users\ljyih\Desktop\ultrapower
npm run build

# 步骤 2：验证 pathToFileURL 行为
node -e "
const { pathToFileURL } = require('url');
const path = 'C:\\\\Users\\\\ljyih\\\\Desktop\\\\ultrapower\\\\dist\\\\features\\\\rate-limit-wait\\\\daemon.js';
const url = pathToFileURL(path).href;
console.log('Input path:', path);
console.log('Output URL:', url);
console.log('Valid:', url.startsWith('file:///'));
"

# 步骤 3：验证修复后的 import() 可正常加载
node -e "
const { pathToFileURL } = require('url');
const modulePath = 'C:\\\\Users\\\\ljyih\\\\Desktop\\\\ultrapower\\\\dist\\\\features\\\\rate-limit-wait\\\\daemon.js';
const moduleUrl = pathToFileURL(modulePath).href;
import(moduleUrl).then((mod) => {
  console.log('SUCCESS: Module loaded');
  console.log('Exports:', Object.keys(mod));
}).catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
"
```

**期望输出（步骤 2）：**
```
Input path: C:\Users\ljyih\Desktop\ultrapower\dist\features\rate-limit-wait\daemon.js
Output URL: file:///C:/Users/ljyih/Desktop/ultrapower/dist/features/rate-limit-wait/daemon.js
Valid: true
```

**期望输出（步骤 3）：**
```
SUCCESS: Module loaded
Exports: [ 'startDaemon', 'stopDaemon', 'getDaemonStatus', 'pollLoop', ... ]
```

### 打包产物验证（dist/）

```bash
# 验证 dist/ 中的编译输出包含修复
grep -n "pathToFileURL" dist/features/rate-limit-wait/daemon.js
grep -n "moduleUrl" dist/features/rate-limit-wait/daemon.js

# 期望输出：
# 1: import { fileURLToPath, pathToFileURL } from 'url';（或编译后的等效形式）
# 424: const moduleUrl = pathToFileURL(modulePath).href;
# 426: import('file:///...') 或 import('${moduleUrl}')
```

### macOS/Linux 回归验证

```bash
# 在 macOS 或 Linux 上执行
node -e "
import { pathToFileURL } from 'url';
const modulePath = '/home/user/ultrapower/dist/features/rate-limit-wait/daemon.js';
const moduleUrl = pathToFileURL(modulePath).href;
console.log('URL:', moduleUrl);
console.assert(moduleUrl === 'file:///home/user/ultrapower/dist/features/rate-limit-wait/daemon.js', 'Unix URL format correct');
console.log('PASS: Unix path correctly converted');
"
```

---

## 实现步骤

1. 打开 `src/features/rate-limit-wait/daemon.ts`
2. 修改第 17 行：在 `fileURLToPath` 导入后追加 `pathToFileURL`
3. 在第 424 行后（`const modulePath = ...` 之后）插入：
   ```typescript
   const moduleUrl = pathToFileURL(modulePath).href;
   ```
4. 修改第 426 行：将模板字符串中的 `${modulePath}` 替换为 `${moduleUrl}`
5. 运行 `tsc --noEmit` 确认无类型错误
6. 运行 `npm run build` 生成 dist/
7. 验证 dist/ 中的产物包含 `pathToFileURL` 调用

---

## 测试场景

### 场景 1：Windows 路径格式转换（核心场景）

- **输入：** `__filename` = `C:\Users\ljyih\Desktop\ultrapower\dist\features\rate-limit-wait\daemon.js`
- **期望：** `moduleUrl` = `file:///C:/Users/ljyih/Desktop/ultrapower/dist/features/rate-limit-wait/daemon.js`
- **验证：** `import(moduleUrl)` 成功加载模块，不抛出 `ERR_UNSUPPORTED_ESM_URL_SCHEME`

### 场景 2：macOS 路径格式（回归）

- **输入：** `__filename` = `/Users/user/ultrapower/dist/features/rate-limit-wait/daemon.js`
- **期望：** `moduleUrl` = `file:///Users/user/ultrapower/dist/features/rate-limit-wait/daemon.js`
- **验证：** `import(moduleUrl)` 成功加载模块

### 场景 3：Linux 路径格式（回归）

- **输入：** `__filename` = `/home/user/ultrapower/dist/features/rate-limit-wait/daemon.js`
- **期望：** `moduleUrl` = `file:///home/user/ultrapower/dist/features/rate-limit-wait/daemon.js`
- **验证：** `import(moduleUrl)` 成功加载模块

### 场景 4：守护进程 startDaemon() 端到端

- **操作：** 在 Windows 11 上调用 `startDaemon()`
- **期望：** 子进程成功启动，`pollLoop` 被正确调用，`writePidFile` 写入有效 PID
- **验证：** PID 文件存在且进程正在运行

### 场景 5：TypeScript 编译无错误

- **操作：** 修改后运行 `tsc --noEmit`
- **期望：** 零编译错误，`pathToFileURL` 类型正确（接受 `string`，返回 `URL`，`.href` 为 `string`）

---

## 验收标准

- [ ] **Windows 路径转换正确：** `C:\Users\...` 格式的路径被转换为 `file:///C:/Users/...` 格式
- [ ] **子进程 import() 成功：** 守护进程子进程能够通过 file URL 正确加载 `daemon.js` 模块
- [ ] **POC 在 Windows 11 真实环境验证通过：** 步骤 2 和步骤 3 的 POC 脚本均输出期望结果
- [ ] **打包产物（dist/）同步验证：** 修复体现在编译后的 `dist/features/rate-limit-wait/daemon.js` 中
- [ ] **macOS/Linux 行为不退化：** Unix 路径同样被正确转换，现有测试通过
- [ ] **TypeScript 编译无错误：** `tsc --noEmit` 通过，无新增类型错误
- [ ] **变更最小化：** 仅修改 2 处（import 声明 + `moduleUrl` 赋值 + 模板字符串），不涉及其他逻辑

---

## 风险评估

### 低风险

| 风险 | 描述 | 缓解措施 |
|------|------|---------|
| `pathToFileURL` API 变更 | Node.js 标准库 API，极稳定，已在 `bridge.ts` 使用多年 | 无需特殊处理 |
| Unix 路径行为变化 | Unix 绝对路径原本可能直接传给 `import()` 而无错误 | `pathToFileURL` 对 Unix 路径同样产生有效 file URL，行为等价 |

### 中风险

| 风险 | 描述 | 缓解措施 |
|------|------|---------|
| 路径含特殊字符 | 用户名或路径含空格、Unicode 字符时 URL 编码行为 | `pathToFileURL` 自动处理 URL 编码，无需手动处理 |
| dist/ 编译输出格式 | tsc/esbuild 编译后 `pathToFileURL` 调用形式可能变化 | 在 dist/ 上实际执行 import() 验证（场景 1/2/3） |

### 排除在外的风险

- 守护进程功能逻辑（轮询、tmux 恢复等）：此次变更不涉及这些逻辑
- 跨平台 spawn 参数：`-e daemonScript` 方式在 Windows 上已工作，仅修复 import specifier
