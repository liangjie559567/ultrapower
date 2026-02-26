---
description: 代码模式库 - 存储可复用的代码模式和模板
version: 1.0
last_updated: 2026-02-26
---

# Pattern Library (代码模式库)

本文件存储从项目中识别出的可复用代码模式。

## 1. 模式索引 (Pattern Index)

| ID | Name | Category | Occurrences | Confidence | Status |
|----|------|----------|-------------|------------|--------|
| P-001 | Markdown Workflow Pattern | workflow-def | 5 | 0.9 | active |
| P-002 | assertValidMode() Guard Pattern | security | 1 | 0.95 | pending |
| P-003 | Multi-Expert Parallel Review Pattern | workflow-def | 1 | 0.9 | pending |

## 2. 模式分类 (Categories)

| Category | Description | Count |
|----------|-------------|-------|
| workflow-def | 工作流定义模式 | 2 |
| data-layer | 数据层模式 | 0 |
| ui-layer | UI 层模式 | 0 |
| business-logic | 业务逻辑模式 | 0 |
| common | 通用模式 | 0 |
| security | 安全防护模式 | 1 |

---

## 3. 模式详情 (Pattern Details)

### P-001: Markdown Workflow Pattern

**Category**: workflow-def  
**Occurrences**: 5 (start.md, feature-flow.md, analyze-error.md, evolve.md, reflect.md)  
**Confidence**: 0.9  
**First Seen**: 2026-02-08  
**Files**: `.agent/workflows/*.md`

**Description**:
> 使用 Markdown 定义原子工作流，包含 Trigger, Steps 和 Output Format 三要素。

**Template**:
```markdown
---
description: [Short Description]
---

# /command - [Workflow Name]

## Trigger
- 用户输入 `/command`

## Steps
// turbo (if auto-run)
1. Step 1...
2. Step 2...

## Output Format
(Template)
```


**Usage**:
```dart
final data = await repository.getWithCache('user_profile', () => api.fetchProfile());
```

### P-002: assertValidMode() Guard Pattern

**Category**: security
**Occurrences**: 1 (src/lib/validateMode.ts)
**Confidence**: 0.95
**First Seen**: 2026-02-26
**Status**: pending (需要 3 次出现才能提升为 active)

**Description**:
> 所有使用 mode 参数构建文件路径的代码，必须先调用 assertValidMode()。validateMode() 返回 boolean，assertValidMode() 抛出异常。测试需覆盖非字符串类型（null/undefined/number/array）。

**Template**:
```typescript
// ❌ 错误：直接使用 mode 构建路径
const path = `.omc/state/${mode}-state.json`;

// ✅ 正确：先验证再使用
assertValidMode(mode); // 抛出异常而非返回 false
const path = `.omc/state/${mode}-state.json`;
```

**Related**: AP-S01, k-030

---

### P-003: Multi-Expert Parallel Review Pattern

**Category**: workflow-def
**Occurrences**: 1 (ax-review workflow)
**Confidence**: 0.9
**First Seen**: 2026-02-26
**Status**: pending

**Description**:
> 5 个专家角色（UX/Product/Domain/Tech/Critic）并行评审同一 PRD，各自输出独立报告，再由聚合器进行冲突仲裁。发现差异点数量远超单一评审者。

**Template**:
```
ax-review workflow:
  parallel: [axiom-ux-director, axiom-product-director, axiom-domain-expert, axiom-tech-lead, axiom-critic]
  aggregate: axiom-review-aggregator
  output: rough_prd.md + diff_list.md
```

**Related**: LQ-001, k-029

---

## 4. 模式匹配规则 (Detection Rules)

> 定义如何自动检测代码中的模式

### 规则格式
```yaml
pattern_id: P-xxx
triggers:
  - keyword: "getWithCache"
  - structure: "class.*Repository.*_cache"
min_occurrences: 3
```

---

## 5. 待验证模式 (Pending Patterns)

> 出现次数不足，暂未提升为正式模式

| ID | Name | Occurrences | Notes |
|----|------|-------------|-------|
| - | - | - | 暂无 |
