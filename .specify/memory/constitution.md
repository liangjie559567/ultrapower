# ultrapower Constitution
<!-- Multi-Agent Orchestration Framework -->

## Core Principles

### I. Agent-First Architecture
Every feature is implemented through specialized agents with clear responsibilities. Agents must be self-contained, independently testable, and documented with their tool access matrix.

### II. Skill-Based Workflow
Complex workflows are composed of reusable skills. Skills define trigger patterns, agent delegation, and output formats. Each skill must have a SKILL.md with clear usage examples.

### III. Type Safety & Validation
TypeScript strict mode enforced. All external inputs validated with Zod schemas. Runtime type checks at system boundaries (hooks, MCP tools, state files).

### IV. Security & Path Safety
All file paths validated with assertValidMode/assertValidSessionId. No direct path concatenation. Hook inputs sanitized through whitelist filtering.

### V. Minimal Code Principle
Write only the absolute minimal code needed. Avoid verbose implementations, unnecessary abstractions, and code that doesn't directly contribute to the solution.

## Technology Stack

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 18+
- **Package Manager**: npm
- **Testing**: Vitest
- **Validation**: Zod
- **Build**: tsc + parallel build scripts

## Development Workflow

1. All changes must pass `npm run build` and `npm test`
2. Security fixes require code review by security-reviewer agent
3. New agents/skills must update corresponding AGENTS.md files
4. Breaking changes require migration guide in CHANGELOG.md

## Governance

This constitution supersedes all other practices. All PRs must verify compliance with these principles. Complexity must be justified with clear reasoning.

**Version**: 1.0.0 | **Ratified**: 2026-03-12 | **Last Amended**: 2026-03-12
