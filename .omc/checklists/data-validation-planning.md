# Data Validation-First Planning Checklist (K005)

**Purpose:** Validate actual codebase state before planning, avoiding decisions based on stale audit reports.

---

## Pre-Planning Validation (Run Before Any Planning)

### 1. Type System Validation
```bash
tsc --noEmit
```
**Check:** Zero type errors
**Why:** Stale type info leads to wrong assumptions about interfaces

### 2. Build Verification
```bash
npm run build
```
**Check:** Build succeeds
**Why:** Broken builds hide actual code state

### 3. Test Baseline
```bash
npm test -- --run
```
**Check:** All tests pass
**Why:** Failing tests indicate incomplete features or regressions

### 4. File Structure Scan
```bash
find src -name "*.ts" | wc -l
grep -r "TODO:" src --include="*.ts" | wc -l
grep -r "FIXME:" src --include="*.ts" | wc -l
```
**Check:** Actual file count and incomplete items
**Why:** Audit reports may be outdated

### 5. Dependency Audit
```bash
npm ls --depth=0
```
**Check:** No broken dependencies
**Why:** Outdated package info causes wrong implementation choices

### 6. Code Pattern Verification
```bash
grep -r "export class\|export function\|export const" src --include="*.ts" | head -20
```
**Check:** Actual export patterns match project conventions
**Why:** Naming/structure assumptions may be wrong

### 7. Integration Points Check
```bash
grep -r "import.*from.*src" src --include="*.ts" | head -10
```
**Check:** Actual import patterns and module boundaries
**Why:** Circular dependencies or wrong boundaries hide in stale docs

---

## Validation Results Template

```markdown
## Validation Run: [DATE]

- [ ] Type check: PASS/FAIL (errors: ___)
- [ ] Build: PASS/FAIL
- [ ] Tests: PASS/FAIL (failures: ___)
- [ ] Files: ___ .ts files, ___ TODOs, ___ FIXMEs
- [ ] Dependencies: OK/BROKEN
- [ ] Export patterns: [observed pattern]
- [ ] Import patterns: [observed pattern]

**Conclusion:** Safe to proceed / BLOCKED until [issue] resolved
```

---

## When to Re-Validate

- Before starting any new feature planning
- After merging large PRs
- When audit reports are >1 week old
- If planning assumptions are questioned

---

## Anti-Pattern: Planning Without Validation

❌ "The docs say we use X pattern" → Run grep to verify
❌ "Tests should pass" → Run them first
❌ "No type errors" → Run tsc --noEmit
❌ "Dependencies are fine" → Run npm ls

**Rule:** Trust only what `tsc`, `npm`, and `grep` tell you right now.
