<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-14 | Updated: 2026-03-14 -->

# docs/dev-standards/ - 开发规范体系

**用途：** 编码前检查清单、充分性验证、质量审查规范。确保所有实现遵循一致的标准。

**核心职责：** 定义编码流程、工具选择决策树、上下文收集协议。

## 关键文件

| 文件 | 描述 |
| ------ | ------ |
| `dev-standards.md` | 编码要求、语言规范、验证机制 |
| `context-collection.md` | 编码前强制检索清单（7步） |
| `sufficiency-checklist.md` | 充分性验证清单（7项必查） |
| `workflow.md` | 工作流程、工具链顺序 |
| `tools-integration.md` | 工具选择决策树 |
| `quality-review.md` | 质量审查规范 |
| `context-summary-template.md` | 上下文摘要模板 |

## 强制执行点

| 阶段 | 检查项 | 文档 |
| ------ | ------ | ------ |
| 编码前 | 7步检索清单 + 充分性验证 | context-collection.md |
| 编码中 | 遵循项目约定、复用组件 | dev-standards.md |
| 编码后 | 质量审查 + 本地验证 | quality-review.md |

## 面向 AI 智能体

### 在此目录中工作

1. **执行编码前检查**
   - 读取 `context-collection.md` 的 7 步清单
   - 运行 `sufficiency-checklist.md` 的 7 项验证
   - 填充 `context-summary-template.md`

2. **选择工具**
   - 查看 `tools-integration.md` 的决策树
   - 根据任务类型选择合适工具
   - 记录工具选择理由

3. **质量审查**
   - 遵循 `quality-review.md` 的规范
   - 验证编码标准
   - 检查测试覆盖率

### 常见任务

```typescript
// 检查充分性
import { SUFFICIENCY_CHECKLIST } from './sufficiency-checklist';
const checks = SUFFICIENCY_CHECKLIST.map(c => c.verify());

// 收集上下文
import { CONTEXT_COLLECTION_STEPS } from './context-collection';
const context = await Promise.all(
  CONTEXT_COLLECTION_STEPS.map(s => s.execute())
);
```

### 修改检查清单

- [ ] 规范文档已更新
- [ ] 示例代码已验证
- [ ] 检查清单项完整
- [ ] 工具决策树准确
