# 技术债务修复计划 - 架构评审报告

**评审日期：** 2026-03-17
**评审人：** Architect (Oracle)
**计划版本：** 1.0
**评审状态：** 有条件批准（需修订）

---

## 执行摘要

技术债务修复计划整体架构合理，4 阶段渐进式策略符合风险控制原则。但在模块拆分边界、类型迁移顺序和 MCP 整合方案上存在 **3 个关键架构风险**，需要修订后方可执行。

**核心发现：**
- ✅ 优先级排序合理（ROI 驱动）
- ✅ 质量门禁完善
- ⚠️ bridge-normalize 拆分边界不清晰（高风险）
- ⚠️ 类型迁移路径存在依赖倒置风险
- ⚠️ MCP 整合缺少具体架构设计

**建议：** 修订任务 3.1（拆分策略）和任务 3.2（MCP 整合），其余任务可按计划执行。

---

## 1. 架构影响分析

### 1.1 模块拆分策略（任务 3.1）

**当前计划：** 将 bridge-normalize.ts (469 行) 拆分为 3 个模块

**架构问题：**

计划未明确定义拆分边界。基于代码分析，bridge-normalize.ts 包含 4 个职责：

1. **输入验证**（Zod schemas, validateWithZod）
2. **字段映射**（mapFieldsToCamelCase, normalizeFastPath）
3. **安全过滤**（checkPrototypePollution, filterPassthrough, SENSITIVE_HOOKS）
4. **配置管理**（STRICT_WHITELIST, REQUIRED_KEYS, KNOWN_FIELDS）

**推荐拆分方案：**

```
src/hooks/bridge/
├── validation.ts       # Zod schemas + validateWithZod (80 行)
├── normalization.ts    # 字段映射逻辑 (120 行)
├── security.ts         # 安全过滤 + 原型污染检查 (100 行)
└── config.ts           # 常量配置 (60 行)
```

**依赖关系：**
```
config.ts (无依赖)
  ↓
validation.ts (依赖 config.ts)
  ↓
security.ts (依赖 config.ts)
  ↓
normalization.ts (依赖 validation.ts + security.ts)
```

**向后兼容策略：**
```typescript
// bridge-normalize.ts (保留为 re-export 层)
export { normalizeHookInput } from './bridge/normalization.js';
export { SENSITIVE_HOOKS } from './bridge/config.js';
```

**风险评估：**
- **循环依赖风险：** 低（单向依赖链）
- **集成测试覆盖：** 现有 4 个测试文件已覆盖（bridge-normalize.test.ts, bridge-security.test.ts）
- **调用方影响：** 仅 4 个文件导入，re-export 层可保证零破坏

---

### 1.2 类型迁移路径（任务 2.1-2.3）

**当前计划：** tools/ → hooks/ → features/

**架构问题：**

实际依赖关系与迁移顺序不匹配：

```
hooks/ (34 个 'any')
  ↓ 依赖
tools/ (155 个 'any')
  ↓ 依赖
features/
```

hooks/ 依赖 tools/ 的工具函数，但计划先迁移 tools/，这会导致 hooks/ 在迁移时面临不稳定的类型定义。

**推荐迁移顺序：**

**阶段 2A（第 1 周）：** 基础层类型化
1. tools/ 中被 hooks/ 依赖的核心工具（state-tools, memory-tools, notepad-tools）
2. hooks/bridge-types.ts（定义 HookInput 等核心接口）

**阶段 2B（第 2 周）：** 应用层类型化
3. hooks/ 核心模块（bridge-normalize, handlers/）
4. tools/ 剩余模块
5. features/ 核心模块

**依赖验证命令：**
```bash
# 检查 hooks/ 对 tools/ 的依赖
grep -r "from.*tools/" src/hooks --include="*.ts" | cut -d: -f2 | sort | uniq
```

**风险缓解：**
- 每个子阶段完成后运行完整测试套件
- 使用 `unknown` 作为过渡类型（而非 `any`）
- 保留类型断言的审计日志

---

### 1.3 MCP 整合方案（任务 3.2）

**当前计划：** "创建统一的 MCPClientFactory 类"

**架构问题：**

计划过于抽象，缺少具体设计。当前 MCP 客户端有 3 个实现：

1. `src/mcp/client.ts` - 基础 MCPClient（51 行）
2. `src/mcp/retry-client.ts` - RetryMCPClient（74 行）
3. `src/mcp/client/MCPClient.ts` - 另一个 MCPClient 实现

存在重复实现和命名冲突。

**推荐整合方案：**

**方案 A：适配器模式（推荐）**

```typescript
// src/mcp/core/base-client.ts
export abstract class BaseMCPClient {
  abstract connect(): Promise<void>;
  abstract listTools(): Promise<Tool[]>;
  abstract callTool(name: string, args: unknown): Promise<unknown>;
  abstract disconnect(): Promise<void>;
}

// src/mcp/core/stdio-client.ts
export class StdioMCPClient extends BaseMCPClient {
  // 封装 @modelcontextprotocol/sdk
}

// src/mcp/core/retry-client.ts
export class RetryMCPClient extends BaseMCPClient {
  constructor(private inner: BaseMCPClient, config: RetryConfig) {}
  // 装饰器模式包装重试逻辑
}

// src/mcp/factory.ts
export class MCPClientFactory {
  static create(config: MCPConfig): BaseMCPClient {
    const base = new StdioMCPClient(config);
    return config.retry ? new RetryMCPClient(base, config.retry) : base;
  }
}
```

**方案 B：策略模式（备选）**

保留现有 3 个客户端，创建统一接口：

```typescript
export interface IMCPClient {
  connect(): Promise<void>;
  listTools(): Promise<Tool[]>;
  disconnect(): Promise<void>;
}

// 让现有 3 个类实现此接口
```

**推荐：方案 A**
- 优点：消除重复代码，清晰的职责分离，易于扩展新传输层
- 缺点：需要重构现有代码（约 12 小时，符合预估）
- 向后兼容：保留旧类作为 deprecated 导出

**风险评估：**
- **破坏性变更风险：** 中（需要更新所有 MCP 调用方）
- **测试覆盖：** 需新增 15+ 集成测试（计划已包含）
- **性能影响：** 无（抽象层开销可忽略）

---

## 2. 数据模型影响

### Schema 变更

**无需 Schema 变更。** 所有任务都是代码重构，不涉及数据库或持久化格式变更。

### API 变更

**内部 API 变更（不影响外部用户）：**

1. **bridge-normalize 导出**
   - 变更前：`import { normalizeHookInput } from './bridge-normalize.js'`
   - 变更后：`import { normalizeHookInput } from './bridge/normalization.js'`（或通过 re-export 层保持不变）

2. **MCP 客户端实例化**
   - 变更前：`new MCPClient()` / `new RetryMCPClient()`
   - 变更后：`MCPClientFactory.create(config)`

**向后兼容策略：** 保留旧导出路径 6 个月，添加 deprecation 警告。

---

## 3. 风险评估

### 3.1 高风险项

| 任务 | 风险 | 影响 | 缓解措施 | 残余风险 |
|------|------|------|----------|----------|
| 2.2 hooks/ 类型迁移 | 核心功能破坏 | P0 | 分 3 批迁移 + 回滚分支 | 低 |
| 3.1 拆分 bridge-normalize | 安全漏洞 | P0 | 2 人审查 + 额外集成测试 | 中 |
| 3.2 MCP 整合 | 集成破坏 | P1 | 适配器模式 + 渐进式迁移 | 中 |

**关键发现：**

**任务 3.1 残余风险偏高** 的原因：
- 安全关键代码（SENSITIVE_HOOKS, checkPrototypePollution）
- 拆分边界不清晰可能导致职责泄漏
- 仅 2 人审查可能不足

**额外缓解建议：**
1. 添加第 3 名安全专家审查
2. 在 staging 环境运行 1 周后再上生产
3. 添加运行时断言验证安全过滤逻辑

### 3.2 中风险项

| 任务 | 风险 | 缓解措施 |
|------|------|----------|
| 2.1 tools/ 迁移 | 类型变更影响面大 | 使用泛型保持 API 灵活性 |
| 4.1 错误处理标准化 | 错误捕获逻辑失效 | 保持向后兼容，逐步迁移 |

### 3.3 依赖风险

**外部依赖稳定性：**
- `zod`：稳定（v3.x，广泛使用）
- `@modelcontextprotocol/sdk`：**不稳定**（早期版本，API 可能变更）

**建议：** 在 MCP 整合中添加版本锁定 + 适配器层隔离变更。

---

## 4. 性能影响

### 4.1 构建时间

**预期影响：** +5-8%（低于 10% 门禁）

**原因：**
- 增加类型检查开销（strict mode）
- 模块拆分增加文件数量

**验证方法：**
```bash
# 基准测试
time npm run build  # 当前: ~45s

# 每个阶段后重新测试
```

### 4.2 运行时性能

**bridge-normalize 拆分：**
- 影响：可忽略（函数调用开销 <1μs）
- 优化：fast-path 逻辑保留在 normalization.ts 中

**MCP 客户端抽象：**
- 影响：可忽略（抽象层无额外计算）
- 优化：工厂方法内联，避免动态分派

**类型擦除：**
- TypeScript 类型在运行时完全擦除，零性能影响

---

## 5. 可行性评估

### 5.1 复杂度评分

| 阶段 | 复杂度 (1-10) | 评估 |
|------|---------------|------|
| 阶段 1：稳定化 | 3 | 简单（测试修复 + 类型守卫） |
| 阶段 2：类型安全 | 7 | 中等（需要深入理解类型系统） |
| 阶段 3：架构清理 | 8 | 复杂（涉及安全关键代码） |
| 阶段 4：打磨 | 4 | 简单（文档 + 清理工作） |

**总体复杂度：** 6.5/10（中等偏高）

### 5.2 技术栈匹配

**所需技能：**
- ✅ TypeScript 高级特性（泛型、类型守卫、条件类型）
- ✅ Zod 验证库
- ✅ 设计模式（适配器、工厂、装饰器）
- ✅ 安全编码（原型污染防护、输入验证）

**团队能力评估：**
- TypeScript Specialist：✅ 具备
- Senior Engineer：✅ 具备
- Integration Engineer：⚠️ 需要 MCP SDK 培训

**建议：** 在阶段 3 开始前，为 Integration Engineer 安排 2 小时 MCP SDK 培训。

### 5.3 时间估算验证

| 任务 | 计划工作量 | 实际预估 | 差异 |
|------|-----------|---------|------|
| 1.1 修复测试 | 2h | 2-3h | ✅ 合理 |
| 1.2 类型守卫 | 4h | 4-6h | ✅ 合理 |
| 2.1 tools/ 迁移 | 12h | 15-18h | ⚠️ 偏低 |
| 2.2 hooks/ 迁移 | 16h | 20-24h | ⚠️ 偏低 |
| 3.1 拆分 bridge | 16h | 16-20h | ✅ 合理 |
| 3.2 MCP 整合 | 12h | 16-20h | ⚠️ 偏低 |

**总工作量修正：** 113h → **135-150h**（约 17-19 人天）

**建议：** 将总工期从 6 周延长至 **7-8 周**，或增加 1 名工程师。

---

## 6. 实施建议

### 6.1 必须修订的任务

**任务 3.1：拆分 bridge-normalize.ts**

修订内容：
1. 明确 4 个模块边界（validation, normalization, security, config）
2. 定义模块间依赖关系（单向依赖链）
3. 添加第 3 名安全审查员
4. 在 staging 环境验证 1 周

**任务 3.2：整合 MCP 客户端**

修订内容：
1. 采用适配器模式（方案 A）
2. 绘制类图和交互序列图
3. 定义向后兼容策略（保留旧类 6 个月）
4. 添加 MCP SDK 版本锁定

**任务 2.1-2.3：类型迁移**

修订内容：
1. 调整迁移顺序（基础层优先）
2. 增加工作量预估（+20-30%）
3. 每个子阶段添加依赖验证检查点

### 6.2 可选优化

1. **并行化阶段 1 任务**
   - 任务 1.1, 1.2, 1.3 无依赖关系，可并行执行
   - 可缩短阶段 1 至 3-4 天

2. **提前创建 tests/helpers/**
   - 任务 3.3 可提前至阶段 1 执行
   - 为后续测试重构提供基础

3. **增量发布策略**
   - 每个阶段完成后发布 beta 版本
   - 收集早期反馈，降低最终发布风险

---

## 7. 质量保证

### 7.1 测试策略

**当前测试覆盖：** 40%（基准）

**目标覆盖：** ≥40%（保持不变）

**关键测试场景：**

1. **bridge-normalize 拆分**
   - 单元测试：每个新模块 ≥90% 覆盖
   - 集成测试：验证 4 个调用方无破坏
   - 安全测试：原型污染、字段过滤、敏感 hook 处理

2. **类型迁移**
   - 编译测试：`tsc --noEmit` 零错误
   - 运行时测试：所有现有测试保持通过
   - 回归测试：对比迁移前后的类型推断结果

3. **MCP 整合**
   - 单元测试：工厂方法、适配器逻辑
   - 集成测试：3 个 MCP 提供商（Codex, Gemini, omc-tools）
   - 端到端测试：完整的 MCP 调用流程

### 7.2 质量门禁增强

在现有门禁基础上，添加：

**阶段 2（类型安全）：**
- [ ] `grep -r ": any" src/ | wc -l` 减少 ≥35 个（64% 目标）
- [ ] 无新增 `@ts-ignore` 或 `@ts-expect-error`

**阶段 3（架构清理）：**
- [ ] 循环依赖检测：`madge --circular src/`
- [ ] 安全审计：3 名审查员签字

**阶段 4（打磨）：**
- [ ] 文档覆盖：所有公共 API 有 JSDoc
- [ ] 迁移指南：包含 3 个实际代码示例

---

## 8. 权衡分析

### 8.1 拆分 bridge-normalize

| 选项 | 优点 | 缺点 |
|------|------|------|
| **A. 拆分为 4 个模块（推荐）** | 职责清晰，易于测试，降低复杂度 | 增加文件数量，需要更新导入路径 |
| B. 拆分为 3 个模块 | 文件数量较少 | 职责边界模糊（验证 + 配置混合） |
| C. 保持单文件 | 零迁移成本 | 持续高复杂度，难以维护 |

**推荐：选项 A**

### 8.2 MCP 整合方案

| 选项 | 优点 | 缺点 |
|------|------|------|
| **A. 适配器模式（推荐）** | 消除重复，易于扩展，清晰抽象 | 需要重构现有代码（12-16h） |
| B. 策略模式 | 保留现有代码，迁移成本低 | 重复代码仍存在，长期维护成本高 |
| C. 不整合 | 零成本 | 技术债务持续累积 |

**推荐：选项 A**

### 8.3 类型迁移顺序

| 选项 | 优点 | 缺点 |
|------|------|------|
| **A. 基础层优先（推荐）** | 符合依赖关系，稳定性高 | 需要重新规划任务 |
| B. 按计划顺序（tools → hooks） | 无需调整计划 | 可能遇到类型不稳定问题 |

**推荐：选项 A**

---

## 9. 长期可维护性

### 9.1 架构演进路径

**当前架构：** 单体模块 + 隐式依赖

**目标架构：** 分层模块 + 显式接口

**演进步骤：**
1. ✅ 阶段 1-2：建立类型安全基础
2. ✅ 阶段 3：模块化核心组件
3. 🔄 未来：提取共享库（hooks-core, mcp-core）
4. 🔄 未来：插件化架构（动态加载 hooks）

### 9.2 技术债务预防

**建立的机制：**
1. 严格类型检查（`strict: true`）
2. 代码复杂度限制（ESLint complexity rule）
3. 强制 JSDoc 注释（公共 API）
4. 定期审计（每季度运行审计脚本）

**缺失的机制（建议补充）：**
1. 依赖图可视化（使用 madge 或 dependency-cruiser）
2. 架构决策记录（ADR，记录重大设计决策）
3. 自动化重构检测（检测大文件、高耦合模块）

---

## 10. 结论与建议

### 10.1 总体评估

| 维度 | 评分 (1-10) | 说明 |
|------|-------------|------|
| 架构合理性 | 7 | 整体方向正确，但细节需完善 |
| 风险控制 | 8 | 质量门禁完善，回滚策略清晰 |
| 可行性 | 7 | 技术栈匹配，但工作量偏低 |
| 长期价值 | 9 | 显著提升代码质量和可维护性 |

**综合评分：** 7.75/10

### 10.2 批准决定

**✅ 有条件批准**

**前置条件：**
1. 修订任务 3.1（明确拆分边界，添加第 3 名审查员）
2. 修订任务 3.2（采用适配器模式，绘制设计图）
3. 调整任务 2.1-2.3 迁移顺序
4. 增加总工期至 7-8 周（或增加 1 名工程师）

**批准后立即可执行：**
- ✅ 阶段 1 所有任务（1.1, 1.2, 1.3）
- ✅ 任务 2.1（tools/ 迁移，按新顺序）

**需修订后执行：**
- ⚠️ 任务 3.1（拆分 bridge-normalize）
- ⚠️ 任务 3.2（MCP 整合）

### 10.3 下一步行动

**立即行动（本周内）：**
1. Tech Lead 召集会议，讨论本评审报告（预计 1.5 小时）
2. Senior Engineer 绘制 bridge-normalize 拆分设计图
3. Integration Engineer 绘制 MCP 整合类图
4. 更新计划文档，反映修订内容

**短期行动（下周）：**
5. 提交修订后的计划给 Product Owner 批准
6. 为 Integration Engineer 安排 MCP SDK 培训
7. 启动阶段 1（2026-03-18）

---

## 附录

### A. 参考文件

- `src/hooks/bridge-normalize.ts:1-469` - 当前实现（469 行）
- `src/mcp/client.ts:1-51` - MCP 客户端实现 1
- `src/mcp/retry-client.ts:1-74` - MCP 客户端实现 2
- `src/mcp/client/MCPClient.ts` - MCP 客户端实现 3（重复）

### B. 关键指标基准

| 指标 | 当前值 | 数据来源 |
|------|--------|----------|
| bridge-normalize.ts 行数 | 469 | `wc -l` |
| bridge-normalize 导入方 | 4 | `grep -r` |
| tools/ 'any' 使用 | 155 | `grep -r` |
| hooks/ 'any' 使用 | 34 | `grep -r` |
| TODO 标记 | 51 | `grep -r` |
| tests/helpers/ 文件数 | 0 | `find` |

### C. 联系人

- **架构评审：** Architect (Oracle)
- **计划作者：** Planner Agent
- **技术负责人：** Tech Lead（待分配）

---

**报告生成时间：** 2026-03-17 20:44 UTC
**下次评审：** 修订计划提交后
