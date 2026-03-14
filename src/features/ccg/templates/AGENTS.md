<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-14 | Updated: 2026-03-14 -->

# src/features/ccg/templates/ - 代码生成模板

**用途：** 结构化模板库，定义需求、设计、开发、测试、优化的标准格式。

## 关键文件

| 文件 | 描述 |
| ------ | ------ |
| `requirements.md` | 需求规格模板 |
| `tech-design.md` | 技术设计模板 |
| `dev-module.md` | 开发模块模板 |
| `feature-flow.md` | 功能流程模板 |
| `test-checklist.md` | 测试检查清单 |
| `modification-plan.md` | 修改计划模板 |
| `optimization-list.md` | 优化列表模板 |

## 面向 AI 智能体

### 在此目录中工作

1. **使用模板**
   - 读取对应模板文件
   - 填充占位符
   - 生成结构化输出

2. **修改模板**
   - 编辑 `.md` 文件
   - 保持格式一致
   - 更新父目录文档

### 常见任务

```typescript
// 加载模板
import { readFileSync } from 'fs';
const template = readFileSync('./requirements.md', 'utf-8');

// 填充模板
const filled = template.replace(/\$\{(\w+)\}/g, (_, key) => values[key]);
```
