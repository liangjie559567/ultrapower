---
name: review
description: Alias for /plan --review
---

# Review (Plan Review Alias)

Review is a shorthand alias for `/ultrapower:plan --review`. It triggers Critic evaluation of an existing plan.

## Usage

```
/ultrapower:review
/ultrapower:review "path/to/plan.md"
```

## Behavior

This skill invokes the Plan skill in review mode:

```
/ultrapower:plan --review <arguments>
```

The review workflow:
1. Read plan file from `.omc/plans/` (or specified path)
2. Evaluate via Critic agent
3. Return verdict: APPROVED, REVISE (with specific feedback), or REJECT (replanning required)

Follow the Plan skill's full documentation for review mode details.
