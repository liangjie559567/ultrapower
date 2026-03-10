# 任务清单: Hook 系统安全加固 v6.0.0

## 元信息

- **Feature ID:** hook-security-v6
- **总工作量:** 7 天
- **总代码量:** 380 行实现 + 500 行测试
- **优先级:** P0 (D-05), P1 (D-06, D-07)
- **基于 PRD:** `.omc/axiom/rough_prd.md`

---

## 任务列表

### Phase 1: 基础设施 (Day 1)

#### T-001: 实现原子写入工具函数

- **路径:** `docs/tasks/hook-security-v6/sub_prds/T-001-atomic-write.md`
- **描述:** 创建 `src/lib/atomic-write.ts`，实现 `atomicWriteJsonSync()` 函数
- **依赖:** None
- **工作量:** 2 小时
- **修改文件:**
  - 新增: `src/lib/atomic-write.ts` (50 行)
  - 新增: `tests/lib/atomic-write.test.ts` (100 行)
- **验收标准:**
  - [ ] 使用 `fs.writeFileSync(tmpPath) + fs.renameSync()` 模式
  - [ ] 支持重试机制 (3 次，指数退避)
  - [ ] 并发测试 10+ 进程无文件损坏

---

#### T-002: 定义 15 类 HookType 白名单映射表

- **路径:** `docs/tasks/hook-security-v6/sub_prds/T-002-whitelist-table.md`
- **描述:** 在 `src/hooks/bridge-normalize.ts` 定义 `STRICT_WHITELIST` 常量
- **依赖:** None
- **工作量:** 1 小时
- **修改文件:**
  - 修改: `src/hooks/bridge-normalize.ts` (+30 行)
- **验收标准:**
  - [ ] 覆盖全部 15 类 HookType
  - [ ] 每类至少定义 2 个字段
  - [ ] 通过 CI 门禁验证脚本

---

### Phase 2: 核心实现 (Day 2-4)

#### T-003: D-07 实现 - subagent-tracker 原子写入

- **路径:** `docs/tasks/hook-security-v6/sub_prds/T-003-d07-impl.md`
- **描述:** 替换 `src/hooks/subagent-tracker/index.ts` 中的 `fs.writeFileSync`
- **依赖:** T-001
- **工作量:** 1 小时
- **修改文件:**
  - 修改: `src/hooks/subagent-tracker/index.ts` (20 行)
- **验收标准:**
  - [ ] 所有写入操作使用 `atomicWriteJsonSync()`
  - [ ] 现有测试全部通过
  - [ ] 并发测试无文件损坏

---

#### T-004: D-06 实现 - 白名单验证逻辑

- **路径:** `docs/tasks/hook-security-v6/sub_prds/T-004-d06-impl.md`
- **描述:** 实现 `normalizeHookInput()` 函数，过滤未知字段
- **依赖:** T-002
- **工作量:** 3 小时
- **修改文件:**
  - 修改: `src/hooks/bridge-normalize.ts` (+120 行)
  - 新增: `tests/hooks/bridge-normalize.test.ts` (200 行)
- **验收标准:**
  - [ ] 未知字段被过滤
  - [ ] 记录安全日志
  - [ ] 单元测试覆盖率 > 90%

---

#### T-005: D-05 实现 - permission-request 强制阻塞

- **路径:** `docs/tasks/hook-security-v6/sub_prds/T-005-d05-impl.md`
- **描述:** 修改 `createHookOutput()` 函数，实现失败优先逻辑
- **依赖:** T-004
- **工作量:** 3 小时
- **修改文件:**
  - 修改: `src/hooks/persistent-mode/index.ts` (+80 行)
  - 新增: `tests/hooks/permission-request.test.ts` (150 行)
- **验收标准:**
  - [ ] `result.success !== true` 时阻塞
  - [ ] 返回 `BlockedHookOutput` 结构
  - [ ] 边界情况测试全部通过 (null/undefined/false)

---

#### T-006: D-05 补充 - 错误反馈机制

- **路径:** `docs/tasks/hook-security-v6/sub_prds/T-006-error-feedback.md`
- **描述:** 实现中文错误消息和恢复指引
- **依赖:** T-005
- **工作量:** 2 小时
- **修改文件:**
  - 修改: `src/hooks/persistent-mode/index.ts` (+20 行)
- **验收标准:**
  - [ ] 错误消息使用中文
  - [ ] 包含 `userAction` 恢复指引
  - [ ] 开发者模式下显示 `technicalDetails`

---

### Phase 3: 监控与日志 (Day 5)

#### T-007: 实现安全审计日志

- **路径:** `docs/tasks/hook-security-v6/sub_prds/T-007-audit-log.md`
- **描述:** 创建 `src/lib/logger.ts`，记录阻塞和过滤事件
- **依赖:** T-005, T-006
- **工作量:** 4 小时
- **修改文件:**
  - 新增: `src/lib/logger.ts` (80 行)
  - 新增: `tests/lib/logger.test.ts` (50 行)
- **验收标准:**
  - [ ] 日志格式为 JSONL
  - [ ] 敏感字段自动脱敏
  - [ ] 日志轮转策略 (10MB/7天)
  - [ ] 记录所有 `logger.security()` 调用

---

### Phase 4: 测试验证 (Day 6)

#### T-008: 单元测试补充

- **路径:** `docs/tasks/hook-security-v6/sub_prds/T-008-unit-tests.md`
- **描述:** 补充 D-05/D-06/D-07 的边界情况测试
- **依赖:** T-003, T-004, T-005, T-006, T-007
- **工作量:** 3 小时
- **验收标准:**
  - [ ] 测试覆盖率 > 90%
  - [ ] 覆盖 PRD 中所有边界情况
  - [ ] 所有测试通过

---

#### T-009: 集成测试

- **路径:** `docs/tasks/hook-security-v6/sub_prds/T-009-integration-tests.md`
- **描述:** 端到端测试 hook 执行流程
- **依赖:** T-008
- **工作量:** 3 小时
- **验收标准:**
  - [ ] 回归测试通过率 > 95%
  - [ ] 模拟真实 hook 场景
  - [ ] 验证审计日志完整性

---

#### T-010: 性能基准测试

- **路径:** `docs/tasks/hook-security-v6/sub_prds/T-010-perf-tests.md`
- **描述:** 验证 D-07 原子写入性能
- **依赖:** T-009
- **工作量:** 2 小时
- **验收标准:**
  - [ ] D-07 延迟 < 10ms (p99)
  - [ ] 高频写入 (>100/s) 无性能退化
  - [ ] 生成性能报告

---

### Phase 5: 文档交付 (Day 7)

#### T-011: 文档更新和迁移指南

- **路径:** `docs/tasks/hook-security-v6/sub_prds/T-011-docs.md`
- **描述:** 更新规范文档和创建迁移指南
- **依赖:** T-010
- **工作量:** 4 小时
- **修改文件:**
  - 更新: `docs/standards/runtime-protection.md`
  - 更新: `docs/standards/hook-execution-order.md`
  - 新增: `docs/migration/v6.0.0.md`
  - 更新: `CHANGELOG.md`
- **验收标准:**
  - [ ] 迁移指南包含 BREAKING CHANGE 说明
  - [ ] 补充白名单维护流程
  - [ ] 补充审计日志配置说明
  - [ ] CHANGELOG 标注安全修复

---

## 任务依赖矩阵

| 任务 | 依赖 | 可并行任务 |
|------|------|-----------|
| T-001 | - | T-002 |
| T-002 | - | T-001 |
| T-003 | T-001 | T-004 |
| T-004 | T-002 | T-003 |
| T-005 | T-004 | T-006 |
| T-006 | T-005 | - |
| T-007 | T-005, T-006 | - |
| T-008 | T-003, T-004, T-005, T-006, T-007 | - |
| T-009 | T-008 | - |
| T-010 | T-009 | - |
| T-011 | T-010 | - |

---

## 关键指标

### 代码量统计

| 类型 | 行数 |
|------|------|
| 实现代码 | 380 |
| 测试代码 | 500 |
| 总计 | 880 |

### 测试覆盖目标

- 单元测试覆盖率: > 90%
- 集成测试通过率: > 95%
- 性能测试: D-07 延迟 < 10ms (p99)

### 合规性目标

- OWASP ASVS 4.0: 100% 符合
- CWE Top 25: 零已知漏洞
- 审计日志完整性: 100%

---

## 下一步

执行 `/ax-implement` 开始实施流水线。
