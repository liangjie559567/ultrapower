---
name: Git Rebase Workflow Documentation
description: Linear history maintenance using rebase strategy
type: workflow
knowledge_ref: K002
---

# Git Rebase Workflow (K002)

## Overview
Maintain linear git history using rebase instead of merge commits when remote branch is ahead.

## Command
```bash
git pull --rebase origin main
```

## When to Use
- Remote branch has new commits
- Local branch has unpushed commits
- Want to avoid merge commits

## Benefits
- Avoids merge commits
- Keeps history clean and linear
- Easier code review and bisect
- Clearer commit timeline

## Implementation
```bash
# Before pushing, rebase on latest remote
git pull --rebase origin main

# If conflicts occur
git rebase --continue  # after resolving conflicts
git rebase --abort     # to cancel rebase

# Push rebased commits
git push origin <branch>
```

## Verification
- Confidence: 90%
- Verified: v7.5.2 release (2026-03-15)
- Status: ✅ Verified
