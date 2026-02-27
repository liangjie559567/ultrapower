# nexus 系统设计文档

> **状态：** 设计已确认 | **日期：** 2026-02-26 | **分支：** feat/phase2-active-learning

## 背景

ultrapower v5.0.x 是一个成熟的多 agent 编排层，具备 70 个 skills、49 个 agents、35 个 hooks。
但它本质上是"被动响应"系统——没有自我提升能力，没有后台意识，无法自动改进自身。

本设计基于对 ouroboros（自修改 AI agent）的深度分析，提出 **nexus** 系统：
在保留 ultrapower 现有价值的基础上，添加完整的自我提升能力。

---

## 系统命名

**nexus**（连接插件与云端）

---

## 核心目标

1. **自动重写自身代码**：基于使用数据自动改进 skills/agents/hooks
2. **后台意识循环**：VPS 上持续运行的后台思考进程
3. **进化引擎/知识积累**：跨会话学习，积累知识图谱和代码模式库
4. **自我评估与反馈回路**：分析 skill 效果，生成健康报告

---

## 架构：双层设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code (本地)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              nexus 插件层                            │    │
│  │  hooks: data-collector, consciousness-sync,          │    │
│  │         improvement-puller                           │    │
│  │  skills: nexus-status, nexus-evolve, nexus-review    │    │
│  │  保留现有: 70 skills + 49 agents + 35 hooks          │    │
│  └──────────────────┬──────────────────────────────────┘    │
└─────────────────────┼───────────────────────────────────────┘
                      │ Git 同步
                      │ .omc/nexus/events/ → git push
                      │ improvements/ ← git pull
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    VPS 云端层 (nexus-daemon)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Consciousness│  │  Evolution   │  │  Self-Modifier   │   │
│  │    Loop      │  │   Engine     │  │  (git + PR)      │   │
│  │ (每5分钟)    │  │ (知识积累)   │  │ (代码自动改进)   │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │  Evaluator   │  │  Telegram    │                          │
│  │ (自我评估)   │  │    Bot       │                          │
│  └──────────────┘  └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### 与 ultrapower 的关系

- **升级，不替换**：保留现有 70 skills + 49 agents + 35 hooks 的全部价值
- nexus 作为新的顶层能力层叠加在 ultrapower 之上
- 现有用户无感知升级

---

## 通信机制：Git 同步

插件层和 VPS 云端层通过 Git 仓库同步数据：

```
插件层写入 → .omc/nexus/events/{sessionId}-{timestamp}.json
           → git commit + push → nexus-daemon 仓库

VPS 每分钟 git pull → 读取新 events → 处理
VPS 生成改进 → 写入 improvements/{id}.json
             → git commit + push → 插件层 git pull 拉取
```

**优点：**
- 无需网络端口，无需 API 服务器
- 天然版本控制，可回溯所有数据
- 离线时数据不丢失，重连后自动同步

---

## 数据流

```
[Claude Code 会话]
    │
    ├─ UserPromptSubmit hook → 收集用户消息 + 触发词
    ├─ PostToolUse hook → 收集工具调用数据
    └─ SessionEnd hook → 打包会话数据 → 写入 .omc/nexus/events/
                                    → git commit + push
                                              │
                              [VPS nexus-daemon 每分钟 git pull]
                                              │
                              ┌───────────────▼──────────────┐
                              │      事件处理器               │
                              │  解析 events/ 目录新文件      │
                              └───────────────┬──────────────┘
                                              │
                    ┌─────────────────────────┼──────────────────────┐
                    ▼                         ▼                       ▼
          [Evolution Engine]        [Consciousness Loop]    [Self-Evaluator]
          知识积累 + 模式检测         每5分钟独立思考          分析使用数据
          更新 knowledge_base        生成洞见/改进想法        评估 skill 效果
                    │                         │                      │
                    └─────────────────────────┼──────────────────────┘
                                              │
                              ┌───────────────▼──────────────┐
                              │      Self-Modifier            │
                              │  生成代码改进 → git PR        │
                              │  改进 skills/agents/hooks     │
                              └───────────────┬──────────────┘
                                              │
                              ┌───────────────▼──────────────┐
                              │      Telegram Bot             │
                              │  通知改进完成 + 接收指令      │
                              └──────────────────────────────┘
```

---

## VPS 核心模块详细设计

### 1. Consciousness Loop（后台意识循环）

- **频率：** 每 5 分钟一轮
- **预算上限：** 总预算的 10%
- **行为：**
  - 读取最近会话数据 + knowledge_base
  - 生成"当前状态感知"和"改进想法"
  - 写入 `consciousness/scratchpad.md`
  - 暂停条件：有任务正在执行时暂停（避免干扰）
- **参照：** ouroboros BackgroundConsciousness（MAX_BG_ROUNDS=5）

### 2. Evolution Engine（进化引擎）

- **输入：** events/ 目录的会话数据
- **模式检测：** 同类问题出现 ≥ 3 次 → 提升为 skill 候选
- **知识积累：** 成功解决方案 → 写入 `evolution/knowledge_base.md`
- **触发词优化：** 基于实际触发场景更新 skill triggers
- **置信度系统：** 0-100 分
  - ≥ 80：触发自动改进（全自动 PR）
  - < 80：生成建议，Telegram 确认后执行

### 3. Self-Modifier（代码自动修改）

- **输入：** Evolution Engine 的改进建议
- **操作范围（分级）：**
  - `skills/*.md`、`agents/*.md`：文档级，置信度 ≥ 70 自动
  - `src/hooks/*.ts`：代码级，置信度 ≥ 85 自动，否则 Telegram 确认
- **安全门禁：** `tsc --noEmit && npm test` 必须通过才能提交
- **流程：** 生成 diff → 运行测试 → 置信度判断 → 自动/Telegram 确认 → git PR

### 4. Self-Evaluator（自我评估）

- **分析内容：**
  - Skill 使用频率和触发成功率
  - 检测"僵尸 skill"（从未被触发）
  - Agent 调用模式分析
- **输出：** 健康报告 → 推送 Telegram（每日一次）

---

## 代码自动修改：审批流程

```
改进建议生成
    │
    ├─ confidence >= 80 → 自动运行测试 → 测试通过 → 自动 PR + 合并
    │                                  → 测试失败 → Telegram 通知 + 人工介入
    │
    └─ confidence < 80  → Telegram 发送改进建议
                        → 用户确认 → 运行测试 → 合并
                        → 用户拒绝 → 记录反馈，降低该类改进置信度
```

---

## 改进建议数据格式

```json
{
  "id": "imp-20260226-001",
  "createdAt": "2026-02-26T14:11:23Z",
  "source": "evolution_engine",
  "type": "skill_update",
  "targetFile": "skills/learner/SKILL.md",
  "confidence": 87,
  "diff": "--- a/skills/learner/SKILL.md\n+++ b/skills/learner/SKILL.md\n...",
  "reason": "触发词 'learn' 在过去 10 次会话中出现 23 次但未触发，建议添加同义词",
  "evidence": {
    "sessionCount": 10,
    "triggerMisses": 23,
    "suggestedTriggers": ["study", "remember", "memorize"]
  },
  "status": "pending",
  "testResult": null
}
```

---

## 插件层新增组件

### 新增 Hooks

```
src/hooks/nexus/
├── data-collector.mjs      # 收集会话数据，写入 .omc/nexus/events/
├── consciousness-sync.mjs  # SessionEnd 后触发 git push
└── improvement-puller.mjs  # 定期 git pull 拉取 VPS 生成的改进
```

### 新增 Skills

```
skills/nexus/
├── nexus-status/SKILL.md   # 查看 nexus 系统状态
├── nexus-evolve/SKILL.md   # 手动触发进化
└── nexus-review/SKILL.md   # 查看待审批的改进建议
```

---

## 存储结构

### 插件层（本地）

```
.omc/nexus/
├── events/                           # 会话事件（git push 到 VPS）
│   └── {sessionId}-{timestamp}.json  # 每次会话的数据包
├── improvements/                     # VPS 生成的改进（git pull 拉取）
│   └── {id}-{timestamp}.json         # 待审批或已应用的改进
└── config.json                       # nexus 配置
```

### VPS 端（nexus-daemon 仓库）

```
nexus-daemon/
├── consciousness/
│   ├── scratchpad.md                 # 当前意识状态（工作记忆）
│   ├── identity.md                   # 系统身份/价值观（长期记忆）
│   └── rounds/                       # 每轮意识循环记录
├── evolution/
│   ├── knowledge_base.md             # 知识图谱（置信度系统）
│   ├── pattern_library.md            # 代码模式库（出现 ≥3 次提升）
│   └── learning_queue.md             # 待处理学习素材（P0-P3 优先级）
├── improvements/                     # 生成的改进建议
│   └── {id}.json                     # 含代码 diff + 置信度
└── state.json                        # 守护进程状态
```

---

## 技术栈

| 层 | 技术 | 理由 |
|---|---|---|
| 插件层 | TypeScript | 与现有 ultrapower 一致 |
| VPS 守护进程 | Python 3.11 | 类 ouroboros 架构，asyncio 支持后台循环 |
| LLM 调用 | OpenRouter API | 多模型支持，成本优化 |
| 通信 | Git 同步 | 无需端口，天然版本控制 |
| 通知 | Telegram Bot | 类 ouroboros，支持远程指令 |
| 进程管理 | systemd | VPS 守护进程标准方案 |

---

## 部署方案

### 插件层

1. 在现有 ultrapower npm 包基础上添加 nexus 模块
2. 新增 3 个 hooks + 3 个 skills
3. 配置 `.omc/nexus/config.json`

```json
{
  "nexus": {
    "enabled": true,
    "gitRemote": "git@github.com:user/nexus-daemon.git",
    "telegramToken": "...",
    "telegramChatId": "...",
    "autoApplyThreshold": 80,
    "consciousnessInterval": 300,
    "consciousnessBudgetPercent": 10
  }
}
```

### VPS 云端层

```bash
git clone git@github.com:user/nexus-daemon.git
cd nexus-daemon
pip install -r requirements.txt
systemctl enable nexus-daemon
systemctl start nexus-daemon
```

---

## 实现优先级

### P0（核心，必须先做）
1. **data-collector hook**：收集会话数据
2. **consciousness-sync hook**：SessionEnd 后 git push
3. **nexus-daemon 基础框架**：Python 守护进程 + git pull 循环
4. **Evolution Engine MVP**：模式检测 + knowledge_base 写入

### P1（重要）
5. **Consciousness Loop**：后台意识循环
6. **Self-Modifier MVP**：skill 文档级自动改进
7. **Telegram Bot**：通知 + 确认流程
8. **improvement-puller hook**：拉取改进并应用

### P2（增强）
9. **Self-Evaluator**：健康报告
10. **Self-Modifier 进阶**：TypeScript 代码级改进
11. **nexus-status/evolve/review skills**：管理界面

---

## 风险与约束

| 风险 | 影响 | 缓解策略 |
|------|------|---------|
| 代码自动修改破坏插件 | 高 | 强制 tsc + npm test 门禁；置信度分级 |
| 意识循环成本失控 | 中 | 10% 预算硬上限；每轮成本追踪 |
| Git 同步冲突 | 低 | events/ 和 improvements/ 目录分离；文件名含时间戳 |
| VPS 宕机导致数据丢失 | 低 | 插件层本地缓存；Git 历史可回溯 |
| Telegram token 泄露 | 中 | 存储在 .omc/nexus/config.json（gitignore） |

---

## 验收标准

- [ ] 会话结束后，数据自动推送到 nexus-daemon 仓库
- [ ] VPS 守护进程每分钟拉取新事件并处理
- [ ] 后台意识循环每 5 分钟运行一次，写入 scratchpad.md
- [ ] 同类模式出现 ≥ 3 次后，Evolution Engine 生成改进建议
- [ ] 置信度 ≥ 80 的改进自动通过测试后合并
- [ ] 置信度 < 80 的改进通过 Telegram 发送确认请求
- [ ] 所有代码修改必须通过 `tsc --noEmit && npm test`
- [ ] 不破坏 ultrapower 现有任何功能
