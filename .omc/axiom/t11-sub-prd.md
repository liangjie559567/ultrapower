# T11: 死锁检测算法 - Sub-PRD

**优先级:** P1
**预计工时:** 1 周
**依赖:** T10
**负责角色:** Backend Engineer

---

## 目标

实现死锁检测算法，自动识别 Team 模式下的任务依赖循环，防止系统陷入死锁状态。

---

## 技术方案

### 1. 依赖图构建

**文件:** `src/team/dependency-graph.ts`

核心功能：
- 从任务列表构建有向图
- 节点：任务 ID
- 边：依赖关系（A depends on B）

### 2. 循环检测算法

**算法:** 深度优先搜索（DFS）+ 访问状态标记

```typescript
enum VisitState {
  Unvisited,
  Visiting,  // 当前路径中
  Visited    // 已完成访问
}

// 检测到 Visiting 状态的节点 = 发现循环
```

### 3. 死锁检测器

**文件:** `src/team/deadlock-detector.ts`

核心功能：
- 定期检查任务依赖图
- 检测到循环时生成告警
- 提供解决建议（移除哪条依赖边）

---

## 实施步骤

### Step 1: 创建依赖图模块
- 实现 `DependencyGraph` 类
- 支持添加节点和边
- 导出图结构供检测使用

### Step 2: 实现循环检测算法
- DFS 遍历
- 三色标记法检测循环
- 返回循环路径

### Step 3: 集成到 Team 系统
- 在任务创建/更新时触发检测
- 检测到死锁时抛出错误
- 记录死锁事件

### Step 4: 单元测试
- 测试简单循环（A→B→A）
- 测试复杂循环（A→B→C→A）
- 测试无循环图
- 目标覆盖率 > 90%

---

## 验收标准

- [ ] 实现依赖图循环检测算法
- [ ] 检测到死锁时自动告警
- [ ] 提供死锁解决建议
- [ ] 单元测试覆盖率 > 90%
- [ ] 性能：1000 节点图检测 < 100ms

---

## 影响范围

**新建文件:**
- `src/team/dependency-graph.ts`
- `src/team/deadlock-detector.ts`
- `src/team/__tests__/dependency-graph.test.ts`
- `src/team/__tests__/deadlock-detector.test.ts`

**修改文件:**
- `src/team/index.ts`（导出新模块）

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| 性能问题（大图） | 使用缓存，避免重复检测 |
| 误报 | 严格测试边界情况 |

---

**生成时间:** 2026-03-04
**状态:** 待执行
