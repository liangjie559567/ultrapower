---
name: Data Validation Priority Strategy
description: Verify actual codebase state before planning
type: workflow
knowledge_ref: K005
---

# Data Validation Priority Strategy (K005)

## Overview
Run grep/tsc commands to validate actual data before planning, avoiding outdated audit reports.

## When to Apply
- All planning tasks based on codebase state
- Before estimating work scope
- Before creating implementation plans

## Validation Commands

```bash
# Verify actual 'any' usage
grep -r ":\s*any" src/ --include="*.ts" | wc -l

# Verify TypeScript compilation state
tsc --noEmit

# Check for specific patterns
grep -r "TODO" src/ --include="*.ts"
grep -r "FIXME" src/ --include="*.ts"
```

## Key Benefits
- Avoids work estimation errors (prevented 9.7x error in this session)
- Plans based on real data, not assumptions
- Reduces rework and plan revisions
- Catches data inconsistencies early

## Implementation Pattern
1. Identify what needs verification
2. Run appropriate grep/tsc command
3. Record actual numbers
4. Base planning on verified data
5. Document assumptions vs. reality

## Verification
- Confidence: 95%
- Verified: Technical debt fix session (2026-03-17)
- Status: ✅ Verified
