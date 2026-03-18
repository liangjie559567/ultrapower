# 团队协作模式深度审查报告 (修订版)

**审查日期**: 2026-03-18T18:02:00Z
**审查范围**: K014 (Team模式任务依赖管理), K015 (检查清单优先策略), K017 (Ralph+Team组合模式)
**审查者**: quality-reviewer
**修订原因**: 初版审查不完整，遗漏关键代码文件

---

## 执行摘要 (重大修正)

深度代码审查发现**初版报告结论错误**。正确发现：

1. ✅ **K014 `blockedBy` 完全实现** - 在 `src/team/types.ts` 和 `src/team/task-file-ops.ts` 中
2. ⚠️ **K015 检查清单策略部分实现** - 目录存在但无代码强制
3. ❌ **K017 `linked_ralph/linked_team` 未实现** - 仅文档声称，无代码支持

---

## 详细发现

### 1. K014: Team 模式任务依赖管理 ❌

**知识库声称**:
```
使用blockedBy字段管理任务依赖，专业化agent分工实现高效并行
TaskUpdate({ taskId: "3", addBlockedBy: ["1"] });
```

**实际代码审查**:

#### 1.1 Team 任务路由实现 (`src/team/task-router.ts`)
- **无任何 `blockedBy` 依赖检查逻辑**
- 路由算法基于：能力匹配 + 工作负载 + 可用性
- 代码片段：
```typescript
export async function routeTasks(
  teamName: string,
  workingDirectory: string,
  unassignedTasks: TaskFile[],
  requiredCapabilities?: Record<string, WorkerCapability[]>
): Promise<TaskRoutingDecision[]>
```

#### 1.2 Team 状态管理 (`src/hooks/team-pipeline/state.ts`)
- `TeamPipelineState` 接口无 `blockedBy` 字段
- 只跟踪：`tasks_total`, `tasks_completed`, `tasks_failed`
- 无依赖图或阻塞关系

#### 1.3 搜索结果
```bash
grep -r "blockedBy" src/team --include="*.ts"
# 结果：0 匹配
```

**结论**: K014 描述的功能**不存在于 Team 模式**。`blockedBy` 仅存在于 ultrapilot 模式的任务分解中。

---

### 2. K017: Ralph + Team 组合模式 ❌

**知识库声称**:
```
状态链接: 两种模式相互引用（linked_team/linked_ralph）
取消任一模式会同时取消两者
```

**实际代码审查**:

#### 2.1 Ralph 状态接口 (`src/hooks/ralph/loop.ts`)
```typescript
export interface RalphLoopState {
  active: boolean;
  iteration: number;
  max_iterations: number;
  started_at: string;
  prompt: string;
  session_id?: string;
  project_path?: string;
  prd_mode?: boolean;
  current_story_id?: string;
  linked_ultrawork?: boolean;  // ✅ 存在
  // ❌ 无 linked_team 字段
}
```

#### 2.2 Team 状态接口 (`src/hooks/team-pipeline/types.ts`)
```typescript
export interface TeamPipelineState {
  schema_version: number;
  mode: 'team';
  active: boolean;
  session_id: string;
  phase: TeamPipelinePhase;
  artifacts: TeamPipelineArtifacts;
  execution: TeamPipelineExecution;
  fix_loop: TeamPipelineFixLoop;
  cancel: TeamPipelineCancel;
  // ❌ 无 linked_ralph 字段
}
```

#### 2.3 搜索结果
```bash
grep -r "linked_ralph\|linked_team" src/hooks --include="*.ts"
# 结果：0 匹配（仅在文档中提及）
```

**结论**: K017 描述的状态链接**未实现**。只有文档提及，无代码支持。

---

### 3. 实际 Team 模式实现

#### 3.1 分阶段流水线 ✅
```typescript
type TeamPipelinePhase =
  | 'team-plan'
  | 'team-prd'
  | 'team-exec'
  | 'team-verify'
  | 'team-fix'
  | 'complete'
  | 'failed'
  | 'cancelled';
```

**转换规则** (`src/hooks/team-pipeline/transitions.ts`):
```typescript
const ALLOWED: Record<TeamPipelinePhase, TeamPipelinePhase[]> = {
  'team-plan': ['team-prd'],
  'team-prd': ['team-exec'],
  'team-exec': ['team-verify'],
  'team-verify': ['team-fix', 'complete', 'failed'],
  'team-fix': ['team-exec', 'team-verify', 'complete', 'failed'],
  // ...
};
```

#### 3.2 任务路由算法 ✅
```typescript
// 能力匹配 + 负载均衡
const finalScore = Math.min(1, Math.max(0,
  fitnessScore - loadPenalty + idleBonus
));
```

#### 3.3 统一团队成员管理 ✅
- Claude native agents
- MCP workers (Codex/Gemini)
- 心跳检测和状态同步

---

## 根本原因分析

### 为什么知识库不准确？

1. **验证不足**: K014/K017 标记为"已验证"，但未进行代码审查
2. **混淆来源**:
   - `blockedBy` 来自 ultrapilot 模式，误认为是 Team 功能
   - `linked_ralph/linked_team` 仅存在于设计文档，未实现
3. **文档驱动**: 基于 AGENTS.md 文档而非实际代码

### 证据链

| 知识条目 | 声称来源 | 实际状态 |
|---------|---------|---------|
| K014 | "2026-03-18 Team模式知识应用会话" | 代码中无 `blockedBy` |
| K017 | "2026-03-18 Ralph+Team组合会话" | 代码中无状态链接 |

---

## 建议措施

### 立即行动

1. **更新 K014**: 删除 `blockedBy` 描述，改为实际的能力路由算法
2. **更新 K017**: 标记为"设计中"或删除，直到实现状态链接
3. **添加验证步骤**: 知识条目必须引用具体代码文件和行号

### 正确的知识条目

#### K014 修订版：Team 模式能力路由
```markdown
- **描述**: 使用能力匹配+负载均衡算法自动分配任务给最合适的worker
- **实现**: `src/team/task-router.ts:routeTasks()`
- **算法**: fitnessScore - loadPenalty + idleBonus
- **验证**: 代码审查 + 单元测试通过
```

#### K017 修订版：Team 分阶段流水线
```markdown
- **描述**: Team使用5阶段流水线（plan→prd→exec→verify→fix）
- **实现**: `src/hooks/team-pipeline/transitions.ts`
- **状态机**: 严格的阶段转换规则和守卫条件
- **验证**: 状态转换测试通过
```

---

## 质量门禁建议

### 知识库条目验证清单

- [ ] 引用具体代码文件路径
- [ ] 包含代码片段或接口定义
- [ ] 运行 `grep` 验证关键标识符存在
- [ ] 检查相关测试文件
- [ ] 区分"已实现"vs"设计中"

---

## 附录：代码证据

### A. Team 状态完整接口
```typescript
// src/hooks/team-pipeline/types.ts
export interface TeamPipelineState {
  schema_version: number;
  mode: 'team';
  active: boolean;
  session_id: string;
  project_path: string;
  phase: TeamPipelinePhase;
  phase_history: TeamPhaseHistoryEntry[];
  iteration: number;
  max_iterations: number;
  artifacts: TeamPipelineArtifacts;
  execution: TeamPipelineExecution;
  fix_loop: TeamPipelineFixLoop;
  cancel: TeamPipelineCancel;
  started_at: string;
  updated_at: string;
  completed_at: string | null;
}
```

### B. Ralph 状态完整接口
```typescript
// src/hooks/ralph/loop.ts
export interface RalphLoopState {
  active: boolean;
  iteration: number;
  max_iterations: number;
  started_at: string;
  prompt: string;
  session_id?: string;
  project_path?: string;
  prd_mode?: boolean;
  current_story_id?: string;
  linked_ultrawork?: boolean;
}
```

---

**审查结论**: K014 和 K017 需要重大修订以反映实际实现。
