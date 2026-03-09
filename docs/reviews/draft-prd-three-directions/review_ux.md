# UX Review: Draft PRD 三方向评审

## 方向一 UX 评分：7/10

### 流程分析

**F1 Pattern Promotion Pipeline（自动模式晋升）**

* 用户心智模型匹配度高——"模式被自动提升"符合进化引擎的核心隐喻。

* 风险：晋升是静默发生的，用户不知道"什么被提升了、为什么"。缺乏可见的确认节点。

* 建议：晋升时输出一行摘要 `[axiom] pattern promoted: "error-retry-pattern" (confidence: 87%)`，让用户感知系统在学习。

**F2 跨项目知识迁移（ax-export/ax-import）**

* 命令命名直觉化，符合 CLI 惯例。

* 问题：`ax-import` 时若目标项目已有同名 pattern，冲突解决策略不明确。用户会困惑"是覆盖还是合并？"

* 建议：冲突时显示 diff 并询问 `[merge/skip/overwrite]`，不要静默覆盖。

**F3 进化触发自动化（PostToolUse hook + 阈值触发）**

* 对高级用户透明，但对新用户完全不可见——他们不知道后台在做什么。

* 建议：在 `ax-status` 中增加"上次自动触发时间"字段，让用户感知系统活跃度。

**F4 Axiom Dashboard（ax-status 增强）**

* 知识库增长曲线、队列健康度是有价值的信息，但 CLI 环境下"曲线"的呈现方式需要明确。

* 建议：使用 sparkline 字符图（`▁▂▄▆█`）而非依赖外部渲染，保持 CLI 原生体验。

---

## 方向二 UX 评分：6/10

### 流程分析

**F1 结构化 Trace/Span 追踪**

* 概念来自 OpenTelemetry，对熟悉分布式系统的用户直觉化，但对普通 CLI 用户是认知负担。

* `traceId/spanId` 这类术语在 CLI 输出中直接暴露会造成信息噪音。

* 建议：日常输出隐藏 ID，仅在 `--verbose` 或 `--trace` 模式下展示原始 span 数据。

**F2 Token 成本聚合**

* 这是用户最关心的功能之一，心智模型匹配度极高（"我花了多少钱"）。

* 问题：按 agent/skill/会话 三个维度同时展示会造成信息过载。

* 建议：默认展示会话级汇总，`--by agent` / `--by skill` 作为可选过滤参数。

**F3 跨会话性能趋势（SQLite）**

* `trace_summary --since 7d` 命令设计合理，符合 CLI 惯例。

* 风险：SQLite 文件对用户是黑盒，出问题时（损坏/锁定）用户无法自救。

* 建议：提供 `omc traces reset` 命令，并在 `omc-doctor` 中加入 SQLite 健康检查。

**F4 告警与阈值**

* token 预算告警的触发时机不明确——是每次调用后检查，还是会话结束时？

* 实时告警在 CLI 流式输出中会打断用户阅读，体验差。

* 建议：告警以非阻塞方式在输出末尾追加 `[warn] token budget 80% used`，不中断主流程。

---

## 方向三 UX 评分：8/10

### 流程分析

**F1 Plugin Marketplace（omc plugin search/info/list）**

* 命令设计最符合用户心智模型，与 `npm`/`brew` 等工具高度一致，学习曲线极低。

* 建议：`omc plugin search <keyword>` 结果需要包含"已安装"标记，避免用户重复安装。

**F2 依赖自动解析（拓扑排序）**

* 对用户完全透明（后台处理），体验好。

* 风险：依赖冲突时的错误信息若只输出技术细节（"circular dependency detected"），用户不知道如何解决。

* 建议：错误信息附带具体的冲突链路和建议操作，例如 `plugin-a requires plugin-b@^1.0, but plugin-c requires plugin-b@^2.0 → try: omc plugin install plugin-b@1.x`。

**F3 沙箱安全验证（checksum + 危险模式扫描）**

* 安全验证流程对用户体验影响最大——如果每次安装都有明显延迟，用户会感到不耐烦。

* 建议：验证过程显示进度指示 `verifying... [checksum OK] [pattern scan OK]`，让用户知道系统在保护他们，而非卡住了。

**F4 版本回滚（backup + rollback）**

* `omc plugin rollback <name>` 命令直觉化。

* 问题：用户不知道有哪些版本可以回滚到。

* 建议：`omc plugin rollback <name>` 不带版本号时，列出可用备份版本供选择，而非报错。

---

## 关键 UX 差异点

* [D-UX-01] HIGH: 方向一 F1 模式晋升静默发生，用户无感知 → 晋升时输出单行摘要通知，并在 ax-status 中记录最近晋升历史

* [D-UX-02] HIGH: 方向二 F1 traceId/spanId 在日常输出中暴露，造成信息噪音 → 默认隐藏，仅 --verbose 模式展示

* [D-UX-03] HIGH: 方向二 F4 实时告警打断 CLI 流式输出 → 改为非阻塞尾部追加，不中断主流程

* [D-UX-04] MEDIUM: 方向一 F2 ax-import 冲突策略不明确 → 冲突时展示 diff 并提供 merge/skip/overwrite 选项

* [D-UX-05] MEDIUM: 方向二 F2 三维度同时展示造成信息过载 → 默认会话级汇总，维度切换用参数控制

* [D-UX-06] MEDIUM: 方向三 F2 依赖冲突错误信息技术化 → 附带冲突链路和可执行的解决建议

* [D-UX-07] MEDIUM: 方向三 F4 rollback 不带版本号时报错 → 改为列出可用备份版本的交互式选择

* [D-UX-08] LOW: 方向一 F4 CLI 环境下"增长曲线"渲染方式未定义 → 使用 sparkline 字符图保持 CLI 原生体验

* [D-UX-09] LOW: 方向二 F3 SQLite 损坏时用户无法自救 → 在 omc-doctor 加入健康检查，提供 omc traces reset 命令

* [D-UX-10] LOW: 方向三 F1 搜索结果缺少"已安装"标记 → 已安装插件在列表中显示 [installed] 标记
