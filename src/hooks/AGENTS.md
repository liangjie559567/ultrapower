<!-- Generated: 2026-01-28 | Updated: 2026-03-05 -->

# src/hooks/ - Hooks 系统

**用途：** 47 个事件驱动的 hooks 实现。支持会话启动、工具执行、状态变化等事件。

**版本：** 5.5.14

## 关键文件

| 文件 | 描述 |
|------|------|
| `index.ts` | Hook 注册表和路由 |
| `bridge.ts` | Hook 与外部系统的桥接 |
| `bridge-types.ts` | Hook 类型定义 |
| `bridge-normalize.ts` | Hook 输入消毒和验证 |
| `types.ts` | Hook 类型系统 |

## Hook 类型（15 类）

| Hook 类型 | 触发时机 | 用途 |
|----------|---------|------|
| session-start | 会话开始 | 初始化、加载上下文 |
| session-end | 会话结束 | 清理、保存状态 |
| tool-before | 工具执行前 | 验证、预处理 |
| tool-after | 工具执行后 | 后处理、日志 |
| agent-start | 智能体启动 | 初始化 |
| agent-end | 智能体完成 | 验证、记录 |
| skill-start | Skill 启动 | 初始化 |
| skill-end | Skill 完成 | 验证、记录 |
| state-change | 状态变化 | 响应状态更新 |
| error | 错误发生 | 错误处理、恢复 |
| permission-request | 权限请求 | 权限验证 |
| setup | 系统设置 | 配置初始化 |
| message | 消息接收 | 消息处理 |
| notification | 通知发送 | 通知路由 |
| custom | 自定义事件 | 用户定义 |

## 子目录结构

```
src/hooks/
├── agent-usage-reminder/      # Agent 使用提醒
├── auto-slash-command/        # 自动斜杠命令
├── autopilot/                 # Autopilot 模式
├── axiom-boot/                # Axiom 启动
├── axiom-guards/              # Axiom 守卫
├── background-notification/   # 后台通知
├── beads-context/             # Beads 上下文
├── comment-checker/           # 注释检查
├── directory-readme-injector/ # 目录 README 注入
├── empty-message-sanitizer/   # 空消息清理
├── guards/                    # 通用守卫
├── keyword-detector/          # 关键词检测
├── learner/                   # 学习器
├── memory/                    # 内存管理
├── mode-registry/             # 模式注册
├── nexus/                     # Nexus 集成
├── non-interactive-env/       # 非交互环境
├── notepad/                   # Notepad 集成
├── observability/             # 可观测性
├── omc-orchestrator/          # OMC 编排
├── permission-handler/        # 权限处理
├── persistent-mode/           # 持久模式
├── plugin-patterns/           # 插件模式
├── pre-compact/               # 预压缩
├── preemptive-compaction/     # 抢占式压缩
├── project-memory/            # 项目记忆
├── ralph/                     # Ralph 模式
├── recovery/                  # 恢复机制
├── rules-injector/            # 规则注入
├── session-end/               # 会话结束
├── setup/                     # 设置
├── subagent-tracker/          # 子智能体追踪
├── team-pipeline/             # Team 流水线
├── think-mode/                # 思考模式
├── thinking-block-validator/  # 思考块验证
├── todo-continuation/         # TODO 继续
├── ultrapilot/                # Ultrapilot 模式
├── ultraqa/                   # UltraQA 模式
├── ultrawork/                 # Ultrawork 模式
└── __tests__/                 # 测试
```

## 面向 AI 智能体

### 在此目录中工作

1. **添加新 hook**
   - 在 `src/hooks/` 中创建目录
   - 实现 hook 处理逻辑
   - 在 `index.ts` 中注册
   - 在 `bridge.ts` 中配置路由

2. **修改 hook 行为**
   - 编辑对应的 hook 目录中的实现
   - 运行 `npm test` 验证
   - 检查 `bridge-normalize.ts` 中的输入验证

3. **调试 hook 执行**
   - 查看 `bridge.ts` 中的路由逻辑
   - 检查 `bridge-normalize.ts` 中的消毒规则
   - 验证 hook 类型和触发条件

### 修改检查清单

| 修改位置 | 验证步骤 |
|---------|---------|
| Hook 实现 | 运行 `npm test` |
| Hook 注册 | 检查 `index.ts` |
| Hook 路由 | 检查 `bridge.ts` |
| 输入验证 | 检查 `bridge-normalize.ts` |

### 安全规则

- 所有 hook 输入必须通过 `bridge-normalize.ts` 白名单过滤
- 禁止直接使用 `input.success`，使用 `input.success !== false`
- 路径参数必须通过 `assertValidMode()` 校验
