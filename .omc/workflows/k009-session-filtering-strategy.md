# 会话过滤多维度策略

## 背景
反思工作流需要过滤空会话（无实际工作的会话）。单一条件（如仅检查agents数量）会导致误判。多维度组合过滤确保准确识别有效会话。

## 实现步骤

1. **定义过滤维度**
   ```typescript
   const hasAgents = (input.agentsSpawned ?? 0) > 0;
   const hasModes = (input.modesUsed?.length ?? 0) > 0;
   const hasSignificantDuration = (input.durationMs ?? 0) >= 60000;
   const hasCompletedWork = (input.agentsCompleted ?? 0) > 0;
   ```

2. **组合过滤条件**
   ```typescript
   if (!hasAgents && !hasModes && !hasSignificantDuration && !hasCompletedWork) {
     return { reflected: false, queuedItems: 0 };
   }
   ```

3. **应用过滤**
   - 在反思工作流开始时检查
   - 跳过空会话的反思处理
   - 记录过滤决策

4. **监控过滤效果**
   - 统计过滤掉的会话数
   - 验证误判率
   - 调整阈值（如60000ms）

## 验证方法

- 运行reflection log过滤，检查结果
- 对比过滤前后的会话数
- 抽样验证被过滤的会话确实为空
- 检查有效会话是否被误过滤

## 注意事项

- **多维度必要**：单一条件容易误判
- **阈值可调**：60000ms可根据项目调整
- **逻辑为AND**：所有条件都不满足才过滤
- **记录决策**：便于后续审计和改进
