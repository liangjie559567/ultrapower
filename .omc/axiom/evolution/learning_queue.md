# Axiom 学习队列

## 队列格式
```
### LQ-[ID]: [标题]
- 优先级: [P0/P1/P2/P3]
- 来源类型: [session/error/manual/pattern]
- 状态: [pending/processing/done]
- 添加时间: [YYYY-MM-DD]
- 内容: [待学习的知识或经验]
- 元数据: [额外信息]
```

## 优先级说明
- P0: 紧急，影响系统稳定性
- P1: 高优先级，影响工作流效率
- P2: 中优先级，一般改进
- P3: 低优先级，可选优化

## 待处理队列

<!-- 新的学习素材将自动添加到此处 -->

### LQ-001: Axiom 全链路工作流验证模式
- 优先级: P1
- 来源类型: session
- 状态: done
- 添加时间: 2026-02-26
- 处理时间: 2026-02-26
- 内容: ax-draft → ax-review → ax-decompose 全链路在实际项目中首次完整验证。5 专家并行评审发现了 10 个差异点，证明多专家评审对规范体系构建的必要性。
- 元数据: session=2026-02-26, tasks=18/18, files=24, tests=9093
- 知识产出: k-029, P-003

### LQ-002: assertValidMode() 路径遍历防护模式
- 优先级: P1
- 来源类型: pattern
- 状态: done
- 添加时间: 2026-02-26
- 处理时间: 2026-02-26
- 内容: 所有使用 mode 参数构建文件路径的代码，必须先调用 assertValidMode()。validateMode() 返回 boolean，assertValidMode() 抛出异常。测试需覆盖非字符串类型（null/undefined/number/array）。
- 元数据: file=src/lib/validateMode.ts, tests=65, pattern=AP-S01
- 知识产出: k-030, P-002

### LQ-003: 互斥模式为 4 个而非 2 个（D-04）
- 优先级: P2
- 来源类型: session
- 状态: done
- 添加时间: 2026-02-26
- 处理时间: 2026-02-26
- 内容: autopilot、ultrapilot、swarm、pipeline 共 4 个互斥模式，PRD 原描述为 2 个是错误的。EXCLUSIVE_MODES 常量应包含全部 4 个值。
- 元数据: diff=D-04, pattern=AP-MR01
- 知识产出: k-031

## 处理中

## 已完成
