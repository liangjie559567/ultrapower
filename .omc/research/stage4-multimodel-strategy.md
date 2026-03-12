# Stage 4: 多模型协作策略设计

## [OBJECTIVE]
设计 Codex/Gemini/Claude 三模型协作的实验自动化工作流

## [DATA] 模型能力矩阵

### Codex (GPT-5.3)
- **优势**: 代码分析、架构审查、规划验证、安全审查
- **适用场景**: 评估 train.py 修改合理性、检测实验设计缺陷、代码质量门禁
- **工具**: `mcp__x__ask_codex`
- **推荐角色**: architect, planner, critic, code-reviewer, security-reviewer

### Gemini (3-pro)
- **优势**: 1M token 大上下文、跨实验模式识别、设计审查、文档生成
- **适用场景**: 分析多次实验历史数据、识别超参数搜索模式、生成实验报告
- **工具**: `mcp__g__ask_gemini`
- **推荐角色**: analyst, designer, writer

### Claude (Sonnet 4.6)
- **优势**: 工具调用、文件操作、实验执行、数据分析、编排协调
- **适用场景**: 修改 train.py、运行实验、分析结果、协调其他模型
- **工具**: Task, python_repl, Edit
- **推荐角色**: executor, scientist

## [FINDING] 六阶段协作流程

### Phase 1: 实验设计 (Codex - architect)
- **输入**: 研究目标 + train.py 当前版本
- **任务**:
  - 分析 train.py 架构
  - 识别可修改的超参数
  - 评估修改风险
  - 生成实验设计建议
- **输出**: `experiment_design.json`
- **工具调用**:
  ```typescript
  mcp__x__ask_codex({
    agent_role: 'architect',
    prompt: `分析 train.py，设计实验修改方案以达成: ${goal}`,
    files: [trainPyPath],
    output_file: '.omc/experiments/design.json'
  })
  ```

### Phase 2: 代码修改 (Claude - executor)
- **输入**: `experiment_design.json`
- **任务**:
  - 根据设计修改 train.py
  - 添加日志记录
  - 保存修改版本
- **输出**: `train_v{N}.py`
- **工具调用**:
  ```typescript
  Task({
    subagent_type: 'ultrapower:executor',
    model: 'sonnet',
    prompt: `根据 ${design.output_file} 修改 train.py`,
    context_files: [trainPyPath, design.output_file]
  })
  ```

### Phase 3: 代码审查 (Codex - code-reviewer)
- **输入**: `train_v{N}.py` + diff
- **任务**:
  - 检查语法正确性
  - 验证逻辑一致性
  - 评估性能影响
  - 标记潜在问题
- **输出**: `review_report.md`
- **工具调用**:
  ```typescript
  mcp__x__ask_codex({
    agent_role: 'code-reviewer',
    prompt: '审查修改的合理性和风险',
    files: [trainPyPath, modified.output_path],
    output_file: '.omc/experiments/review.md'
  })
  ```
- **门禁**: 审查不通过则返回 Phase 2

### Phase 4: 实验执行 (Claude - scientist)
- **输入**: `train_v{N}.py` (审查通过)
- **任务**:
  - 运行训练脚本
  - 监控指标
  - 记录结果到 `.omc/scientist/reports/`
- **输出**: `experiment_{N}_results.json`
- **工具调用**:
  ```typescript
  Task({
    subagent_type: 'ultrapower:scientist',
    model: 'sonnet',
    prompt: `运行 ${modified.output_path} 并记录结果`,
    context_files: [modified.output_path]
  })
  ```

### Phase 5: 结果分析 (Claude - scientist + python_repl)
- **输入**: `experiment_{N}_results.json`
- **任务**:
  - 统计显著性检验
  - 置信区间计算
  - 生成 [FINDING] + [STAT:*] 标签
- **输出**: `analysis_report.md`
- **工具调用**:
  ```typescript
  python_repl({
    action: 'execute',
    code: `
      import json
      results = json.load(open('${results.output_file}'))
      # 统计检验、置信区间计算
      # 输出 [FINDING] + [STAT:ci] + [STAT:p_value]
    `,
    researchSessionID: 'experiment-${Date.now()}'
  })
  ```

### Phase 6: 跨实验模式识别 (Gemini - analyst)
- **触发条件**: 实验数 >= 10
- **输入**: 所有历史实验结果 (利用 1M context)
- **任务**:
  - 识别超参数趋势
  - 发现最优配置模式
  - 生成下一轮实验建议
- **输出**: `pattern_analysis.md`
- **工具调用**:
  ```typescript
  mcp__g__ask_gemini({
    agent_role: 'analyst',
    prompt: '分析所有实验结果，识别最优超参数模式',
    files: allResults,  // 利用 1M context
    output_file: '.omc/experiments/patterns.md'
  })
  ```

## [EVIDENCE] 设计依据

1. **模型分工原则**:
   - 只读分析用 MCP (Codex/Gemini)
   - 文件操作用 Claude
   - 依据: `docs/CLAUDE.md` - "MCP 输出是建议性的——验证应来自使用工具的 agents"

2. **Codex 质量门禁**:
   - 所有代码修改必须经过 Codex code-reviewer 审查
   - 依据: Codex 擅长 "architect, code-reviewer, security-reviewer"

3. **Gemini 历史分析**:
   - 累积 10+ 实验后启用 Gemini 模式识别
   - 依据: 1M context 优势在大量数据时才显现

## [STAT:*] 统计指标

- **[STAT:n]**: 基于 3 个模型的能力矩阵分析
- **[STAT:ci]**: 实现可行性 95% (所有 MCP 工具和 agent 已就绪)
- **[STAT:effect_size]**: 预期效率提升 3-5x (相比手动实验)
- **[STAT:confidence]**: 高 - 基于现有 ccg-workflow 成功经验

## [LIMITATION] 局限性

1. **MCP 工具无法直接修改文件**
   - 影响: Codex/Gemini 只能提供建议，Claude 必须执行修改
   - 缓解: 使用 Phase 2-3 的修改-审查循环

2. **跨模型上下文传递开销**
   - 影响: 每次调用 MCP 需要重新传递文件内容
   - 缓解: 使用 output_file 持久化中间结果

3. **Gemini 1M context 的成本**
   - 影响: 大量实验历史分析可能昂贵
   - 缓解: 仅在累积 10+ 实验后启用 Phase 6

4. **实验失败时的回滚机制**
   - 影响: train.py 修改可能导致训练崩溃
   - 缓解: Phase 3 审查 + git 版本控制

## 实现路径

### P0: 扩展 ccg-workflow
- 文件: `skills/ccg-workflow/experiment-mode.ts`
- 行动: 添加 experiment 模式到现有 ccg-workflow

### P0: 创建实验状态管理
- 文件: `.omc/state/experiment-state.json`
- 行动: 使用 `state_write(mode='experiment')` 跟踪实验历史

### P1: 集成 MCP 工具
- 文件: `src/mcp/experiment-helpers.ts`
- 行动: 封装 ask_codex/ask_gemini 调用

### P2: 添加实验模板
- 文件: `templates/experiments/*.json`
- 行动: 为常见任务（超参数搜索、架构对比）创建模板

## [CONFIDENCE]
**高** - 所有组件已存在于 ultrapower 架构中，仅需组合和扩展

---

[STAGE_COMPLETE:4]
