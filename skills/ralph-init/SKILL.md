---
name: ralph-init
description: 初始化 PRD（产品需求文档）以进行结构化 ralph 循环执行
---

# Ralph Init

初始化 PRD（产品需求文档）以进行结构化 ralph 循环执行。创建结构化需求文档，供 Ralph 用于目标驱动的迭代。

## 用法

```
/ultrapower:ralph-init "project or feature description"
```

## 行为

1. **收集需求**：通过交互式访谈或从提供的描述中获取
2. **创建 PRD**，保存到 `.omc/plans/prd-{slug}.md`，包含：
   - 问题陈述
   - 目标与非目标
   - 验收标准（可测试）
   - 技术约束
   - 实施阶段
3. **关联到 Ralph**，使 `/ultrapower:ralph` 可以将 PRD 作为完成标准

## 输出

保存到 `.omc/plans/` 的结构化 PRD 文件，作为 Ralph 执行的完成定义。

## 后续步骤

创建 PRD 后，使用以下命令开始执行：
```
/ultrapower:ralph "implement the PRD"
```

Ralph 将持续迭代，直到 PRD 中的所有验收标准均已满足并经过 architect 验证。
