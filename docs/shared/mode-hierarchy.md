# 执行模式层级

本文档定义了执行模式之间的关系，并提供模式选择指南。

## 模式继承树

```
autopilot（自主端到端）
├── 包含：ralph（持久化）
│   └── 包含：ultrawork（并行化）
├── 包含：ultraqa（QA 循环）
└── 包含：plan（战略思考）

ultrapilot（并行 autopilot）
├── 包含：文件所有权分区
├── 包含：worker 协调（最多 20 个 worker）
└── 回退到：autopilot（如果不可并行化）

swarm（N-agent 协调）
├── 包含：SQLite 任务认领
├── 包含：心跳监控
└── 与 autopilot/ultrapilot 正交（不同范式）

 （仅 token 效率）
└── 修改：agent 层级选择（优先 haiku/sonnet）
    （不包含持久化——那是 ralph 的职责）

ralph（持久化包装器）
└── 包含：ultrawork（并行化引擎）
    （新增：循环直到完成 + architect 验证）

ultrawork（并行化引擎）
└── 仅作为组件——并行 agent 生成
    （无持久化，无验证循环）
```

## 模式关系

| 模式 | 类型 | 包含 | 互斥 |
|------|------|----------|------------------------|
| autopilot | 独立模式 | ralph、ultraqa、plan | ultrapilot |
| ultrapilot | 独立模式 | 文件所有权、workers | autopilot |
| swarm | 独立模式 | SQLite 认领 | - |
| ralph | 包装器 | ultrawork | - |
| ultrawork | 组件 | - | - |
|  | 修饰符 | - | - |
| ultraqa | 组件 | - | - |

## 决策树

```
想要自主执行？
├── 是：任务是否可拆分为 3 个以上独立组件？
│   ├── 是：ultrapilot（带文件所有权的并行 autopilot）
│   └── 否：autopilot（带 ralph 阶段的顺序执行）
└── 否：想要并行执行并保持手动监督？
    ├── 是：是否需要成本优化？
    │   ├── 是： + ultrawork
    │   └── 否：单独使用 ultrawork
    └── 否：需要持久化直到验证完成？
        ├── 是：ralph（持久化 + ultrawork + 验证）
        └── 否：标准编排（直接委派给 agent）

有许多类似的独立任务（如"修复 47 个错误"）？
└── 是：swarm（N 个 agent 从任务池中认领）
```

## 模式差异矩阵

| 模式 | 最适合 | 并行化 | 持久化 | 验证 | 文件所有权 |
|------|----------|-------------|-------------|--------------|----------------|
| autopilot | "帮我构建 X" | 通过 ralph | 是 | 是 | 不适用 |
| ultrapilot | 多组件 | 20 个 worker | 是 | 是 | 分区 |
| swarm | 同质任务 | N 个 worker | 按任务 | 按任务 | 按任务 |
| ralph | "不要停" | 通过 ultrawork | 是 | 强制 | 不适用 |
| ultrawork | 仅并行 | 是 | 否 | 否 | 不适用 |
|  | 节省成本 | 修饰符 | 否 | 否 | 不适用 |

## 快速参考

**只想构建某个东西？** → `autopilot`
**构建多组件系统？** → `ultrapilot`
**修复许多类似问题？** → `swarm`
**想控制执行过程？** → `ultrawork`
**需要验证完成？** → `ralph`
**想节省 token？** → ``（与其他模式组合使用）

## 组合模式

有效组合：
- `eco ralph` = 使用更便宜 agent 的 ralph 循环
- `eco ultrawork` = 使用更便宜 agent 的并行执行
- `eco autopilot` = 带成本优化的完整自主执行

无效组合：
- `autopilot ultrapilot` = 互斥（两者都是独立模式）
- `` 单独使用 = 无意义（需要一个执行模式）

## 状态管理

### 标准路径
所有模式状态文件使用标准化位置：
- 主路径：`.omc/state/{name}.json`（本地，按项目）
- 全局备份：`~/.omc/state/{name}.json`（全局，session 连续性）

### 模式状态文件
| 模式 | 状态文件 |
|------|-----------|
| ralph | `ralph-state.json` |
| autopilot | `autopilot-state.json` |
| ultrapilot | `ultrapilot-state.json` |
| ultrawork | `ultrawork-state.json` |
|  | `-state.json` |
| ultraqa | `ultraqa-state.json` |
| pipeline | `pipeline-state.json` |
| swarm | `swarm-summary.json` + `swarm-active.marker` |

**重要：** 永远不要将 OMC 状态存储在 `~/.claude/` 中——该目录保留给 Claude Code 本身使用。

旧版位置在读取时自动迁移。
