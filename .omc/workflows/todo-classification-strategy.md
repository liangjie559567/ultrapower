---
name: TODO Classification Strategy
description: Distinguish functional keywords from real TODOs
type: workflow
knowledge_ref: K006
---

# TODO Classification Strategy (K006)

## Overview
Distinguish functional keywords (e.g., TODO LIST system) from real TODO items to avoid deleting functional code.

## When to Apply
- Technical debt cleanup
- Code audits
- Refactoring sessions

## Classification Process

### Step 1: Search All TODOs
```bash
grep -r "TODO" src/ --include="*.ts"
```

### Step 2: Check Context
For each TODO found, examine:
- Is it a class name? (e.g., `TodoListSystem`)
- Is it a variable name? (e.g., `todoItems`)
- Is it a comment explaining functionality?
- Is it a real pending task?

### Step 3: Categorize
- **Functional Keywords**: Keep (part of code functionality)
- **Real TODOs**: Clean up or convert to issues

## Key Benefits
- Avoids breaking functional code
- Accurately identifies real technical debt
- Reduces deletion risk
- Improves code quality

## Example
```typescript
// KEEP: Functional keyword in class name
class TodoListSystem {
  todoItems: Todo[];
}

// REMOVE: Real TODO comment
// TODO: refactor this function
function processData() { }
```

## Verification
- Confidence: 85%
- Verified: 51 TODOs found, only 1 real TODO (2026-03-17)
- Status: ✅ Verified
