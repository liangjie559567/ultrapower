# Data Validation Priority Checklist (K005)

**Knowledge Base:** K005 - Data Validation优先策略
**Confidence:** 95% (1 verification: 9.7x work estimation error avoided)
**Source:** 2026-03-17 技术债务修复会话

---

## Core Principle

**Before planning, validate actual codebase state with grep/tsc commands.**

Avoid 9.7x work estimation errors by trusting real data, not stale audit reports.

---

## Pre-Planning Validation Commands

### 1. Type System State
```bash
tsc --noEmit 2>&1 | head -20
```
**What to check:** Error count and types
**Why:** Stale type info leads to wrong interface assumptions

### 2. Build Status
```bash
npm run build 2>&1 | tail -10
```
**What to check:** Build succeeds or specific failures
**Why:** Broken builds hide actual code state

### 3. Test Baseline
```bash
npm test -- --run 2>&1 | grep -E "passed|failed"
```
**What to check:** Pass/fail counts
**Why:** Failing tests indicate incomplete features

### 4. Actual Code Metrics
```bash
# Real 'any' usage (not audit report)
grep -r ":\s*any" src/ --include="*.ts" | wc -l

# Real TODO/FIXME count
grep -r "TODO:\|FIXME:" src/ --include="*.ts" | wc -l

# Real file count
find src -name "*.ts" | wc -l
```
**What to check:** Actual numbers vs. audit report
**Why:** Audits become stale; commands show current state

### 5. Dependency Health
```bash
npm ls --depth=0 2>&1 | grep -E "ERR|WARN"
```
**What to check:** No broken dependencies
**Why:** Outdated package info causes wrong implementation choices

### 6. Export Pattern Verification
```bash
grep -r "^export " src --include="*.ts" | head -5
```
**What to check:** Actual export patterns
**Why:** Naming/structure assumptions may be wrong

### 7. Import Pattern Check
```bash
grep -r "^import.*from.*src" src --include="*.ts" | head -5
```
**What to check:** Module boundaries and circular dependencies
**Why:** Wrong boundaries hide in stale docs

---

## Work Estimation Adjustment

**Rule:** If actual data differs from audit report by >20%, re-estimate work.

### Example: 'any' Type Reduction

**Audit Report (stale):** "535 'any' usages"
**Actual Command:** `grep -r ":\s*any" src/ --include="*.ts" | wc -l` → 11
**Difference:** 48x smaller than reported
**Action:** Reduce estimated effort from 40 hours to 4 hours

---

## Validation Results Template

```markdown
## Validation: [TASK_NAME] - [DATE]

### Actual Data
- Type errors: [N]
- Build status: [PASS/FAIL]
- Test status: [N passed, M failed]
- 'any' usages: [N]
- TODO/FIXME: [N]
- Files: [N] .ts files
- Dependencies: [OK/BROKEN]

### Audit Report vs. Reality
- Reported 'any': [X] → Actual: [Y] (Δ [%])
- Reported TODOs: [X] → Actual: [Y] (Δ [%])

### Planning Adjustment
- Original estimate: [X hours]
- Adjusted estimate: [Y hours] (reason: [data mismatch])
- Confidence: [HIGH/MEDIUM/LOW]

**Status:** ✅ Safe to proceed / ⚠️ Needs clarification / ❌ BLOCKED
```

---

## Integration with Planning Workflow

1. **Before Ralplan:** Run all 7 validation commands
2. **Before Executor:** Verify build and tests pass
3. **Before Estimation:** Compare actual vs. reported metrics
4. **During Planning:** Reference validation results, not audit reports

---

## Anti-Patterns

❌ "The audit says 535 'any' usages" → Run grep first
❌ "Tests should pass" → Run them before planning
❌ "No type errors" → Run tsc --noEmit
❌ "Dependencies are fine" → Run npm ls
❌ "We use X pattern everywhere" → Verify with grep

---

## When to Re-Validate

- Before starting any new feature planning
- After merging large PRs (>50 files)
- When audit reports are >1 week old
- If planning assumptions are questioned
- Before work estimation

---

## Success Criteria

✅ All 7 validation commands executed
✅ Actual data recorded in template
✅ Audit report vs. reality comparison done
✅ Work estimates adjusted if Δ > 20%
✅ Planning proceeds with real data, not assumptions
