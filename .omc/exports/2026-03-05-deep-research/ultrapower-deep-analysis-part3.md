# Ultrapower 项目深度研究报告 (Part 3/4)

## 5. 后端架构与服务分析

### 5.1 MCP 服务器架构

**协议实现:** MCP (Model Context Protocol) 1.26.0

**服务器清单:**

| 服务器 | 文件 | 用途 |
|--------|------|------|
| OMC Tools | `omc-tools-server.ts` | 35 个自定义工具 |
| Codex | `codex-server.ts` | OpenAI GPT-5.3 桥接 |
| Gemini | `gemini-server.ts` | Google Gemini-3 桥接 |

**工具注册机制:**
```typescript
// 工具注册流程
1. 定义工具 schema (Zod)
2. 实现工具处理函数
3. 注册到 MCP server
4. 暴露给 Claude Code
```

**请求处理流程:**
```
Claude Code
  ↓ (MCP 请求)
MCP Server
  ↓ (工具调用)
Tool Handler
  ↓ (执行)
返回结果
```

### 5.2 API 设计评估

**工具接口规范:**
- 使用 Zod schema 验证
- 统一错误格式
- 支持流式响应（部分工具）

**数据格式:**
```typescript
// 标准工具响应
{
  content: [{
    type: "text",
    text: "结果内容"
  }],
  isError?: boolean
}
```

**评分:** ⭐⭐⭐⭐☆ (4/5)
- ✅ Schema 验证完整
- ✅ 错误处理规范
- ⚠️ 缺少 API 版本控制
- ⚠️ 部分工具缺少速率限制

### 5.3 服务间通信

**Agent 间消息传递:**
- 使用 Claude Code 原生 Team 工具
- 消息格式: JSON
- 支持广播和点对点

**状态同步:**
- SQLite 数据库（任务状态）
- 文件系统（.omc/ 状态文件）
- 内存缓存（会话状态）

### 5.4 认证与授权

**API Key 管理:**
- Codex: 环境变量 `OPENAI_API_KEY`
- Gemini: 环境变量 `GEMINI_API_KEY`
- 存储位置: 用户环境变量（不存储在代码中）

**权限控制:**
- 文件系统访问: 基于 worktree 路径
- 工具调用: 无额外权限检查（依赖 Claude Code）

**安全评分:** ⭐⭐⭐☆☆ (3/5)
- ✅ API key 不硬编码
- ⚠️ 缺少工具级权限控制
- ⚠️ 路径遍历防护需加强

### 5.5 日志与监控

**日志系统:**
- 位置: `.omc/logs/`
- 格式: JSON Lines
- 级别: ERROR, WARN, INFO, DEBUG

**性能追踪:**
- Token 使用统计
- Agent 执行时间
- 工具调用频率

**监控工具:**
- `omc-analytics` CLI 命令
- 实时 HUD 显示

---

## 6. 数据库设计与数据流

### 6.1 数据库类型与选型

**SQLite 使用场景:**
- Team 任务队列
- Job 状态管理
- Analytics 数据存储

**选型理由:**
- ✅ 零配置，嵌入式
- ✅ 事务支持
- ✅ 跨平台兼容
- ⚠️ 并发写入限制

### 6.2 数据模型设计

**核心表结构:**

```sql
-- 任务表
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  team_name TEXT,
  subject TEXT,
  description TEXT,
  status TEXT,  -- pending/in_progress/completed
  owner TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

-- Job 状态表
CREATE TABLE job_states (
  job_id TEXT PRIMARY KEY,
  provider TEXT,  -- codex/gemini
  status TEXT,
  created_at INTEGER,
  completed_at INTEGER,
  result TEXT
);
```

**文件系统状态:**
```
.omc/
├── state/
│   ├── autopilot-state.json
│   ├── ralph-state.json
│   ├── team-state.json
│   └── pipeline-state.json
├── notepad.md
├── project-memory.json
└── logs/
```

### 6.3 查询性能优化

**索引策略:**
- 主键索引: 自动创建
- 外键索引: 手动创建
- 复合索引: 按需添加

**查询优化:**
- 使用 prepared statements
- 批量插入优化
- 连接池管理

**性能评分:** ⭐⭐⭐⭐☆ (4/5)

### 6.4 数据迁移策略

**版本升级:**
- 检测旧版本状态文件
- 自动迁移到新格式
- 保留备份

**迁移脚本:**
- 位置: `scripts/migrate-*.mjs`
- 执行时机: postinstall hook

### 6.5 数据安全与隐私

**敏感信息保护:**
- ✅ API key 不存储在数据库
- ✅ 用户输入不记录到日志
- ⚠️ 状态文件未加密

**备份策略:**
- 自动备份: 版本升级时
- 手动备份: 用户可触发
- 恢复机制: 支持回滚

**安全评分:** ⭐⭐⭐☆☆ (3/5)
