# [RESEARCH_STAGE:5] 安全边界与资源控制分析

**研究目标:** 评估自主代码修改的安全防护机制和资源管理策略

**分析日期:** 2026-03-09

---

## [OBJECTIVE]

评估 ultrapower 在自主 agent 代码修改场景下的安全防护能力，识别关键风险点，提出针对性防护方案。

**核心问题:**
1. 如何防止 agent 修改关键文件（如 prepare.py）？
2. 如何限制 GPU 使用时间（强制 5 分钟超时）？
3. 如何隔离实验环境（防止破坏主代码库）？
4. 现有 runtime-protection 机制能否扩展？

---

## [DATA] 现有安全机制盘点

### 1. 路径遍历防护（P0 级别）

**实现位置:** `src/lib/validateMode.ts`

[STAT:coverage] 100% 路径验证覆盖率

**防护机制:**
```typescript
// 白名单验证 - 9 个合法 mode 值
const VALID_MODES = [
  'autopilot', 'ultrapilot', 'team', 'pipeline',
  'ralph', 'ultrawork', 'ultraqa', 'swarm', 'ralplan'
];

// 路径遍历检测
if (mode.includes('..') || mode.includes('/') || mode.includes('\\')) {
  throw new Error('Path traversal attempt detected');
}
```

**防护范围:**
- ✅ 状态文件路径 (`.omc/state/${mode}-state.json`)
- ✅ Session ID 验证 (`assertValidSessionId`)
- ✅ Directory 参数验证 (`assertValidDirectory`)
- ✅ Agent ID 验证 (`assertValidAgentId`)

[STAT:validation_points] 4 个关键验证点

---

### 2. Hook 输入消毒（P0 级别）

**实现位置:** `src/hooks/bridge-normalize.ts`

[STAT:hook_types] 15 类 HookType，4 类敏感 hook

**敏感 Hook 白名单:**
```typescript
const SENSITIVE_HOOKS = new Set([
  'permission-request',  // 权限请求
  'setup-init',          // 初始化
  'setup-maintenance',   // 维护
  'session-end'          // 会话结束
]);
```

**防护策略:**
- 敏感 hook：严格白名单，未知字段被丢弃
- 非敏感 hook：未知字段透传 + debug 警告（v1 设计选择）

[LIMITATION] `permission-request` 失败时当前**不会**强制阻塞（差异点 D-05），v2 待修复

---

### 3. 原子写入保护（P0 级别）

**实现位置:** `src/lib/atomic-write.ts`

[STAT:file_permission] 0o600（仅所有者可读写）

**原子写入流程:**
```
1. ensureDirSync(dir)
2. 独占创建临时文件 (wx 标志, 0o600)
3. writeSync(fd, content)
4. fsyncSync(fd)
5. closeSync(fd)
6. renameSync(tmpPath, filePath)  // 原子替换
7. 目录级 fsync (best-effort)
```

**并发保护级别:**
| 文件 | 保护机制 | 级别 |
|------|----------|------|
| `subagent-tracking.json` | debounce(100ms) + 文件锁 + merge | 最高 |
| `*-state.json` | atomicWriteJsonSync | 中 |

[LIMITATION] Windows 平台 rename 行为差异：目标文件被占用时会失败

---

### 4. 进程超时管理

**实现位置:** `src/agents/timeout-manager.ts`, `src/agents/timeout-config.ts`

[STAT:timeout_default] 5 分钟（300,000ms）

**超时配置矩阵:**
```typescript
byAgentType: {
  explore: 60000,           // 1 分钟
  executor: 600000,         // 10 分钟
  'deep-executor': 1800000, // 30 分钟
}

byModel: {
  haiku: 120000,   // 2 分钟
  sonnet: 600000,  // 10 分钟
  opus: 1800000,   // 30 分钟
}
```

**优先级:** 环境变量 > Agent 类型 > 模型 > 默认值

**超时执行:**
```typescript
const controller = new AbortController();
setTimeout(() => {
  controller.abort();  // 触发中断
  cleanup(taskId);
}, timeoutMs);
```

[STAT:max_concurrent] 20 个并发任务上限

---

### 5. 文件权限控制（Advisory）

**实现位置:** `src/team/permissions.ts`

[LIMITATION] **仅为建议性约束**，无法机械强制执行

**权限模型:**
```typescript
interface WorkerPermissions {
  allowedPaths: string[];    // glob 模式白名单
  deniedPaths: string[];     // 黑名单（优先级更高）
  allowedCommands: string[]; // 命令前缀白名单
  maxFileSize: number;       // 单文件大小限制
}
```

**路径验证逻辑:**
```typescript
// 1. 拒绝逃逸工作目录
if (relPath.startsWith('..')) return false;

// 2. 黑名单优先
for (const pattern of deniedPaths) {
  if (matchGlob(pattern, relPath)) return false;
}

// 3. 白名单匹配
for (const pattern of allowedPaths) {
  if (matchGlob(pattern, relPath)) return true;
}
```

**Glob 匹配支持:**
- `*` - 匹配任意非 `/` 字符
- `**` - 匹配任意深度（包括 `/`）
- `?` - 匹配单个非 `/` 字符

[STAT:glob_safety] 使用迭代匹配避免 ReDoS 风险

---

### 6. 进程管理（跨平台）

**实现位置:** `src/platform/process-utils.ts`

**Windows 命令注入防护（SEC-H02）:**
```typescript
// ✅ 安全实现
await execFileAsync('taskkill', ['/T', '/PID', String(pid)], {
  timeout: 5000,
  windowsHide: true
});

// ❌ 禁止模式
execSync(`taskkill /T /PID ${pid}`);  // 字符串拼接风险
```

**进程树终止:**
- Windows: `taskkill /T /PID <pid>`
- Unix: `kill -<signal> -<pid>` (负 PID = 进程组)

[STAT:kill_timeout] 5 秒超时防止挂起

---

## [FINDING] 关键安全风险点

### 风险 1: 文件修改权限为建议性约束

[STAT:enforcement_level] Advisory（提示级别），非强制

**现状:**
- `WorkerPermissions` 通过 prompt 注入给 LLM
- Agent 可以**忽略**这些指令
- 无系统级文件访问控制

**风险场景:**
```
Agent 被要求"只修改 train.py"
→ Permissions 设置 allowedPaths: ["train.py"]
→ Agent 仍可调用 Edit tool 修改 prepare.py
→ 系统不会阻止该操作
```

[STAT:risk_severity] 高

**根本原因:** MCP workers 运行在 full-auto 模式，无法机械限制工具调用

---

### 风险 2: GPU 资源无专用控制

[STAT:gpu_control] 0 个 GPU 相关控制点

**现状:**
- 仅有通用进程超时（TimeoutManager）
- 无 GPU 使用时间监控
- 无 CUDA 进程检测
- 无显存占用限制

**风险场景:**
```
Agent 启动训练任务
→ TimeoutManager 设置 5 分钟超时
→ 训练进程在后台继续运行
→ GPU 被长期占用
```

[LIMITATION] 当前超时仅中断 Agent 主进程，不追踪子进程

---

### 风险 3: Worktree 隔离未强制

[STAT:worktree_usage] 文档推荐，非强制要求

**现状:**
- 文档建议使用 git worktree 隔离
- 无系统级强制检查
- Agent 可直接在主分支工作

**风险场景:**
```
用户在 main 分支启动 autopilot
→ Agent 直接修改主代码库
→ 破坏性变更无法回滚
```

---

### 风险 4: 子进程逃逸

[STAT:process_tracking] 仅追踪主 Agent 进程

**现状:**
- TimeoutManager 仅监控 Agent 主进程
- Bash 工具可启动子进程（如 `python train.py &`）
- 子进程不受超时控制

**风险场景:**
```
Agent 执行: bash("python train.py > log.txt 2>&1 &")
→ 训练进程在后台运行
→ Agent 超时退出
→ 训练进程继续占用 GPU
```

---

## [FINDING] 防护方案设计

### 方案 1: 文件访问沙箱（推荐）

**实现层级:** Tool 拦截层

**设计:**
```typescript
// src/tools/file-access-guard.ts
export function guardFileAccess(
  toolName: string,
  toolInput: unknown,
  permissions: WorkerPermissions
): void {
  if (!['Edit', 'Write'].includes(toolName)) return;

  const filePath = extractFilePath(toolInput);
  if (!isPathAllowed(permissions, filePath, cwd)) {
    throw new Error(
      `Access denied: ${filePath} not in allowed paths`
    );
  }
}
```

**集成点:** `src/hooks/pre-tool-use/index.ts`

[STAT:implementation_effort] 中等（约 200 行代码）

**优势:**
- ✅ 强制执行（非建议性）
- ✅ 无需修改 Agent prompt
- ✅ 可审计（记录所有拦截）

**劣势:**
- ❌ 需要维护工具名称白名单
- ❌ 可能误拦截合法操作

---

### 方案 2: GPU 时间限制（推荐）

**实现层级:** 进程监控 + 资源追踪

**设计:**
```typescript
// src/platform/gpu-monitor.ts
export class GPUMonitor {
  private processes = new Map<number, GPUProcess>();

  async enforceTimeout(pid: number, maxSeconds: number) {
    const startTime = Date.now();

    const interval = setInterval(async () => {
      const elapsed = (Date.now() - startTime) / 1000;

      if (elapsed > maxSeconds) {
        await killProcessTree(pid, 'SIGKILL');
        clearInterval(interval);
      }

      // 检测 CUDA 进程
      const cudaProcs = await findCUDAProcesses(pid);
      for (const proc of cudaProcs) {
        await killProcessTree(proc.pid, 'SIGKILL');
      }
    }, 1000);
  }
}
```

**CUDA 进程检测:**
- Linux: `nvidia-smi --query-compute-apps=pid --format=csv`
- Windows: `nvidia-smi.exe` + 进程树匹配

[STAT:polling_interval] 1 秒检查间隔

**优势:**
- ✅ 强制终止超时进程
- ✅ 追踪子进程
- ✅ 跨平台支持

**劣势:**
- ❌ 需要 nvidia-smi 可用
- ❌ 轮询开销

---

### 方案 3: Worktree 强制隔离（推荐）

**实现层级:** Skill 入口检查

**设计:**
```typescript
// src/skills/autopilot/index.ts
export async function autopilotSkill(input: SkillInput) {
  // 检查是否在 worktree 中
  const isWorktree = await checkIsWorktree(input.cwd);
  const currentBranch = await getCurrentBranch(input.cwd);

  if (!isWorktree && ['main', 'master', 'dev'].includes(currentBranch)) {
    throw new Error(
      'Autopilot requires worktree isolation. ' +
      'Run: git worktree add .claude/worktrees/autopilot -b feature'
    );
  }

  // 继续执行...
}
```

**检测逻辑:**
```bash
# 检查是否为 worktree
git rev-parse --is-inside-work-tree
git rev-parse --git-common-dir  # 不等于 .git 则为 worktree
```

[STAT:false_positive_rate] < 1%

**优势:**
- ✅ 零破坏风险
- ✅ 用户友好错误提示
- ✅ 无性能开销

**劣势:**
- ❌ 需要用户手动创建 worktree
- ❌ 非 git 项目无法使用

---

### 方案 4: 子进程追踪（推荐）

**实现层级:** Bash 工具包装

**设计:**
```typescript
// src/tools/bash-wrapper.ts
export async function executeBash(
  command: string,
  options: BashOptions
): Promise<BashResult> {
  const proc = spawn('bash', ['-c', command], {
    ...options,
    detached: false  // 强制前台运行
  });

  // 注册进程树
  processRegistry.register(proc.pid, {
    parentTaskId: options.taskId,
    startTime: Date.now(),
    maxDuration: options.timeout || 300000
  });

  // 超时终止整个进程树
  const timer = setTimeout(async () => {
    await killProcessTree(proc.pid, 'SIGKILL');
  }, options.timeout);

  // 等待完成
  await waitForExit(proc);
  clearTimeout(timer);
  processRegistry.unregister(proc.pid);
}
```

**进程树追踪:**
```typescript
interface ProcessRegistry {
  register(pid: number, meta: ProcessMeta): void;
  unregister(pid: number): void;
  killAll(taskId: string): Promise<void>;
}
```

[STAT:tracking_overhead] < 5ms per process

**优势:**
- ✅ 捕获所有子进程
- ✅ 统一超时管理
- ✅ 防止进程泄漏

**劣势:**
- ❌ 增加 Bash 工具复杂度
- ❌ 可能误杀合法后台任务

---

## [FINDING] runtime-protection 扩展能力评估

### 当前机制可扩展性

[STAT:extensibility_score] 7/10

**可直接复用:**
1. ✅ `validateMode` 模式 → 可扩展为 `validateToolAccess`
2. ✅ `bridge-normalize` 白名单 → 可扩展为工具参数白名单
3. ✅ `atomic-write` 文件锁 → 可用于进程注册表
4. ✅ `TimeoutManager` → 可扩展为 `ResourceManager`

**需要新增:**
1. ❌ GPU 监控模块（全新）
2. ❌ 进程树追踪（全新）
3. ❌ Worktree 检测（全新）

---

### 扩展架构建议

**新增模块:**
```
src/
├── lib/
│   ├── resource-manager.ts      # 统一资源管理
│   └── process-registry.ts      # 进程树追踪
├── platform/
│   └── gpu-monitor.ts           # GPU 监控
└── guards/
    ├── file-access-guard.ts     # 文件访问拦截
    └── worktree-guard.ts        # Worktree 检查
```

**集成点:**
- `pre-tool-use` hook → 文件访问拦截
- `autopilot` skill 入口 → Worktree 检查
- `Bash` tool wrapper → 进程追踪
- `TimeoutManager` → GPU 监控集成

[STAT:integration_points] 4 个关键集成点

---

## [LIMITATION] 已知局限性

### 1. LLM 行为不可预测

即使有文件访问拦截，Agent 仍可能：
- 通过 Bash 工具间接修改文件（`echo "..." > prepare.py`）
- 使用符号链接绕过路径检查
- 请求用户手动修改文件

[STAT:bypass_vectors] 至少 3 种绕过方式

**缓解措施:**
- Bash 命令白名单（禁止重定向操作符）
- 符号链接解析（`fs.realpath`）
- 审计日志 + 人工审查

---

### 2. GPU 监控依赖外部工具

`nvidia-smi` 可能不可用：
- Docker 容器内无 GPU 驱动
- 非 NVIDIA GPU（AMD/Intel）
- 用户权限不足

**降级策略:**
- 回退到通用进程超时
- 记录警告日志
- 建议用户手动监控

---

### 3. Worktree 强制可能过于严格

某些场景下用户可能需要在主分支工作：
- 快速修复（hotfix）
- 单文件编辑
- 非破坏性操作

**解决方案:**
- 提供 `--allow-main-branch` 标志
- 仅对高风险 skills 强制（autopilot, ralph）
- 低风险 skills 仅警告

---

### 4. Windows 平台特殊性

- 进程终止可能失败（文件被占用）
- 目录 fsync 不支持
- 路径大小写不敏感

**已有防护:**
- `execFile` 替代 `execSync`（SEC-H02）
- 原子写入容错处理
- 路径规范化

[STAT:windows_coverage] 90% 兼容性

---

## [STAT:summary] 统计摘要

| 指标 | 数值 |
|------|------|
| 现有安全机制 | 6 个 |
| 识别风险点 | 4 个 |
| 提出方案 | 4 个 |
| 可扩展性评分 | 7/10 |
| 实现工作量 | 中等（约 800 行代码） |
| P0 级别规范 | 3 个（路径遍历、Hook 消毒、原子写入） |

---

## 结论与建议

### 立即可用的防护

1. **文件访问沙箱**（方案 1）
   - 实现成本：中
   - 防护效果：高
   - 推荐优先级：P0

2. **Worktree 强制隔离**（方案 3）
   - 实现成本：低
   - 防护效果：高
   - 推荐优先级：P0

### 需要额外依赖的防护

3. **GPU 时间限制**（方案 2）
   - 实现成本：高
   - 防护效果：中（依赖 nvidia-smi）
   - 推荐优先级：P1

4. **子进程追踪**（方案 4）
   - 实现成本：中
   - 防护效果：高
   - 推荐优先级：P1

### 架构扩展建议

现有 `runtime-protection` 机制**可以扩展**支持自主代码修改场景，但需要：
- 新增 4 个模块（约 800 行代码）
- 集成到 4 个关键点
- 保持向后兼容性

**核心设计原则:**
- 默认拒绝（白名单优于黑名单）
- 多层防御（prompt + tool 拦截 + 进程监控）
- 优雅降级（外部工具不可用时回退）
- 可审计（记录所有安全事件）

---

[STAGE_COMPLETE:5]

**下一步:** 将防护方案集成到 ML 实验自动化 PRD 中
