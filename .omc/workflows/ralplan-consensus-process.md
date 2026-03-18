---
name: Ralplan Consensus Process Verification
description: Multi-expert consensus workflow for complex planning
type: workflow
knowledge_ref: K004
---

# Ralplan Consensus Process (K004)

## Overview
Planner creates initial plan, then Architect and Critic review in parallel to catch data inconsistencies and architectural flaws.

## Applicable Scenarios
- Complex technical debt fixes
- Large refactors
- Architecture changes
- High-risk decisions

## Process Flow

### Stage 1: Initial Plan (v1.0)
- Planner creates comprehensive plan
- Includes scope, timeline, risks

### Stage 2: Parallel Review
- **Architect**: Reviews architectural soundness (scores 7-10)
- **Critic**: Reviews quality standards (pass/reject)

### Stage 3: Consensus Loop
- If Critic rejects: Planner revises to v2.0
- Maximum 5 iterations until consensus
- Both Architect and Critic must approve

## Key Benefits
- Early detection of data inconsistencies (e.g., outdated audit reports)
- Captures architectural flaws and risks
- Prevents plans based on wrong assumptions
- Reduces rework and plan revisions

## Verification
- Confidence: 90%
- Verified: Technical debt fix session (2026-03-17)
- Status: ✅ Verified
