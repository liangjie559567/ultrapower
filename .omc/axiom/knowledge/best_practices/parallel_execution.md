# 并行执行最佳实践

**来源**: v5.5.18 P0 修复会话
**置信度**: 高
**最后更新**: 2026-03-05

## 核心原则

1. **显式依赖声明**: 使用 `addBlockedBy` 而非隐式等待
2. **分阶段解锁**: 按依赖层级分批执行
3. **无共享状态**: 任务间不共享可变状态

## 依赖声明模式

```typescript
// 阶段 1：无依赖
TaskCreate({ taskId: "1" });
TaskCreate({ taskId: "2" });

// 阶段 2：依赖阶段 1
TaskCreate({ taskId: "3" });
TaskUpdate({ taskId: "3", addBlockedBy: ["1", "2"] });
```

## 反模式

❌ **Agent 内部轮询**：
```typescript
while (true) {
  const task1 = TaskGet({ taskId: "1" });
  if (task1.status === "completed") break;
  await sleep(1000);
}
```

✅ **正确方式**：
```typescript
TaskUpdate({ taskId: "2", addBlockedBy: ["1"] });
```

## 预期收益

- 时间节省：60-99%（取决于并行度）
- 首次成功率：100%（v5.5.18 数据）
