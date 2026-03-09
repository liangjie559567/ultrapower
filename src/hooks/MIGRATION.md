# Bridge.ts 重构迁移指南

## 迁移策略

采用**渐进式重构**，避免一次性大规模改动带来的风险。

## Phase 1: 基础架构 ✅ 已完成

已创建的模块：

* `registry/HookRegistry.ts` - 处理器注册表

* `registry/registerProcessors.ts` - 注册逻辑

* `processors/*.ts` - 11个基础处理器

* `state/StateReader.ts` - 状态读取工具

* `bridge-new.ts` - 精简路由层示例

## Phase 2: 复杂处理器迁移

### 迁移优先级

**P0 - 高频热路径：**
1. `pre-tool-use` - 每次工具调用前触发
2. `post-tool-use` - 每次工具调用后触发
3. `keyword-detector` - 每次用户输入触发

**P1 - 核心功能：**
1. `ralph` - 持久循环模式
2. `autopilot` - 自主执行模式
3. `stop-continuation` - 停止继续逻辑

**P2 - 辅助功能：**
1. `persistent-mode` - 持久模式检测
2. `subagent-start/stop` - 子 agent 追踪
3. `pre-compact` - 压缩前处理

### 迁移步骤模板

```typescript
// 1. 在 processors/ 创建新文件
// processors/ralph.ts

import type { HookInput, HookOutput } from "../bridge-types.js";

export async function processRalph(input: HookInput): Promise<HookOutput> {
  // 从原 bridge.ts 复制逻辑
  // 保持接口一致
  return { success: true };
}

// 2. 在 registerProcessors.ts 注册
import { processRalph } from "../processors/ralph.js";
registry.register("ralph", processRalph);

// 3. 添加单元测试
// tests/processors/ralph.test.ts

// 4. 验证等价性
// 对比新旧实现的输出
```

## Phase 3: 完全替换

### 验证清单

* [ ] 所有 hook 类型已迁移

* [ ] 单元测试覆盖率 >80%

* [ ] 集成测试通过

* [ ] 性能无退化（<5% 差异）

* [ ] 内存使用无增长

### 替换步骤

1. 重命名 `bridge.ts` -> `bridge-legacy.ts`
2. 重命名 `bridge-new.ts` -> `bridge.ts`
3. 更新所有导入引用
4. 运行完整测试套件
5. 监控生产环境 1 周
6. 删除 `bridge-legacy.ts`

## 回滚计划

如发现问题：
```bash
git revert <commit-hash>

# 或

mv bridge-legacy.ts bridge.ts
```

## 注意事项

1. **保持向后兼容**：不改变 HookInput/HookOutput 接口
2. **延迟加载**：复杂依赖使用动态 import
3. **错误处理**：每个 processor 独立捕获异常
4. **性能优化**：避免重复读取状态文件
