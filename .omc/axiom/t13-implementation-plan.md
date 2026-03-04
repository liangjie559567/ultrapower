# T013: Hooks 系统测试覆盖率提升计划

**生成时间:** 2026-03-04
**目标:** Hooks 覆盖率从 23.5% 提升至 >60%
**当前状态:** 40/170 模块有测试，需补充 62 个模块

---

## 1. 现状分析

### 1.1 统计数据
- **总实现文件:** 170 个
- **已有测试模块:** 40 个 (23.5%)
- **测试文件总数:** 101 个
- **总测试用例数:** 1650 个
- **差距:** 需补充约 62 个模块测试

### 1.2 核心执行模式测试现状
| 模块 | 测试用例数 | 状态 |
|------|-----------|------|
| autopilot | 0 | ❌ 缺失 |
| ralph | 0 | ❌ 缺失 |
| ultrawork | 0 | ❌ 缺失 |
| team-pipeline | 0 | ❌ 缺失 |
| persistent-mode | 0 | ❌ 缺失 |
| ultrapilot | 5 | ⚠️ 不足 |
| ultraqa | 5 | ⚠️ 不足 |

**关键发现:** 核心执行模式（autopilot、ralph、ultrawork、team-pipeline）完全缺失测试！

### 1.3 已完成模块
✓ guards (22 用例)
✓ 其他 39 个模块（约 1628 用例）

---

## 2. 优先级分组

### P0: 核心执行模式 (7 模块) - 必须 >80% 覆盖
**影响:** 系统核心功能，故障影响面最大

1. **autopilot** - 全自主执行模式
   - 文件: index.ts, enforcement.ts, prompts.ts, state.ts, validation.ts, cancel.ts
   - 预计用例: 18 个 (每文件 3 个)

2. **ralph** - 持久循环执行
   - 文件: index.ts, loop.ts
   - 预计用例: 6 个

3. **ultrawork** - 并行编排
   - 文件: index.ts
   - 预计用例: 3 个

4. **team-pipeline** - 团队协作流水线
   - 文件: index.ts, state.ts
   - 预计用例: 6 个

5. **persistent-mode** - 持久模式管理
   - 文件: index.ts, tool-error.ts
   - 预计用例: 6 个

6. **ultrapilot** - 并行构建
   - 文件: index.ts
   - 预计用例: 增加至 9 个 (当前 5 个)

7. **ultraqa** - QA 循环
   - 文件: index.ts
   - 预计用例: 增加至 9 个 (当前 5 个)

**P0 小计:** 52 个新增用例

---

### P1: 状态管理与工具 (8 模块) - 必须 >60% 覆盖
**影响:** 状态一致性、工具链稳定性

8. **mode-registry** - 模式注册
9. **observability** - 可观测性
10. **subagent-tracker** - 子 Agent 追踪
11. **nexus** - 事件同步
12. **beads-context** - 上下文管理
13. **keyword-detector** - 关键词检测
14. **empty-message-sanitizer** - 消息清理
15. **todo-continuation** - 任务延续

**P1 小计:** 24 个新增用例 (每模块 3 个)

---

### P2: 辅助功能 (10 模块) - 必须 >40% 覆盖
**影响:** 用户体验、开发效率

16. **agent-usage-reminder** - Agent 使用提醒
17. **auto-slash-command** - 自动斜杠命令
18. **background-notification** - 后台通知
19. **comment-checker** - 注释检查
20. **directory-readme-injector** - README 注入
21. **plugin-patterns** - 插件模式
22. **pre-compact** - 预压缩
23. **preemptive-compaction** - 抢占式压缩
24. **thinking-block-validator** - 思考块验证
25. **think-mode** - 思考模式

**P2 小计:** 30 个新增用例 (每模块 3 个)

---

### P3: 已有测试模块 (15 模块) - 保持现状
**影响:** 已有保护，优先级低

26-40. axiom-boot, axiom-guards, learner, memory, notepad, omc-orchestrator, permission-handler, project-memory, recovery, rules-injector, session-end, setup 等

**P3 小计:** 0 个新增用例（已有测试）

---

## 3. 分阶段目标

### Phase 2a: 核心模块冲刺 (Week 9-10)
**目标:** P0 模块覆盖率 >80%

**工作量估算:**
- 7 个核心模块
- 52 个新增测试用例
- 预计工时: 4 人天

**验收标准:**
- [ ] autopilot 覆盖率 >80% (18 用例)
- [ ] ralph 覆盖率 >80% (6 用例)
- [ ] ultrawork 覆盖率 >80% (3 用例)
- [ ] team-pipeline 覆盖率 >80% (6 用例)
- [ ] persistent-mode 覆盖率 >80% (6 用例)
- [ ] ultrapilot 覆盖率 >80% (9 用例)
- [ ] ultraqa 覆盖率 >80% (9 用例)
- [ ] 所有测试通过

**里程碑:** 核心执行模式测试保护完成

---

### Phase 2b: 整体达标 (Week 11-12)
**目标:** Hooks 整体覆盖率 >60%

**工作量估算:**
- 18 个模块 (P1 + P2)
- 54 个新增测试用例
- 预计工时: 6 人天

**验收标准:**
- [ ] P1 模块覆盖率 >60% (24 用例)
- [ ] P2 模块覆盖率 >40% (30 用例)
- [ ] Hooks 整体覆盖率 >60%
- [ ] 所有测试通过
- [ ] 零测试不稳定

**里程碑:** T013 完成，进入 T014

---

## 4. 测试用例设计模板

### 4.1 标准三用例模式
每个 Hook 模块至少包含：

```typescript
describe('HookName', () => {
  // 1. 正常流程
  it('should execute successfully with valid input', async () => {
    // 测试正常执行路径
  });

  // 2. 错误处理
  it('should handle errors gracefully', async () => {
    // 测试错误场景（无效输入、依赖失败等）
  });

  // 3. 边界情况
  it('should handle edge cases', async () => {
    // 测试边界条件（空输入、极限值、并发等）
  });
});
```

### 4.2 核心模块增强模式
P0 模块需额外覆盖：

```typescript
// 4. 状态转换
it('should transition states correctly', async () => {
  // 测试状态机转换
});

// 5. 并发安全
it('should be thread-safe', async () => {
  // 测试并发执行
});

// 6. 恢复机制
it('should recover from crashes', async () => {
  // 测试崩溃恢复
});
```

---

## 5. 实施建议

### 5.1 批量创建 vs 逐个完善
**推荐策略:** 混合模式

**Phase 2a (P0 模块):**
- 逐个完善，确保质量
- 每个模块完成后立即运行测试
- 发现问题立即修复

**Phase 2b (P1/P2 模块):**
- 批量创建骨架（3 用例/模块）
- 并行填充测试逻辑
- 统一运行回归测试

### 5.2 测试工具链
```bash
# 单模块测试
npm test -- src/hooks/autopilot/__tests__

# 覆盖率报告
npm run test:coverage -- --testPathPattern=hooks

# 监视模式（开发时）
npm test -- --watch src/hooks/autopilot
```

### 5.3 质量门禁
每个 Phase 完成前必须通过：
- [ ] 所有测试通过 (npm test)
- [ ] 覆盖率达标 (npm run test:coverage)
- [ ] 零 TypeScript 错误 (tsc --noEmit)
- [ ] 零 ESLint 警告 (npm run lint)

---

## 6. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 核心模块逻辑复杂难测 | 高 | 高 | 使用 mock/stub 隔离依赖 |
| 测试不稳定 (flaky) | 中 | 中 | 避免时间依赖，使用固定 seed |
| 覆盖率统计不准确 | 低 | 中 | 手动验证关键模块 |
| 工作量膨胀 | 中 | 中 | 严格遵守 3 用例最小集 |

---

## 7. 成功指标

### 7.1 Phase 2a 指标
- P0 模块覆盖率: 0% → >80%
- 新增测试用例: 52 个
- 核心执行模式保护: 100%

### 7.2 Phase 2b 指标
- Hooks 整体覆盖率: 23.5% → >60%
- 新增测试用例: 106 个 (52+54)
- 测试通过率: 100%

### 7.3 T013 最终指标
- Hooks 覆盖率: >60% ✓
- 每个 Hook 类型: ≥3 用例 ✓
- 零测试失败 ✓

---

## 8. 下一步行动

### 立即执行 (本周)
1. 开始 Phase 2a
2. 优先实现 autopilot 测试（最复杂）
3. 并行实现 ralph + ultrawork 测试

### 本周目标
- 完成 Phase 2a 所有 P0 模块
- 核心执行模式覆盖率 >80%

### 下周目标
- 完成 Phase 2b 所有 P1/P2 模块
- Hooks 整体覆盖率 >60%
- T013 验收通过

---

**计划生成完成**
**总工作量:** 10 人天
**预计完成:** Week 12
**下一步:** 开始 Phase 2a - autopilot 模块测试
