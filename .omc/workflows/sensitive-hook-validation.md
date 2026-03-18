---
name: Sensitive Hook Validation Pattern
description: Enforce full Zod validation for security-critical hooks
type: workflow
knowledge_ref: K013
---

# Sensitive Hook Validation Pattern (K013)

## Overview
Sensitive hooks must use complete Zod validation path, skipping fast path shortcuts.

## Sensitive Hook Types
- `permission-request`
- `setup`
- `session-end`

## Implementation Pattern

```typescript
// bridge-normalize.ts
const SENSITIVE_HOOKS = new Set([
  'permission-request',
  'setup',
  'session-end'
]);

if (SENSITIVE_HOOKS.has(hookType)) {
  // Force complete validation, skip fast path
  return fullZodValidation(input);
}
```

## Validation Requirements
1. Complete schema validation
2. No shortcuts or fast paths
3. All fields must be verified
4. Type safety enforced

## Key Benefits
- Prevents injection attacks
- Ensures critical path data integrity
- Provides audit trail
- Protects sensitive operations

## When to Apply
- Permission requests
- Setup operations
- Session lifecycle events
- Any security-critical hooks

## Verification
- Confidence: 95%
- Verified: Security hardening (2026-03-17)
- Status: ✅ Verified
