---
name: Minimization Fix Principle
description: All fixes are minimal necessary changes without over-engineering
type: workflow
knowledge_ref: K009
---

# Minimization Fix Principle (K009)

## Overview
All fixes must be minimal necessary changes. No over-engineering, no refactoring unrelated code.

## Core Rules
1. Only modify necessary files
2. Only add necessary code
3. Avoid refactoring unrelated code
4. Maintain backward compatibility

## Implementation Guidelines

### What to Do
- Fix the specific bug
- Add minimal code to resolve issue
- Keep changes focused and scoped
- Preserve existing behavior

### What NOT to Do
- Refactor surrounding code
- Add "improvements" beyond scope
- Clean up unrelated code
- Add extra features

## Example
```typescript
// ❌ WRONG: Over-engineering
function processData(input: any) {
  // Refactored entire function
  // Added new error handling
  // Changed return type
  // Added logging
}

// ✅ CORRECT: Minimal fix
function processData(input: any) {
  // Only fix the specific bug
  if (!input) return null;
  return process(input);
}
```

## Benefits
- Reduces risk of introducing new bugs
- Easier code review
- Smaller test scope
- Faster deployment

## Verification
- Confidence: 95%
- Verified: 6 bug fixes (2026-03-18)
- Status: ✅ Verified
