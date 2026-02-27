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

### LQ-004: Atomic Write 隐含契约（atomicWriteJson 负责目录创建）
- 优先级: P1
- 来源类型: pattern
- 状态: done
- 添加时间: 2026-02-26
- 处理时间: 2026-02-26
- 内容: atomicWriteJson 内部调用 mkdirSync({ recursive: true })，调用方不需要预先创建目录。在调用前添加 existsSync/mkdirSync 是冗余的，应移除。这是 atomic-write.ts 的设计契约。
- 元数据: file=src/lib/atomic-write.ts, pattern=passive-learning-write
- 知识产出: k-032

### LQ-005: Promise.race Timer 泄漏防护模式
- 优先级: P1
- 来源类型: pattern
- 状态: done
- 添加时间: 2026-02-26
- 处理时间: 2026-02-26
- 内容: Promise.race([work(), timeout]) 中，即使 work() 先完成，timeout 的 setTimeout 仍在运行。必须在 finally 块中调用 clearTimeout(timeoutHandle) 防止泄漏。标准模式：let timeoutHandle; try { return await Promise.race([work(), timeout]); } finally { clearTimeout(timeoutHandle); }
- 元数据: file=src/hooks/learner/session-reflector.ts, security=timer-leak
- 知识产出: k-033

### LQ-006: Regex 注入防护（动态 RegExp 构建）
- 优先级: P0
- 来源类型: pattern
- 状态: done
- 添加时间: 2026-02-26
- 处理时间: 2026-02-26
- 内容: 将外部/用户数据插入 new RegExp() 前，必须转义所有特殊字符：str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')。未转义的 ID 如 "Q-001" 中的 "-" 在 RegExp 字符类中有特殊含义，可能导致意外匹配或注入。
- 元数据: file=src/hooks/learner/learning-queue.ts, owasp=injection
- 知识产出: k-034

### LQ-007: 有界增长集合（entry caps + key sanitization）
- 优先级: P1
- 来源类型: pattern
- 状态: done
- 添加时间: 2026-02-26
- 处理时间: 2026-02-26
- 内容: 持久化的 Record<string, T> 必须设置最大条目数上限（MAX_TOOL_ENTRIES=500, MAX_AGENT_ENTRIES=200）和键长度上限（MAX_KEY_LENGTH=128）。超出上限时静默丢弃新条目，防止无界增长导致文件膨胀。
- 元数据: file=src/hooks/learner/usage-tracker.ts, pattern=bounded-growth
- 知识产出: k-035

### LQ-008: Release Skill 版本文件清单遗漏 CLAUDE.md
- 优先级: P2
- 来源类型: session
- 状态: done
- 添加时间: 2026-02-27
- 处理时间: 2026-02-27
- 内容: release skill 的版本同步清单遗漏了根目录 `CLAUDE.md` 中的 `ultrapower vX.Y.Z 规范体系位于 docs/standards/` 引用。该引用在 v5.0.22~v5.1.0 多个版本发布期间未同步更新，需要将其加入 `skills/release/SKILL.md` 的版本文件表格。
- 元数据: file=skills/release/SKILL.md, session=2026-02-27
- 知识产出: k-036

### LQ-009: 动态版本读取模式（getRuntimePackageVersion）
- 优先级: P2
- 来源类型: pattern
- 状态: done
- 添加时间: 2026-02-27
- 处理时间: 2026-02-27
- 内容: `src/installer/index.ts` 使用 `getRuntimePackageVersion()` 从 `package.json` 动态读取版本，无需硬编码 VERSION 常量。发布时只需更新 `package.json`，其他文件自动跟随。这是比硬编码常量更健壮的模式，应在新模块中推广。
- 元数据: file=src/installer/index.ts, pattern=dynamic-version
- 知识产出: k-037

### LQ-010: 特性分支生命周期管理
- 优先级: P2
- 来源类型: session
- 状态: done
- 添加时间: 2026-02-27
- 处理时间: 2026-02-27
- 内容: 特性分支合并到 dev（PR merge）后应立即删除本地和远程分支，避免积累过时分支。正确时序：PR merge → 删除特性分支（本地+远程）→ dev 同步到 main（发布时）→ main 同步回 dev。
- 元数据: session=2026-02-27, pattern=branch-lifecycle
- 知识产出: k-038

### LQ-011: nexus TS→Python 数据流文档缺失
- 优先级: P2
- 来源类型: session
- 状态: done
- 添加时间: 2026-02-27
- 处理时间: 2026-02-27
- 内容: nexus 系统的 TS→Python 数据流（events → improvements → self_modifier）没有文档，需要靠读代码推断。应在 nexus-daemon/README.md 或 docs/ 中补充数据流说明图。
- 元数据: session=2026-02-27, files=src/hooks/nexus/, nexus-daemon/
- 知识产出: nexus-daemon/README.md 新增"数据流：TS → Python"章节，含 ASCII 流程图和详细步骤

### LQ-012: usage_metrics agents/skills 修复效果验证
- 优先级: P2
- 来源类型: session
- 状态: done
- 添加时间: 2026-02-27
- 处理时间: 2026-02-27
- 内容: Phase 2 修复了 extractSkillName 和空工具名过滤，但历史数据不会回填。验证发现 skills 字段仍为空，根因是 extractSkillName 大小写不匹配（'Skill' vs 'skill'）。已追加修复：toolName.toLowerCase() 后再比较。
- 元数据: session=2026-02-27, file=src/hooks/learner/usage-tracker.ts, commit=5882c12
- 知识产出: k-044

### LQ-013: reflection_log.md 空条目积累问题
- 优先级: P2
- 来源类型: session
- 状态: done
- 添加时间: 2026-02-27
- 处理时间: 2026-02-27
- 内容: session-end hook 自动追加空的 auto-session- 条目，导致 reflection_log.md 膨胀（30+ 空条目，约 450 行噪音）。需要在 hook 中加入 guard：无实质内容时不追加空条目，并清理现有积累。
- 元数据: session=2026-02-27, file=.omc/axiom/reflection_log.md, hook=session-end
- 知识产出: 在 session-reflector.ts 加入三条件 guard（无 agents + 无 modes + duration < 60s），reflection_log.md 从 970 行清理至 ~280 行

## 处理中

## 已完成
