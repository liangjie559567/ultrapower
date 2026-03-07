# Hook Bridge 模块化架构

## 概述

Hook Bridge 正在进行渐进式重构，从单体 `bridge.ts` (1430行) 迁移到模块化架构。

## 当前架构

```
src/hooks/
├── bridge.ts              # 主路由层（原实现，待迁移）
├── bridge-new.ts          # 新路由层（精简版）
├── registry/
│   ├── HookRegistry.ts    # Hook 处理器注册表
│   └── registerProcessors.ts  # 处理器注册逻辑
├── processors/            # 独立处理器模块
│   ├── index.ts
│   ├── keywordDetector.ts
│   ├── delegationEnforcer.ts
│   ├── orchestratorPreTool.ts
│   ├── orchestratorPostTool.ts
│   ├── sessionStart.ts
│   ├── sessionEnd.ts
│   ├── userPromptSubmit.ts
│   ├── fileSave.ts
│   ├── setup.ts
│   ├── agentExecutionComplete.ts
│   └── permissionRequest.ts
├── state/
│   └── StateReader.ts     # 状态文件读取工具
└── normalization/
    └── InputNormalizer.ts # 输入规范化（待创建）
```

## 重构进度

### Phase 1: 基础架构 ✅
- [x] HookRegistry 接口
- [x] 11个基础 processor 模块
- [x] StateReader 工具
- [x] 处理器注册系统

### Phase 2: 复杂处理器迁移 🚧
待迁移的复杂处理器：
- [ ] ralph processor
- [ ] autopilot processor
- [ ] ultrawork processor
- [ ] team processor
- [ ] stop-continuation processor
- [ ] pre-tool-use processor
- [ ] post-tool-use processor

### Phase 3: 完全替换 ⏳
- [ ] 集成测试验证
- [ ] 性能基准测试
- [ ] 替换原 bridge.ts
- [ ] 清理遗留代码

## 使用方式

### 注册新处理器

```typescript
import { registry } from "./registry/HookRegistry.js";

async function myProcessor(input: HookInput): Promise<HookOutput> {
  // 处理逻辑
  return { success: true };
}

registry.register("my-hook-type", myProcessor);
```

### 读取状态

```typescript
import { readStateFile, hasActiveState } from "./state/StateReader.js";

const state = readStateFile("team", process.cwd());
if (hasActiveState("ralph", process.cwd())) {
  // 处理激活状态
}
```

## 设计原则

1. **单一职责**：每个 processor 只处理一种 hook 类型
2. **最小依赖**：processor 之间避免相互依赖
3. **延迟加载**：复杂依赖使用动态 import
4. **向后兼容**：保持与原 bridge.ts 的接口兼容
