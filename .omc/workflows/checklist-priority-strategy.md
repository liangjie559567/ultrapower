---
name: Checklist Priority Strategy
description: Create checklists before implementing best practices
type: workflow
knowledge_ref: K015
---

# Checklist Priority Strategy (K015)

## Overview
When applying knowledge base items, create checklists/review reports first, then implement code changes.

## Workflow

### Step 1: Analyze Knowledge Base
- Extract actionable rules from knowledge entries
- Identify all applicable items
- Note dependencies and prerequisites

### Step 2: Create Checklist
- Document in `.omc/checklists/` or `.omc/workflows/`
- List all verification points
- Include acceptance criteria
- Add verification commands

### Step 3: Implement Based on Checklist
- Follow checklist items sequentially
- Mark items as completed
- Document any deviations

### Step 4: Verify Completion
- Confirm all checklist items satisfied
- Run verification commands
- Document results

## Example Checklist
```markdown
# Implementation Checklist

- [ ] K002: Git rebase workflow documented
- [ ] K004: Ralplan consensus process verified
- [ ] K005: Data validation strategy applied
- [ ] K006: TODO classification completed
- [ ] K009: Minimization principle reviewed
- [ ] K013: Hook validation pattern verified
- [ ] K015: Checklist strategy applied

## Verification
- [ ] All items documented
- [ ] No items skipped
- [ ] Tests passing
```

## Benefits
- Prevents missing critical steps
- Provides traceable application record
- Enables future review and improvement
- Ensures systematic coverage

## Verification
- Confidence: 85%
- Verified: 7 checklists guided implementation (2026-03-18)
- Status: ✅ Verified
