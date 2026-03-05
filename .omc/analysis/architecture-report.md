
## 架构优势

### 1. 松耦合设计
- Agent 通过 MCP 协议与工具解耦
- Hook 系统通过事件驱动实现扩展
- 多后端支持 (Claude/Codex/Gemini) 统一接口

### 2. 安全防护
- 输入消毒：白名单过滤未知字段
- 路径校验：防止路径遍历攻击
- 工具隔离：按类别禁用敏感工具

### 3. 可扩展性
- Agent 注册表：动态加载 prompt
- Hook 路由：15 种事件类型可扩展
- 状态机：支持多种执行模式 (autopilot/ralph/team)

## 架构权衡

| 设计选择 | 优点 | 缺点 |
|---------|------|------|
| Hook Bridge (Shell → TS) | 灵活、可热更新 | 进程间通信开销 |
| 49 个专业 agents | 职责清晰、可组合 | 管理复杂度高 |
| MCP 工具服务器 | 标准协议、跨语言 | 序列化开销 |
| 多后端支持 | 模型选择灵活 | 状态同步复杂 |

## 关键文件参考

- `src/agents/definitions.ts:1-721` - 49 agents 定义和编排提示词
- `src/hooks/bridge.ts:1-100` - Hook 路由核心逻辑
- `src/mcp/omc-tools-server.ts:1-80` - 18 工具分类和禁用机制
- `src/team/unified-team.ts:1-80` - 多后端统一视图
- `src/lib/validateMode.ts` - 安全校验边界
- `package.json:1-127` - 依赖和构建流程

## 总结

Ultrapower 采用**分层编排 + 事件驱动**架构，通过 Agent 注册表、Hook 系统、MCP 工具服务器和状态机实现 49 个专业 agents 的协作。核心设计原则是**松耦合、安全优先、可扩展**，适合复杂的多 Agent 编排场景。
