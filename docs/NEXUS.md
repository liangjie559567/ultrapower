# Nexus 主动进化系统

ultrapower v5.2.2 的双层自我提升架构——让 AI 工作流真正越用越聪明。

---

## 目录

* [概述](#概述)

* [系统架构](#系统架构)

* [Phase 1：被动学习（已完成）](#phase-1被动学习已完成)

* [Phase 2：主动学习](#phase-2主动学习)

* [Nexus 双层架构](#nexus-双层架构)

* [核心模块详解](#核心模块详解)

* [数据存储结构](#数据存储结构)

* [配置参考](#配置参考)

* [Skills 使用指南](#skills-使用指南)

* [部署指南](#部署指南)

* [风险与约束](#风险与约束)

---

## 概述

ultrapower 的进化系统分为三个层次：

| 层次 | 名称 | 状态 | 核心能力 |
| ------ | ------ | ------ | --------- |
| Phase 1 | 被动学习 | ✅ 已完成 | 触发词匹配、模式检测、会话反思 |
| Phase 2 | 主动学习 | 🚧 开发中 | 反馈收集、效果追踪、主动推荐、质量迭代 |
| Nexus | 双层自我提升 | 📋 设计完成 | VPS 后台意识循环、代码自动修改、跨会话进化 |

**核心理念：** 从"被动响应"到"主动进化"——系统不仅能执行任务，还能感知自身效果、积累经验、自动改进。

---

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code（本地）                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Nexus 插件层                            │    │
│  │  hooks: data-collector, consciousness-sync,          │    │
│  │         improvement-puller                           │    │
│  │  skills: nexus-status, nexus-evolve, nexus-review    │    │
│  │                                                      │    │
│  │  Phase 2 主动学习模块（src/hooks/learner/）           │    │
│  │  ├── feedback/     反馈收集                          │    │
│  │  ├── effectiveness/ 效果追踪                         │    │
│  │  ├── recommender/  主动推荐                          │    │
│  │  └── quality/      质量迭代                          │    │
│  │                                                      │    │
│  │  保留现有: 71 skills + 49 agents + 39 hooks          │    │
│  └──────────────────┬──────────────────────────────────┘    │
└─────────────────────┼───────────────────────────────────────┘
                      │ Git 同步
                      │ .omc/nexus/events/ → git push
                      │ improvements/ ← git pull
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    VPS 云端层（nexus-daemon）                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Consciousness│  │  Evolution   │  │  Self-Modifier   │   │
│  │    Loop      │  │   Engine     │  │  (git + PR)      │   │
│  │ 每 5 分钟    │  │ 知识积累     │  │ 代码自动改进     │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │  Evaluator   │  │  Telegram    │                          │
│  │ 自我评估     │  │    Bot       │                          │
│  └──────────────┘  └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### 与 ultrapower 的关系

* **升级，不替换**：保留现有 71 skills + 49 agents + 39 hooks 的全部价值

* Nexus 作为顶层能力层叠加在 ultrapower 之上

* 现有用户无感知升级，所有现有功能继续正常工作

---

## Phase 1：被动学习（已完成）

Phase 1 建立了主动学习的基础设施，已合并到 main 分支。

### 已实现能力

| 模块 | 文件 | 功能 |
| ------ | ------ | ------ |
| Skill 发现 | `skill-loader.ts` | 扫描并解析 skill 文件 |
| 触发词匹配 | `skill-injector.mjs` | 用户消息 → 匹配 → 注入上下文 |
| 模式检测 | `auto-learner.ts` | 问题-解决方案对，置信度评分 |
| 自动调用 | `auto-invoke.ts` | 置信度阈值、冷却时间控制 |
| 使用指标 | `usage-tracker.ts` | 追踪 skill 使用频率和效果 |
| 会话反思 | `session-reflector.ts` | 会话结束自动反思 |
| 进化编排 | `orchestrator.ts` | 统一协调所有进化模块 |

### Phase 1 的局限

1. 没有用户反馈回路——skill 注入后不知道是否有用
2. 没有 skill 效果验证——无法知道注入的 skill 是否被采纳
3. 没有主动推荐界面——只是静默注入，用户无感知
4. 没有 skill 质量迭代——无法基于使用结果改进 skill 内容
5. 没有跨会话学习聚合——每次会话独立，无法积累洞见

---

## Phase 2：主动学习

**主动学习** = 系统能主动感知、评估、改进自身的 skill 库。

### 数据流

```
用户消息
    ↓
[Phase 1] 触发词匹配 → 被动注入
    ↓
助手响应
    ↓
[Phase 2] 效果追踪 → 采纳检测
    ↓
[Phase 2] 反馈收集 → 用户评分（可选）
    ↓
[Phase 2] 质量评估 → 更新 skill 置信度
    ↓
[Phase 2] 主动推荐 → 建议保存新 skill
    ↓
[Phase 2] 跨会话聚合 → 改进 skill 内容
```

### 新增模块结构

```
src/hooks/learner/
├── [Phase 1 已有文件...]
│
├── feedback/                    # 反馈系统
│   ├── collector.ts             # 反馈收集接口
│   ├── storage.ts               # 反馈持久化
│   └── types.ts                 # 反馈类型定义
│
├── effectiveness/               # 效果追踪
│   ├── tracker.ts               # 行为变化检测
│   ├── adoption-detector.ts     # Skill 采纳检测
│   └── types.ts
│
├── recommender/                 # 主动推荐
│   ├── engine.ts                # 推荐决策引擎
│   ├── timing.ts                # 推荐时机判断
│   └── formatter.ts             # 推荐消息格式化
│
└── quality/                     # 质量迭代
    ├── improver.ts              # Skill 内容改进
    ├── aggregator.ts            # 跨会话聚合
    └── types.ts
```

---

## Nexus 双层架构

### 通信机制：Git 同步

插件层和 VPS 云端层通过 Git 仓库同步数据，无需网络端口：

```
插件层写入 → .omc/nexus/events/{sessionId}-{timestamp}.json
           → git commit + push → nexus-daemon 仓库

VPS 每分钟 git pull → 读取新 events → 处理
VPS 生成改进 → 写入 improvements/{id}.json
             → git commit + push → 插件层 git pull 拉取
```

**优点：**

* 无需网络端口，无需 API 服务器

* 天然版本控制，可回溯所有数据

* 离线时数据不丢失，重连后自动同步

---

## 核心模块详解

### 1. 反馈系统（Phase 2）

收集用户对注入 skill 的有用性评分。

**触发时机：**

* 注入 skill 后的第 2-3 条消息（给用户时间使用 skill）

* 每个 skill 每会话最多请求一次反馈

* 置信度 > 80% 的 skill 才请求反馈（避免噪音）

**反馈类型：**
```typescript
interface FeedbackResponse {
  skillId: string;
  rating: 'helpful' | 'not_helpful' | 'partially_helpful';
  comment?: string;
  timestamp: number;
}
```

**存储：** `.omc/axiom/evolution/skill_feedback.json`

---

### 2. 效果追踪（Phase 2）

无需用户主动反馈，自动检测 skill 是否被采纳。

**检测信号（多信号 AND 逻辑）：**

| 信号类型 | 检测方式 |
| --------- | --------- |
| `code_pattern` | 助手响应中是否出现 skill 建议的代码模式 |
| `keyword_match` | 响应中是否包含 skill 中的关键术语 |
| `problem_solved` | 用户后续消息是否表明问题已解决 |
| `user_confirmed` | 用户明确确认（"谢谢"、"成功了"、"works"） |

**存储：** `.omc/axiom/evolution/skill_adoption.json`

---

### 3. 主动推荐引擎（Phase 2）

在合适时机主动建议用户保存新 skill。

**推荐触发条件（AND 逻辑）：**
1. `auto-learner.ts` 检测到置信度 ≥ 70 的模式
2. 该模式在本会话出现 ≥ 2 次
3. 距上次推荐 ≥ 10 条消息（冷却）
4. 本会话推荐次数 < 3（避免打扰）

**用户响应解析：**

* `save` / `yes` → 保存推荐的 skill

* `skip` / `no` → 跳过，记录反馈

* `edit` → 用户编辑后保存

**存储：** `.omc/axiom/evolution/recommendations.json`

---

### 4. 质量迭代（Phase 2）

基于反馈和采纳数据自动改进 skill 内容。

**改进策略：**

| 类型 | 触发条件 | 操作 |
| ------ | --------- | ------ |
| `trigger_update` | 触发词命中率低 | 添加/删除触发词 |
| `content_refinement` | 采纳率低 | 突出最有效的部分 |
| `example_update` | 示例过时 | 用实际使用案例替换 |

**安全策略：** 默认关闭自动改进（`autoImproveEnabled: false`），需用户确认。

---

### 5. Consciousness Loop（Nexus VPS）

VPS 上持续运行的后台思考进程。

* **频率：** 每 5 分钟一轮

* **预算上限：** 总预算的 10%

* **行为：**
  - 读取最近会话数据 + knowledge_base
  - 生成"当前状态感知"和"改进想法"
  - 写入 `consciousness/scratchpad.md`
  - 暂停条件：有任务正在执行时暂停（避免干扰）

---

### 6. Self-Modifier（Nexus VPS）

基于进化引擎的建议自动修改代码。

**操作范围（分级）：**

| 目标文件 | 置信度要求 | 操作方式 |
| --------- | --------- | --------- |
| `skills/*.md`、`agents/*.md` | ≥ 70 | 自动 PR |
| `src/hooks/*.ts` | ≥ 85 | 自动 PR |
| `src/hooks/*.ts` | < 85 | Telegram 确认后执行 |

**安全门禁：** `tsc --noEmit && npm test` 必须通过才能提交。

**审批流程：**
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

### 7. Self-Evaluator（Nexus VPS）

分析 skill 使用数据，生成健康报告。

**分析内容：**

* Skill 使用频率和触发成功率

* 检测"僵尸 skill"（从未被触发）

* Agent 调用模式分析

**输出：** 健康报告 → 推送 Telegram（每日一次）

---

## 数据存储结构

### 插件层（本地）

```
.omc/nexus/
├── events/                           # 会话事件（git push 到 VPS）
│   └── {sessionId}-{timestamp}.json  # 每次会话的数据包
├── improvements/                     # VPS 生成的改进（git pull 拉取）
│   └── {id}-{timestamp}.json         # 待审批或已应用的改进
└── config.json                       # nexus 配置

.omc/axiom/evolution/
├── usage_metrics.json          # Phase 1 已有，扩展采纳数据
├── skill_feedback.json         # 用户反馈记录（Phase 2 新增）
├── skill_adoption.json         # 采纳检测结果（Phase 2 新增）
├── recommendations.json        # 推荐历史（Phase 2 新增）
└── improvement_queue.json      # 待处理改进建议（Phase 2 新增）
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

### 改进建议数据格式

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

## 配置参考

### Phase 2 主动学习配置

编辑 `~/.claude/.omc-config.json`：

```json
{
  "learner": {
    "enabled": true,
    "phase2": {
      "feedbackEnabled": true,
      "feedbackCooldownMessages": 3,
      "recommendationEnabled": true,
      "recommendationCooldownMessages": 10,
      "maxRecommendationsPerSession": 3,
      "autoImproveEnabled": false,
      "adoptionDetectionEnabled": true
    }
  }
}
```

### Nexus 双层架构配置

编辑 `.omc/nexus/config.json`：

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

> **安全提示：** `config.json` 已加入 `.gitignore`，不会提交到仓库。

---

## Skills 使用指南

### `/ultrapower:nexus` — Nexus 管理入口

```
用途: Nexus 系统的统一管理入口
子命令:
  /ultrapower:nexus status   # 查看 Nexus 系统状态
  /ultrapower:nexus evolve   # 手动触发进化
  /ultrapower:nexus review   # 查看待审批的改进建议
```

### `/ultrapower:learner` — 学习系统管理

```
用途: 查看和管理 Phase 1/2 学习系统状态
功能:
  - 显示已学习的 skill 列表
  - 查看推荐待保存的 skill
  - 手动触发跨会话聚合
```

---

## 部署指南

### 插件层（Phase 2）

Phase 2 模块随 ultrapower 插件自动安装，无需额外配置。

通过配置文件启用：

```json
{
  "learner": {
    "phase2": {
      "feedbackEnabled": true,
      "recommendationEnabled": true
    }
  }
}
```

### VPS 云端层（Nexus Daemon）

```bash

# 1. 克隆 nexus-daemon 仓库

git clone git@github.com:user/nexus-daemon.git
cd nexus-daemon

# 2. 安装依赖

pip install -r requirements.txt

# 3. 配置环境变量

cp .env.example .env

# 编辑 .env 填入 OpenRouter API key 和 Telegram token

# 4. 启动守护进程

systemctl enable nexus-daemon
systemctl start nexus-daemon

# 5. 验证运行状态

systemctl status nexus-daemon
```

**技术栈：**

| 层 | 技术 | 理由 |
| --- | --- | --- |
| 插件层 | TypeScript | 与现有 ultrapower 一致 |
| VPS 守护进程 | Python 3.11 | asyncio 支持后台循环 |
| LLM 调用 | OpenRouter API | 多模型支持，成本优化 |
| 通信 | Git 同步 | 无需端口，天然版本控制 |
| 通知 | Telegram Bot | 支持远程指令 |
| 进程管理 | systemd | VPS 守护进程标准方案 |

---

## 风险与约束

### Phase 2 主动学习

| 风险 | 影响 | 缓解策略 |
| ------ | ------ | --------- |
| 反馈请求打扰用户 | 高 | 严格冷却时间 + 每会话上限 3 次 |
| 采纳检测误报 | 中 | 多信号 AND 逻辑，高置信度阈值 |
| 自动改进破坏 skill | 高 | 默认关闭自动改进，需用户确认 |
| 存储文件过大 | 低 | 定期清理 + 条目上限 |
| Hook 性能影响 | 中 | 异步处理，3s 超时保护 |

### Nexus 双层架构

| 风险 | 影响 | 缓解策略 |
| ------ | ------ | --------- |
| 代码自动修改破坏插件 | 高 | 强制 tsc + npm test 门禁；置信度分级 |
| 意识循环成本失控 | 中 | 10% 预算硬上限；每轮成本追踪 |
| Git 同步冲突 | 低 | events/ 和 improvements/ 目录分离；文件名含时间戳 |
| VPS 宕机导致数据丢失 | 低 | 插件层本地缓存；Git 历史可回溯 |
| Telegram token 泄露 | 中 | 存储在 .omc/nexus/config.json（gitignore） |

---

## 实现路线图

### Phase 2 优先级

| 优先级 | 任务 | 状态 |
| -------- | ------ | ------ |
| P0 | 反馈收集（`feedback/collector.ts` + `storage.ts`） | 📋 待实现 |
| P0 | 主动推荐引擎（`recommender/engine.ts` + `timing.ts`） | 📋 待实现 |
| P0 | Hook 集成（扩展 `skill-injector.mjs`，新增 `skill-feedback.mjs`） | 📋 待实现 |
| P1 | 采纳检测（`effectiveness/adoption-detector.ts`） | 📋 待实现 |
| P1 | 触发词优化（`quality/improver.ts`） | 📋 待实现 |
| P2 | 跨会话聚合（`quality/aggregator.ts`） | 📋 待实现 |
| P2 | 效果仪表盘（`/ultrapower:learner` skill 扩展） | 📋 待实现 |

### Nexus 优先级

| 优先级 | 任务 | 状态 |
| -------- | ------ | ------ |
| P0 | data-collector hook | 📋 待实现 |
| P0 | consciousness-sync hook | 📋 待实现 |
| P0 | nexus-daemon 基础框架 | 📋 待实现 |
| P0 | Evolution Engine MVP | 📋 待实现 |
| P1 | Consciousness Loop | 📋 待实现 |
| P1 | Self-Modifier MVP（skill 文档级） | 📋 待实现 |
| P1 | Telegram Bot | 📋 待实现 |
| P1 | improvement-puller hook | 📋 待实现 |
| P2 | Self-Evaluator | 📋 待实现 |
| P2 | Self-Modifier 进阶（TypeScript 代码级） | 📋 待实现 |

---

## 相关文档

* [EVOLUTION.md](./EVOLUTION.md) — Axiom 自我进化系统（Phase 1 基础）

* [REFERENCE.md](./REFERENCE.md) — 完整 API 参考

* [ARCHITECTURE.md](./ARCHITECTURE.md) — 系统架构设计

* [INSTALL.md](./INSTALL.md) — 安装部署指南
