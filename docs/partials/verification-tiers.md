# 验证层级

验证随任务复杂度扩展，在控制成本的同时保持质量。

## 层级定义

| 层级 | 标准 | Agent | 模型 | 所需证据 |
|------|----------|-------|-------|-------------------|
| **LIGHT** | <5 个文件，<100 行，完整测试覆盖 | architect-low | haiku | lsp_diagnostics 无错误 |
| **STANDARD** | 默认（非 LIGHT 或 THOROUGH） | architect-medium | sonnet | diagnostics + 构建通过 |
| **THOROUGH** | >20 个文件，或架构/安全变更 | architect | opus | 完整审查 + 所有测试 |

## 选择接口

```typescript
interface ChangeMetadata {
  filesChanged: number;
  linesChanged: number;
  hasArchitecturalChanges: boolean;
  hasSecurityImplications: boolean;
  testCoverage: 'none' | 'partial' | 'full';
}

type VerificationTier = 'LIGHT' | 'STANDARD' | 'THOROUGH';
```

## 选择逻辑

```
IF hasSecurityImplications OR hasArchitecturalChanges:
  → THOROUGH（安全/架构变更始终使用）
ELIF filesChanged > 20:
  → THOROUGH（范围较大）
ELIF filesChanged < 5 AND linesChanged < 100 AND testCoverage === 'full':
  → LIGHT（小范围，测试完善）
ELSE:
  → STANDARD（默认）
```

## 覆盖触发词

覆盖自动检测的用户关键词：

| 关键词 | 强制层级 |
|---------|-------------|
| "thorough"、"careful"、"important"、"critical" | THOROUGH |
| "quick"、"simple"、"trivial"、"minor" | LIGHT |
| 安全相关文件变更 | THOROUGH（始终） |

## 架构变更检测

触发 `hasArchitecturalChanges` 的文件：
- `**/config.{ts,js,json}`
- `**/schema.{ts,prisma,sql}`
- `**/definitions.ts`
- `**/types.ts`
- `package.json`
- `tsconfig.json`

## 安全影响检测

触发 `hasSecurityImplications` 的路径模式：
- `**/auth/**`
- `**/security/**`
- `**/permissions?.{ts,js}`
- `**/credentials?.{ts,js,json}`
- `**/secrets?.{ts,js,json,yml,yaml}`
- `**/tokens?.{ts,js,json}`
- `**/passwords?.{ts,js,json}`
- `**/oauth*`
- `**/jwt*`
- `**/.env*`

## 证据类型

不同声明类型所需的证据：

| 声明 | 所需证据 |
|-------|-------------------|
| "已修复" | 显示现在通过的测试 |
| "已实现" | lsp_diagnostics 无错误 + 构建通过 |
| "已重构" | 所有测试仍然通过 |
| "已调试" | 定位到 file:line 的根本原因 |

## 成本对比

| 层级 | 相对成本 | 使用场景 |
|------|---------------|----------|
| LIGHT | 1x | 带测试的单文件 bug 修复 |
| STANDARD | 5x | 多文件功能新增 |
| THOROUGH | 20x | 大规模重构、安全变更 |

预计节省：与始终使用 THOROUGH 相比，分层系统可减少约 40% 的验证成本。

## 在模式中的使用

所有持久化模式（ralph、autopilot、ultrapilot）在生成验证 agent 前应使用层级选择器：

```typescript
import { selectVerificationTier, getVerificationAgent } from '../verification/tier-selector';

const tier = selectVerificationTier(changeMetadata);
const { agent, model } = getVerificationAgent(tier);

// 生成适当的验证 agent
Task(subagent_type=`ultrapower:${agent}`, model, prompt="Verify...")
```
