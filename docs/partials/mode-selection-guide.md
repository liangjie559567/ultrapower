# 模式选择指南

## 快速决策

| 如果你想… | 使用 | 关键词 |
|----------------|----------|---------|
| 从想法开始完全自主构建 | `autopilot` | "autopilot"、"build me"、"I want a" |
| 并行自主执行（快 3-5 倍） | `ultrapilot` | "ultrapilot"、"parallel build" |
| 持久化直到验证完成 | `ralph` | "ralph"、"don't stop" |
| 并行执行，手动监督 | `ultrawork` | "ulw"、"ultrawork" |
| 成本高效执行 | ``（修饰符） | "eco"、"budget" |
| 许多类似的独立任务 | `swarm` | "swarm N agents" |

## 如果你不确定

**从 `autopilot` 开始** - 它能处理大多数场景，并自动过渡到其他模式。

## 详细决策流程图

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

## 示例

| 用户请求 | 最佳模式 | 原因 |
|--------------|-----------|-----|
| "Build me a REST API" | autopilot | 单一连贯的交付物 |
| "Build frontend, backend, and database" | ultrapilot | 清晰的组件边界 |
| "Fix all 47 TypeScript errors" | swarm | 许多独立的类似任务 |
| "Refactor auth module thoroughly" | ralph | 需要持久化 + 验证 |
| "Quick parallel execution" | ultrawork | 偏好手动监督 |
| "Save tokens while fixing errors" |  + ultrawork | 注重成本的并行执行 |
| "Don't stop until done" | ralph | 检测到持久化关键词 |

## 模式类型

### 独立模式
这些模式独立运行：
- **autopilot**：自主端到端执行
- **ultrapilot**：带文件所有权的并行自主执行
- **swarm**：带任务池的 N-agent 协调

### 包装器模式
这些模式包装其他模式：
- **ralph**：在 ultrawork 外层添加持久化 + 验证

### 组件模式
这些模式被其他模式使用：
- **ultrawork**：并行执行引擎（被 ralph、autopilot 使用）

### 修饰符模式
这些模式修改其他模式的行为：
- ****：将模型路由改为优先使用更便宜的层级

## 有效组合

| 组合 | 效果 |
|-------------|--------|
| `eco ralph` | 使用更便宜 agent 的 ralph 持久化 |
| `eco ultrawork` | 使用更便宜 agent 的并行执行 |
| `eco autopilot` | 带成本节省的自主执行 |

## 无效组合

| 组合 | 无效原因 |
|-------------|-------------|
| `autopilot ultrapilot` | 两者都是独立模式——选其一 |
| `` 单独使用 | 需要一个执行模式来修饰 |
