# Critic Review: Draft PRD — Agent 可观测性平台

## 1. Security Audit (安全审计 - **Fail**)

- **[P0 - CRITICAL] 路径遍历风险**：`.omc/observability.db` 的路径拼接若依赖外部传入的 `worktree` 参数，必须经过 `assertValidMode()` 或等效的路径白名单校验。PRD 未提及任何路径消毒机制。攻击者可通过构造 `../../etc/passwd` 形式的路径读写任意文件。

- **[P0 - CRITICAL] .db 文件未在 .gitignore 中排除**：当前 `.gitignore` 仅排除了 `.omc/state/`、`.omc/logs/`、`.omc/prompts/`，**未覆盖 `.omc/*.db`**。`observability.db` 极可能被意外 `git add` 提交，导致：
  - agent 运行历史、token 消耗、工具调用序列等敏感运营数据泄露到版本库
  - 二进制 SQLite 文件污染 git 历史，无法 diff，难以清除

- **[P1] 无访问控制**：SQLite 文件权限未定义。多用户共享机器场景下，其他用户可直接读取 `.omc/observability.db`，获取完整的 agent 执行历史和 cost 数据。

- **[P1] cost_records 表的数据敏感性**：token 消耗 + 时间戳 + agent 类型的组合，可反推用户的工作模式和业务内容，属于需要保护的运营元数据。PRD 未定义数据保留策略（retention policy）。

---

## 2. Edge Case Analysis (边缘场景分析)

- **[P0] 多 worktree 并发写入**：`better-sqlite3` 是同步 API，但 SQLite 的 WAL 模式下多进程并发写入仍会产生 `SQLITE_BUSY` 错误。PRD 未说明：
  - 是否启用 WAL 模式（默认 journal 模式并发性极差）
  - 写入失败时的重试策略
  - 同一 repo 的两个 worktree 同时运行 agent 时，它们是共享同一个 `.db` 还是各自独立？路径 `.omc/observability.db` 在 worktree 中是相对路径，**每个 worktree 会有独立的 `.omc/` 目录**，数据天然隔离——但这意味着跨 worktree 的聚合查询无法实现，与"可观测性平台"的定位矛盾。

- **[P0] token 估算降级策略缺失**：PRD 声称记录 cost，但 Claude API 的真实 token 数只在响应头中返回，agent 内部无法直接获取。PRD 未定义：
  - 降级方案（如字符数 / 4 的粗估）
  - 估算值与真实值的误差范围（实测可达 ±30%）
  - `cost_records` 表是否区分 `estimated` vs `actual` 字段，防止误导性数据

- **[P1] 数据库文件损坏场景**：agent 进程被 SIGKILL 中断时，SQLite 写入可能产生损坏的 `.db` 文件。`better-sqlite3` 同步 API 在进程崩溃时无法保证事务完整性。PRD 未定义损坏检测和自动修复（`PRAGMA integrity_check`）流程。

- **[P1] 磁盘空间无上限**：长期运行的项目中，`tool_calls` 表会无限增长。PRD 未定义：
  - 自动清理策略（如保留最近 N 天）
  - 文件大小告警阈值

- **[P2] 表结构迁移**：PRD 定义了 3 张表的初始结构，但未说明 schema 版本管理机制。未来字段变更时，已有用户的 `.db` 文件如何迁移？

---

## 3. Logical Consistency (逻辑一致性)

- **[P0] worktree 隔离 vs 平台定位矛盾**：PRD 将其定位为"可观测性**平台**"，暗示跨 agent、跨会话的聚合视图。但将 `.db` 放在 worktree 根目录下，数据天然按 worktree 分片，无法实现跨 worktree 的统一查询。正确的架构应选择其一：
  - 选项 A：集中存储（`~/.claude/observability.db`），支持全局聚合，但引入跨进程并发问题
  - 选项 B：分散存储（per-worktree），放弃跨 worktree 聚合，定位降级为"本地运行日志"

- **[P1] 测试 mock 策略未定义**：PRD 要求 ≥15 个测试用例，但未说明如何隔离测试环境。`better-sqlite3` 同步 API 的常见 mock 方案有两种，各有取舍：
  - 方案 A：使用 `:memory:` 数据库（`new Database(':memory:')`）——无需 mock，但无法测试文件路径相关逻辑
  - 方案 B：`jest.mock('better-sqlite3')`——可测试路径逻辑，但 mock 维护成本高，且容易与真实 API 行为脱节
  PRD 未选择，导致测试策略不明确，15 个用例的质量无法保证。

- **[P2] `agent_runs` 与 `tool_calls` 的关联完整性**：PRD 未定义外键约束。若 `agent_runs` 记录被删除，对应的 `tool_calls` 是否级联删除？SQLite 默认不启用外键（需 `PRAGMA foreign_keys = ON`），PRD 未提及。

- **[P2] `tsc 0 errors` 验收标准过弱**：类型检查通过不等于运行时正确。`better-sqlite3` 的 TypeScript 类型定义（`@types/better-sqlite3`）对 `prepare().run()` 的返回值类型较宽松，类型检查无法捕获 SQL 语句错误或字段名拼写错误。

---

## Conclusion (结论)

**判定：Reject**

**严重阻碍 (Major Blockers)：**

1. `.omc/*.db` 未加入 `.gitignore`，敏感运营数据面临版本库泄露风险（P0 安全）
2. 多 worktree 并发写入无保护机制，`SQLITE_BUSY` 会导致数据丢失（P0 可靠性）
3. worktree 分散存储与"可观测性平台"的跨会话聚合定位根本矛盾，架构方向未决（P0 逻辑）
4. token 估算降级策略缺失，`cost_records` 数据可信度无法保证（P0 数据质量）

**建议在进入实现前明确：**
- 存储位置：集中（`~/.claude/`）还是分散（per-worktree）
- `.gitignore` 补充 `.omc/*.db`
- WAL 模式 + 写入重试策略
- token 估算字段区分 `estimated` / `actual`
