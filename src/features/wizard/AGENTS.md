<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-14 | Updated: 2026-03-14 -->

# src/features/wizard/ - 交互式向导引擎

**用途：** 智能问卷系统，根据用户输入推荐最优 agent 和工作流。

## 关键文件

| 文件 | 描述 |
| ------ | ------ |
| `engine.ts` | 向导执行引擎 |
| `questions.ts` | 问卷库 |
| `recommendation-engine.ts` | 推荐算法 |
| `types.ts` | 类型定义 |
| `index.ts` | 导出 |

## 面向 AI 智能体

### 在此目录中工作

1. **理解推荐流程**
   - 收集用户输入 → 评分 → 推荐 agent/skill

2. **修改问卷**
   - 编辑 `questions.ts`
   - 更新推荐规则
   - 运行测试

3. **优化推荐**
   - 调整 `recommendation-engine.ts` 的评分权重
   - 验证推荐准确性

### 常见任务

```typescript
// 运行向导
import { runWizard } from './engine';
const recommendation = await runWizard();

// 获取推荐
import { getRecommendation } from './recommendation-engine';
const agent = getRecommendation(answers);
```
