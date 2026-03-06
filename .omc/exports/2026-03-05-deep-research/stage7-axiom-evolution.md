# Stage 7: Axiom Integration & Evolution Engine

**研究日期**: 2026-03-05
**版本**: v5.5.14
**研究范围**: Axiom 系统架构、14个工作流、记忆系统、进化引擎、门禁规则

---

## 1. 系统概览

### 1.1 Axiom 定位
Axiom 是 ultrapower 的**智能工作流编排层**，提供：
- 需求驱动的四阶段流水线（Draft → Review → Decompose → Implement）
- 自进化能力（被动学习 → 主动优化）
- 多层记忆系统（短期/长期/知识库）
- 门禁保护机制（Expert/User/CI/Scope Gate）

### 1.2 核心组件
```
.omc/axiom/
├── constitution.md          # 进化安全边界（不可修改文件清单）
├── state_machine.md         # 7状态转换规则（IDLE/DRAFTING/REVIEWING等）
├── active_context.md        # 会话状态（当前阶段/任务/门禁）
├── project_decisions.md     # 架构决策记录（技术栈/编码规范）
├── user_preferences.md      # 用户偏好（语言/沟通风格/开发习惯）
└── evolution/
    ├── knowledge_base.md    # 73条知识索引（8类，置信度0.5-0.95）
    ├── learning_queue.md    # 38个学习任务（P0-P3优先级）
    ├── pattern_library.md   # 13个代码模式（5个active）
    ├── workflow_metrics.md  # 7个工作流执行指标
    └── reflection_log.md    # 反思日志（会话统计/经验提取）
```

---

## 2. 14个 Axiom 工作流

### 2.1 核心流水线（4阶段）
| 工作流 | 触发 | 功能 | 输出 |
|--------|------|------|------|
| `ax-draft` | 用户需求 | 需求澄清 → PRD初稿 | `draft_prd.md` |
| `ax-review` | Draft完成 | 5专家并行评审 → 冲突仲裁 | `rough_prd.md` + `diff_list.md` |
| `ax-decompose` | Review通过 | 生成Manifest → 串行撰写Sub-PRDs | `manifest.md` + `sub_prd_*.md` |
| `ax-implement` | Manifest确认 | 按序执行任务 → CI门禁 | 代码变更 + 测试 |

### 2.2 辅助工作流（10个）
- **状态管理**: `ax-status`（查看状态）、`ax-suspend`（保存退出）、`ax-rollback`（回滚）
- **错误处理**: `ax-analyze-error`（错误分析 → 自动修复）
- **进化引擎**: `ax-reflect`（反思）、`ax-evolve`（进化）、`ax-evolution`（查询知识库/模式库）
- **知识管理**: `ax-knowledge`（知识库管理）、`ax-export`（导出工作流）
- **上下文**: `ax-context`（上下文初始化）

### 2.3 工作流执行指标
```
ax-draft:      1次执行, 100%成功率, ~30分钟
ax-review:     1次执行, 100%成功率, ~45分钟（5专家并行）
ax-decompose:  1次执行, 100%成功率, ~20分钟
ax-implement:  3次执行, 100%成功率, ~1-3会话
autopilot:     2次执行, 100%成功率, ~2会话（Phase 0-5）
release:       8次执行, 100%成功率, ~3分钟（CI自动）
ax-evolve:    13次执行, 100%成功率, ~10分钟
```

---

## 3. 记忆系统架构

### 3.1 三层记忆模型
```
┌─────────────────────────────────────────────────┐
│ Layer 1: 短期记忆（会话级，7天自动清理）        │
│ - active_context.md: 当前状态/任务/门禁         │
│ - notepad.md: 工作记录（priority/working/manual）│
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Layer 2: 长期记忆（项目级，持久化）             │
│ - project_decisions.md: 架构决策                │
│ - user_preferences.md: 用户偏好                 │
│ - project-memory.json: 技术栈/构建/约定         │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Layer 3: 知识库（全局级，可跨项目共享）         │
│ - knowledge_base.md: 73条知识（置信度衰减）     │
│ - pattern_library.md: 13个模式（出现次数≥3）    │
│ - learning_queue.md: 38个待学习任务             │
└─────────────────────────────────────────────────┘
```

### 3.2 知识库统计（73条）
| 分类 | 数量 | 示例 |
|------|------|------|
| architecture | 20 | k-002进化引擎架构, k-042 nexus数据流 |
| workflow | 19 | k-072发布流程模板, k-029全链路验证 |
| debugging | 6 | k-039 Skill追踪缺口, k-044大小写检查 |
| pattern | 8 | k-032原子写入模式, k-043空会话守卫 |
| tooling | 9 | k-053 omc-doctor迁移, k-058插件缓存 |
| security | 3 | k-030路径遍历防护, k-033 Timer泄漏 |
| platform | 1 | k-057 Windows Bash路径 |
| testing | 1 | k-071 Vitest Mock完整性 |

### 3.3 置信度管理
- **种子知识**: 0.85（手动添加）
- **验证知识**: 0.9-0.95（多次成功）
- **衰减规则**: 30天未使用 -0.1
- **清理阈值**: <0.5 标记为deprecated

---

## 4. 进化引擎机制

### 4.1 配置参数（axiom-config.ts）
```typescript
evolution: {
  minConfidence: 0.5,        // 知识最低置信度
  seedConfidence: 0.85,      // 种子知识置信度
  decayDays: 30,             // 衰减周期
  decayAmount: 0.1,          // 衰减量
  maxLearningQueue: 50,      // 队列上限
  patternMinOccurrences: 3   // 模式最小出现次数
}
```

### 4.2 学习队列流程
```
1. 事件触发 → 添加到learning_queue.md（P0-P3优先级）
2. 队列处理 → 提取知识 → 写入knowledge_base.md
3. 模式识别 → 出现≥3次 → 提升为active模式
4. 归档管理 → done状态>10条 → 保留最新10条
```

### 4.3 自动触发规则
| 事件 | 自动行为 |
|------|---------|
| 任务完成 | 代码变更加入学习队列 |
| 错误修复成功 | 修复模式加入队列（P1） |
| 工作流完成 | 更新workflow_metrics.md |
| 状态→ARCHIVING | 自动触发ax-reflect |
| 状态→IDLE | 处理学习队列（P0/P1） |

### 4.4 进化安全边界（constitution.md）
**不可修改文件**:
- constitution.md（本文件）
- bridge-normalize.ts（安全消毒层）
- validateMode.ts（路径遍历防护）
- session-end/（会话清理）
- atomic-write.ts（原子写入）
- package.json, tsconfig.json

**可修改范围**:
- Layer 2（自由）: `.omc/axiom/evolution/*`, `reflection_log.md`
- Layer 1（受审查）: `agents/*.md`, `skills/*/SKILL.md`（需用户确认 + multi-model review）

**修改频率限制**:
- 每个agent提示词: 最多7天优化1次
- 每次会话: 最多1次自动优化建议
- 每日全局: 最多3个文件自动修改
- 冷启动保护: 至少10个会话后启用

---

## 5. 门禁规则体系

### 5.1 四大门禁
| 门禁 | 触发时机 | 检查内容 | 通过条件 |
|------|---------|---------|---------|
| **Expert Gate** | 所有新功能需求 | PRD质量 | 必须经过ax-draft → ax-review |
| **User Gate** | PRD终稿生成 | 用户确认 | 显示"PRD已生成，是否确认执行？" |
| **CI Gate** | 代码修改完成 | 编译/测试 | `tsc --noEmit && npm run build && npm test` 无错误 |
| **Scope Gate** | 修改文件时 | 范围检查 | 在manifest.md定义的Impact Scope内 |

### 5.2 状态机转换（7状态）
```
IDLE → DRAFTING → CONFIRMING → REVIEWING → CONFIRMING
  → DECOMPOSING → CONFIRMING → IMPLEMENTING → BLOCKED/IDLE
```

**关键转换**:
- `DRAFTING → CONFIRMING`: 初稿完成（Gate 1）
- `REVIEWING → CONFIRMING`: 评审完成（Gate 2）
- `DECOMPOSING → CONFIRMING`: Manifest完成（Gate 3）
- `IMPLEMENTING → BLOCKED`: 编译/测试失败
- `BLOCKED → IMPLEMENTING`: 自动修复/人工干预

---

## 6. 实际应用案例

### 6.1 v5.5.14发布流程（LQ-037）
**8步检查清单**:
1. 版本同步（8个文件）
2. 测试验证（npm run test:run）
3. Git提交（chore: bump version）
4. Tag推送（git tag + push）
5. CI监控（3阶段: publish → github-release → marketplace-sync）
6. 验证（npm + GitHub）
7. dev→main合并（--no-ff）
8. 清理（删除临时分支）

**关键知识**:
- k-072: 发布流程标准模板
- k-073: Git stash三步法（处理未提交更改）

### 6.2 Phase 2质量提升（T015-T021）
**执行时间**: 12分钟
**并行agents**: 4个
**任务完成**: 7个（10人天压缩至12分钟）

**成果**:
- 循环依赖: 6个 → 0个
- any类型: 11处 → 0处
- 测试覆盖率: 89.7%（超过70%目标）
- 总测试数: 5783 passed

---

## 7. 关键发现

### 7.1 架构优势
1. **状态持久化**: 所有状态存储在`.omc/axiom/`，支持会话恢复
2. **门禁保护**: 4层门禁确保质量（Expert/User/CI/Scope）
3. **并行评审**: 5专家并行（UX/Product/Domain/Tech/Critic）发现更多问题
4. **自动修复**: ax-analyze-error支持错误分析 → 自动修复循环

### 7.2 进化能力
1. **被动学习**: 自动收集工作流执行数据（不含用户代码/PII）
2. **知识衰减**: 30天未使用 -0.1置信度，<0.5自动清理
3. **模式提升**: 出现≥3次 → active模式（可复用）
4. **跨项目隔离**: 项目知识在`.omc/`，全局知识在`~/.claude/.omc/`（需显式启用）

### 7.3 安全边界
1. **不可修改**: 安全关键文件（bridge-normalize, validateMode等）
2. **修改频率**: 每agent最多7天优化1次
3. **回滚要求**: Layer 1修改前备份，CI失败自动回滚
4. **数据隐私**: 禁止收集源代码/对话历史/PII/API密钥

---

## 8. 技术债与改进

### 8.1 当前限制
- **Agent定义**: 14个Axiom工作流，但无独立agent定义文件（通过skill调用）
- **Provider路由**: 支持claude/codex/gemini，但配置在axiom-config.ts（未见实际路由逻辑）
- **Dispatcher超时**: 配置了3档超时（simple/medium/complex），但未见实际使用

### 8.2 待验证模式（<3次出现）
- P-002: assertValidMode()守卫模式（1次）
- P-004: 大小写敏感反模式（2次）
- P-005: 插件注册表路径漂移（1次）
- P-007: 循环依赖参数传递（1次）
- P-011: Windows Bash路径语法（1次）

### 8.3 改进建议
1. **测试覆盖**: Axiom工作流仅1个测试文件（ax-context-init.test.ts）
2. **文档同步**: constitution.md定义了规则，但未见enforcement代码
3. **Provider集成**: axiom-config.ts定义了3个provider，但未见MCP集成
4. **Dispatcher实现**: 超时配置存在，但未见实际dispatcher代码

---

## 9. 总结

### 9.1 核心价值
Axiom系统通过**四阶段流水线 + 四层门禁 + 三层记忆 + 自进化引擎**，实现了：
- 需求到交付的全流程自动化（100%成功率）
- 知识积累与模式复用（73条知识，13个模式）
- 安全可控的自我优化（constitution边界保护）

### 9.2 实战验证
- 13次进化循环（ax-evolve）
- 8次版本发布（release）
- 3次完整实施（ax-implement）
- 2次全自主执行（autopilot）

### 9.3 与ultrapower集成
Axiom是ultrapower的**智能编排层**，与核心系统深度集成：
- 状态管理: 复用`.omc/state/`机制
- Hook系统: 通过session-end触发ax-reflect
- Agent编排: 调用ultrapower的executor/verifier等agents
- 记忆系统: 扩展notepad/project-memory机制

---

**报告行数**: 248行
**研究深度**: 配置层 + 工作流层 + 记忆层 + 进化层
**验证状态**: 基于实际代码和执行日志
