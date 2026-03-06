# Ultrapower 项目深度研究报告 (Part 2/4)

## 3. 代码实现与技术结构分析

### 3.1 静态代码分析

**代码规范:**
- ✅ TypeScript strict mode 启用
- ✅ ESLint 配置完整
- ✅ Prettier 格式化一致
- ⚠️ 部分文件超过 500 行（需拆分）

**潜在问题:**
1. **循环依赖风险:** `src/features/` 和 `src/hooks/` 之间存在交叉引用
2. **类型安全:** 部分 `any` 类型使用（主要在 MCP 桥接层）
3. **错误处理:** 部分异步函数缺少 try-catch

### 3.2 依赖关系可视化

```
核心依赖图:
src/index.ts (入口)
  ├─> src/agents/ (Agent 定义)
  ├─> src/features/ (功能模块)
  │    ├─> boulder-state (状态管理)
  │    ├─> delegation-enforcer (委派)
  │    └─> magic-keywords (关键词)
  ├─> src/hooks/ (Hook 系统)
  │    └─> bridge.ts (输入消毒)
  ├─> src/team/ (Team 协调)
  │    ├─> unified-team.ts
  │    └─> task-router.ts
  └─> src/mcp/ (MCP 服务器)
       ├─> omc-tools-server.ts
       ├─> codex-server.ts
       └─> gemini-server.ts
```

**外部依赖:**
- Claude Agent SDK → Agent 执行
- MCP SDK → 工具协议
- SQLite → 状态存储
- AST Grep → 代码搜索

### 3.3 设计模式识别

| 模式 | 应用位置 | 用途 |
|------|---------|------|
| **工厂模式** | `src/agents/definitions.ts` | Agent 创建 |
| **策略模式** | `src/features/delegation-enforcer/` | 委派策略 |
| **观察者模式** | `src/hooks/` | 事件监听 |
| **状态机模式** | `src/team/stage-pipeline.ts` | Team 流水线 |
| **单例模式** | `src/config/loader.ts` | 配置管理 |
| **适配器模式** | `src/mcp/codex-server.ts` | MCP 桥接 |
| **命令模式** | `src/cli/commands/` | CLI 命令 |

### 3.4 核心算法分析

**1. Agent 路由算法 (`src/features/magic-keywords/`)**
```typescript
// 伪代码
function routeToAgent(userInput: string): AgentType {
  // 1. 关键词检测
  const keywords = detectKeywords(userInput);

  // 2. 优先级排序
  const ranked = rankByPriority(keywords);

  // 3. 模式匹配
  if (matches("autopilot")) return "autopilot";
  if (matches("ralph")) return "ralph";

  // 4. 默认路由
  return "ultrawork";
}
```

**2. 状态机转换 (`src/team/stage-pipeline.ts`)**
```typescript
// Team Pipeline 状态转换
IDLE → PLANNING → CONFIRMING → EXECUTING →
  AUTO_FIX → BLOCKED → ARCHIVING → IDLE

// 转换条件:
- PLANNING → CONFIRMING: 规划完成
- CONFIRMING → EXECUTING: 用户确认
- EXECUTING → AUTO_FIX: 测试失败
- AUTO_FIX → EXECUTING: 修复完成
```

**3. 任务调度 (`src/team/task-router.ts`)**
- **策略:** 优先级队列 + 依赖图
- **并发控制:** 最多 20 个并发 Agent
- **负载均衡:** 基于 Agent 类型和模型

### 3.5 单元测试覆盖率

**测试框架:** Vitest 4.0.17

**覆盖情况 (估算):**
- 核心模块: ~60% 覆盖
- Hooks 系统: ~40% 覆盖
- MCP 服务器: ~30% 覆盖
- CLI 命令: ~50% 覆盖

**测试类型:**
- 单元测试: `src/**/*.test.ts`
- 集成测试: 部分存在
- E2E 测试: 缺失

**改进建议:**
1. 提升 Hooks 测试覆盖到 70%+
2. 添加 MCP 服务器集成测试
3. 建立 E2E 测试套件

---

## 4. 前端架构分析 (CLI)

### 4.1 CLI 架构

**框架:** Commander.js 12.1.0

**命令结构:**
```
ultrapower/omc
├── install          # 安装和配置
├── setup            # 初始化设置
├── analytics        # 分析报告
├── doctor           # 诊断工具
├── skill            # Skill 管理
├── trace            # 追踪查看
└── [skills]         # 动态加载的 71 个 skill
```

**参数解析:**
- 使用 Commander 内置解析器
- 支持短选项 (`-f`) 和长选项 (`--force`)
- 子命令嵌套支持

### 4.2 HUD 系统

**位置:** `src/hud/`

**功能:**
- 实时显示 Agent 状态
- Token 使用追踪
- 任务进度条
- 错误提示

**更新机制:**
- 事件驱动更新
- 最小重绘策略
- 终端兼容性检测
