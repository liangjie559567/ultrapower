# Manifest 清单

**基于**: Rough PRD v1.0 + Architecture + Task DAG
**生成时间**: 2026-03-15T03:49:00Z
**总任务数**: 20

---

## T0: 创建审计日志模块

**优先级**: P0
**依赖**: 无
**预计工时**: 0.5 人天

**目标**: 实现统一的安全审计日志机制

**交付物**:
- `src/lib/auditLog.ts` - 审计日志实现
- `tests/lib/auditLog.test.ts` - 单元测试

**验收标准**:
- ✅ 支持 4 种事件类型（validation_failed, prototype_pollution_attempt, redos_detected, unauthorized_field）
- ✅ 日志写入 `.omc/audit.log`
- ✅ 包含时间戳、事件类型、严重性、详情
- ✅ 单元测试覆盖率 100%

**Impact Scope**:
- 新增文件: `src/lib/auditLog.ts`
- 新增文件: `tests/lib/auditLog.test.ts`

---

## T1: BUG-002 修复（Hook 输入验证绕过）

**优先级**: P0
**依赖**: T0
**预计工时**: 1.5 人天

**目标**: 修复敏感 hook 的验证绕过漏洞

**交付物**:
- 修改 `src/hooks/bridge-normalize.ts`
- 添加原型污染防护
- 集成审计日志

**验收标准**:
- ✅ 敏感 hook 强制完整验证
- ✅ 原型污染防护生效（拒绝 __proto__, constructor, prototype）
- ✅ 审计日志记录所有可疑输入
- ✅ 白名单过滤生效

**Impact Scope**:
- 修改文件: `src/hooks/bridge-normalize.ts`

---

## T2: BUG-001 修复（状态文件竞态条件）

**优先级**: P0
**依赖**: T0
**预计工时**: 2 人天

**目标**: 实现原子写入 + 写入队列，解决并发写入问题

**交付物**:
- 修改 `src/state/index.ts`
- 实现 writeQueue 和 atomicWrite
- 添加异常处理

**验收标准**:
- ✅ 1000+ 并发写入无数据损坏
- ✅ 磁盘满/权限不足场景正确处理
- ✅ 写入延迟 < 10ms
- ✅ 临时文件自动清理

**Impact Scope**:
- 修改文件: `src/state/index.ts`

---

## T3: BUG-003 修复（ReDoS）

**优先级**: P1
**依赖**: T0
**预计工时**: 0.5 人天

**目标**: 修复正则表达式回溯问题

**交付物**:
- 修改 `src/hooks/keyword-detector/index.ts`
- 实现输入长度限制
- 简化正则表达式

**验收标准**:
- ✅ 处理 10000 字符 < 100ms
- ✅ 嵌套深度 1-10000 测试通过
- ✅ 输入长度限制生效

**Impact Scope**:
- 修改文件: `src/hooks/keyword-detector/index.ts`

---

## T4: BUG-002 单元测试

**优先级**: P0
**依赖**: T1
**预计工时**: 0.5 人天

**目标**: 编写 BUG-002 的单元测试和模糊测试

**交付物**:
- `tests/hooks/bridge-normalize.test.ts`
- 1000+ 恶意输入样本

**验收标准**:
- ✅ 覆盖率 100%
- ✅ 模糊测试无漏洞
- ✅ 原型污染测试通过

**Impact Scope**:
- 新增文件: `tests/hooks/bridge-normalize.test.ts`

---

## T5: BUG-001 单元测试

**优先级**: P0
**依赖**: T2
**预计工时**: 0.5 人天

**目标**: 编写 BUG-001 的并发测试

**交付物**:
- `tests/state/index.test.ts`

**验收标准**:
- ✅ 并发写入测试通过
- ✅ 异常场景测试通过
- ✅ 性能基准测试通过

**Impact Scope**:
- 新增文件: `tests/state/index.test.ts`

---

## T6: BUG-003 单元测试

**优先级**: P1
**依赖**: T3
**预计工时**: 0.5 人天

**目标**: 编写 ReDoS 测试套件

**交付物**:
- `tests/hooks/keyword-detector.test.ts`

**验收标准**:
- ✅ ReDoS 测试套件通过
- ✅ 性能基准测试通过

**Impact Scope**:
- 新增文件: `tests/hooks/keyword-detector.test.ts`

---

## T7: 创建用户反馈模块

**优先级**: P0
**依赖**: T2
**预计工时**: 0.5 人天

**目标**: 实现用户反馈机制

**交付物**:
- `src/lib/userFeedback.ts`
- `tests/lib/userFeedback.test.ts`

**验收标准**:
- ✅ 支持进度反馈、错误反馈、冲突提示
- ✅ 单元测试覆盖率 100%

**Impact Scope**:
- 新增文件: `src/lib/userFeedback.ts`
- 新增文件: `tests/lib/userFeedback.test.ts`

---

## T8: BUG-004 修复（状态文件泄漏）

**优先级**: P1
**依赖**: T7
**预计工时**: 0.5 人天

**目标**: 实现状态清理机制

**交付物**:
- 修改 `src/hooks/bridge.ts`
- 添加启动时清理逻辑

**验收标准**:
- ✅ 异常退出后自动清理
- ✅ 启动时清理 24 小时以上陈旧状态

**Impact Scope**:
- 修改文件: `src/hooks/bridge.ts`

---

## T9: BUG-004 单元测试

**优先级**: P1
**依赖**: T8
**预计工时**: 0.5 人天

**目标**: 编写异常恢复测试

**交付物**:
- `tests/hooks/bridge.test.ts`

**验收标准**:
- ✅ 异常退出恢复测试通过
- ✅ 陈旧状态检测测试通过

**Impact Scope**:
- 新增文件: `tests/hooks/bridge.test.ts`

---

## T10: BUG-005 修复（关键词冲突）

**优先级**: P2
**依赖**: T3
**预计工时**: 0.25 人天

**目标**: 实现关键词冲突解决规则表

**交付物**:
- 修改 `src/hooks/keyword-detector/index.ts`

**验收标准**:
- ✅ 所有 2-3 关键词组合测试通过
- ✅ 冲突提示清晰友好

**Impact Scope**:
- 修改文件: `src/hooks/keyword-detector/index.ts`

---

## T11: BUG-005 单元测试

**优先级**: P2
**依赖**: T10
**预计工时**: 0.25 人天

**目标**: 编写冲突解决测试

**交付物**:
- 更新 `tests/hooks/keyword-detector.test.ts`

**验收标准**:
- ✅ 冲突组合测试通过
- ✅ 优先级验证测试通过

**Impact Scope**:
- 修改文件: `tests/hooks/keyword-detector.test.ts`

---


---

## T12: BUG-006 空输入处理

**优先级**: P2
**依赖**: 无
**预计工时**: 0.5 人天

### 目标

修复 `src/hooks/bridge.ts` 中 JSON 解析失败时的静默失败问题。

### 交付物

1. 修改 `parseHookInput()` 函数，添加空输入验证
2. 抛出明确错误信息而非静默失败

### 验收标准

- 空输入（null、undefined、空字符串）抛出 `Error('Hook input is empty')`
- JSON 解析失败抛出 `Error('Invalid JSON input: ...')`
- 错误信息用户友好，不泄露技术细节

### 影响范围

**修改文件**:
- `src/hooks/bridge.ts` - `parseHookInput()` 函数

**新增文件**: 无

---

## T13: BUG-006 单元测试

**优先级**: P2
**依赖**: T12
**预计工时**: 0.5 人天

### 目标

为 BUG-006 修复编写单元测试，覆盖所有边界情况。

### 交付物

1. 空输入测试（null、undefined、空字符串）
2. 类型错误测试（字段存在但类型错误）
3. 超长字段测试

### 验收标准

- 测试覆盖率 100%
- 所有边界情况测试通过
- 测试用例清晰可维护

### 影响范围

**修改文件**: 无

**新增文件**:
- `tests/hooks/bridge-input-validation.test.ts`

---

## T14: P0 级别集成测试

**优先级**: P0
**依赖**: T4, T5
**预计工时**: 0.5 人天

### 目标

编写 BUG-001 和 BUG-002 的端到端集成测试。

### 交付物

1. 多 agent 并发写入端到端测试（BUG-001）
2. 敏感 hook 输入验证端到端测试（BUG-002）
3. 异常场景恢复测试

### 验收标准

- 1000+ 并发写入无数据损坏
- 敏感 hook 强制验证生效
- 异常退出后状态文件完整

### 影响范围

**修改文件**: 无

**新增文件**:
- `tests/integration/concurrent-state-writes.test.ts`
- `tests/integration/hook-input-security.test.ts`

---

## T15: P1 级别集成测试

**优先级**: P1
**依赖**: T6, T9
**预计工时**: 0.5 人天

### 目标

编写 BUG-003 和 BUG-004 的端到端集成测试。

### 交付物

1. ReDoS 攻击模拟测试（BUG-003）
2. 异常退出恢复测试（BUG-004）
3. 性能基准测试

### 验收标准

- 嵌套深度 1-10000 测试通过
- 处理 10000 字符 < 100ms
- 异常退出后自动清理生效

### 影响范围

**修改文件**: 无

**新增文件**:
- `tests/integration/redos-protection.test.ts`
- `tests/integration/state-cleanup.test.ts`

---

## T16: P2 级别集成测试

**优先级**: P2
**依赖**: T11, T13
**预计工时**: 0.5 人天

### 目标

编写 BUG-005 和 BUG-006 的端到端集成测试。

### 交付物

1. 关键词冲突解决测试（BUG-005）
2. 空输入处理测试（BUG-006）
3. 用户反馈机制测试

### 验收标准

- 所有 2-3 关键词组合测试通过
- 空输入抛出明确错误
- 冲突提示清晰友好

### 影响范围

**修改文件**: 无

**新增文件**:
- `tests/integration/keyword-conflicts.test.ts`
- `tests/integration/input-validation.test.ts`

---

## T17: 安全测试套件

**优先级**: P0
**依赖**: T4, T5
**预计工时**: 0.5 人天

### 目标

编写全面的安全测试套件，验证所有安全修复。

### 交付物

1. 模糊测试（1000+ 恶意输入样本）
2. 渗透测试（验证所有已知攻击向量）
3. 依赖漏洞扫描

### 验收标准

- 模糊测试无漏洞
- 所有已知攻击向量被阻止
- 依赖无已知漏洞

### 影响范围

**修改文件**: 无

**新增文件**:
- `tests/security/fuzzing.test.ts`
- `tests/security/penetration.test.ts`
- `scripts/security-scan.sh`

---

## T18: 性能基准测试

**优先级**: P1
**依赖**: T2, T3
**预计工时**: 0.5 人天

### 目标

建立性能基准，确保修复不引入性能退化。

### 交付物

1. 并发写入压力测试（1000+ 并发，持续 10 分钟）
2. ReDoS 攻击模拟测试
3. 内存泄漏测试

### 验收标准

- 写入延迟 < 10ms
- 处理 10000 字符 < 100ms
- 无内存泄漏

### 影响范围

**修改文件**: 无

**新增文件**:
- `benchmark/state-write-performance.ts`
- `benchmark/regex-performance.ts`
- `benchmark/memory-leak-detection.ts`

---

## T19: 文档更新

**优先级**: P1
**依赖**: T0, T1, T2, T3, T7, T8, T10, T12
**预计工时**: 1 人天

### 目标

更新所有相关文档，反映修复内容和新增功能。

### 交付物

1. 更新 `CHANGELOG.md`（记录所有 BUG 修复）
2. 更新 `docs/REFERENCE.md`（审计日志、用户反馈机制）
3. 更新 `README.md`（安全加固说明）
4. 更新 `docs/ARCHITECTURE.md`（新增模块）

### 验收标准

- 所有修复在 CHANGELOG 中有记录
- 新增功能在 REFERENCE 中有文档
- 架构图反映新增模块

### 影响范围

**修改文件**:
- `CHANGELOG.md`
- `docs/REFERENCE.md`
- `README.md`
- `docs/ARCHITECTURE.md`

**新增文件**: 无

---

## 总结

**总任务数**: 20
**总工时**: 8.5 人天
**关键路径**: T0 → T2 → T7 → T8 → T9 → T15 → T17 → T18 → T19
**并行执行阶段**: 7 个阶段，最大并行度 4 个任务

**优先级分布**:
- P0: 8 个任务（4 人天）
- P1: 8 个任务（3.5 人天）
- P2: 4 个任务（1 人天）

**风险评估**:
- 高风险任务: T2（状态文件竞态条件修复，涉及核心状态管理）
- 中风险任务: T1（Hook 输入验证，涉及所有 15 种 HookType）
- 低风险任务: T10, T12（关键词冲突、空输入处理，影响范围小）

**建议执行顺序**:
1. 阶段 0: T0（审计日志模块）
2. 阶段 1: T1, T2, T3（P0 BUG 修复）
3. 阶段 2: T4, T5, T6（P0+P1 单元测试）
4. 阶段 3: T7（用户反馈模块）
5. 阶段 4: T8, T10（P1+P2 BUG 修复）
6. 阶段 5: T9, T11, T12, T13（剩余单元测试）
7. 阶段 6: T14, T15, T16, T17, T18（集成测试、安全测试、性能测试）
8. 阶段 7: T19（文档更新）

