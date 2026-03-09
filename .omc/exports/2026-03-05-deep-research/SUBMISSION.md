# Claude Code Marketplace Submission

## Plugin Information

**Name:** ultrapower
**Display Name:** ultrapower
**npm Package:** @liangjie559567/ultrapower
**Version:** 5.5.18
**Author:** liangjie559567
**License:** MIT

**Repository:** <<https://github.com/liangjie559567/ultrapower>>
**Homepage:** <<https://github.com/liangjie559567/ultrapower#readme>>

## Description

**Short Description (English):**
Disciplined multi-agent orchestration: workflow enforcement + parallel execution

**Full Description (English):**
ultrapower is an intelligent multi-agent orchestration layer (OMC) for Claude Code, deeply integrating the Axiom framework with superpowers workflow. It provides 50 professional agents, 71 skills, and a complete TypeScript hooks system.

Core capabilities:

* Multi-agent orchestration with Team, ultrawork, ralph, and autopilot execution modes

* Axiom framework integration with LSP/AST code intelligence, persistent memory, and MCP routing

* End-to-end development workflow from brainstorming to code review

* Auto-triggered skills that activate based on context without manual invocation

**Full Description (中文):**
ultrapower 是 Claude Code 的智能多 Agent 编排层（OMC），在 superpowers 工作流基础上深度融合了 Axiom 框架，提供 50 个专业 agents、71 个 skills 和完整的 TypeScript hooks 系统。

核心能力：

* 多 Agent 编排：Team、ultrawork、ralph、autopilot 等多种执行模式

* Axiom 框架集成：LSP/AST 代码智能、持久记忆、MCP 路由

* 完整工作流：从头脑风暴到代码审查的端到端开发流程

* 自动触发：Skills 根据上下文自动激活，无需手动调用

## Keywords

claude, claude-code, ai, agent, multi-agent, orchestration, omc, claudecode, anthropic, llm, workflow, automation, typescript, hooks, axiom

## Installation

```bash
/plugin marketplace add <<https://github.com/liangjie559567/ultrapower>>
/plugin install ultrapower
/omc-setup
```

## Key Features

### 50 Professional Agents

* **Build/Analysis:** explore, analyst, planner, architect, debugger, executor, deep-executor, verifier

* **Review Pipeline:** style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer

* **Domain Experts:** dependency-expert, test-engineer, quality-strategist, build-fixer, designer, writer, qa-tester, scientist, git-master, database-expert, devops-engineer

* **Axiom Agents:** axiom-requirement-analyst, axiom-product-designer, axiom-review-aggregator, axiom-prd-crafter, axiom-system-architect, axiom-evolution-engine

### 71 Skills

Including: autopilot, ralph, ultrawork, team, pipeline, brainstorming, writing-plans, executing-plans, subagent-driven-development, test-driven-development, systematic-debugging, verification-before-completion, requesting-code-review, using-git-worktrees, finishing-a-development-branch, and 56+ more specialized skills.

### Axiom Framework

* LSP/AST code intelligence

* Persistent memory system

* MCP routing and integration

* Evolution engine for continuous improvement

## Support

* Issues: <<https://github.com/liangjie559567/ultrapower/issues>>

* Documentation: <<https://github.com/liangjie559567/ultrapower#readme>>

## Submission Checklist

* [x] npm package published: @liangjie559567/ultrapower@5.5.18

* [x] GitHub repository public and accessible

* [x] marketplace.json configured

* [x] plugin.json configured

* [x] README with installation instructions

* [x] LICENSE file (MIT)

* [x] All metadata synchronized (version, name, description)

---

## Improvement Recommendations & Optimization Roadmap

**Analysis Date:** 2026-03-05
**Based on:** Comprehensive architecture analysis, critic review, circular dependency audit, build pipeline analysis

### Executive Summary

ultrapower is a mature multi-agent orchestration system with 50 agents, 71 skills, and comprehensive TypeScript infrastructure. Key strengths include event-driven hooks, staged pipeline execution, and self-evolution capabilities. This roadmap prioritizes improvements by impact and implementation cost.

---

### P0 - Critical Improvements (Immediate Action Required)

#### 1. Security Hardening

**Impact:** High | **Effort:** Medium | **Timeline:** 1-2 weeks

* **Issue:** Permission-request hook currently uses silent fallback instead of blocking

* **Risk:** Potential unauthorized operations in sensitive contexts

* **Solution:** Implement `{ continue: false }` enforcement per `docs/standards/runtime-protection.md`

* **Deliverable:** Update `src/hooks/permission-request/index.ts` with strict blocking mode

#### 2. Hook Timeout Implementation

**Impact:** High | **Effort:** Low | **Timeline:** 3-5 days

* **Issue:** PreToolUse (5s) and PostToolUse (5s) timeout configs exist but not enforced

* **Risk:** Blocking operations can hang indefinitely

* **Solution:** Add timeout wrapper in `src/hooks/bridge.ts`

* **Deliverable:** Timeout enforcement with graceful degradation

#### 3. Test Coverage Enhancement

**Impact:** High | **Effort:** High | **Timeline:** 2-3 weeks

* **Current:** 5782 passing tests, 99.98% pass rate

* **Gap:** Axiom workflows have only 1 test file, Team Pipeline transitions lack coverage

* **Solution:** Add integration tests for:
  - Team Pipeline phase transitions (plan → prd → exec → verify → fix)
  - Axiom 4-stage workflow (draft → review → decompose → implement)
  - Hook priority chain execution

* **Deliverable:** Coverage increase from current baseline to 85%+ for core modules

---

### P1 - High-Value Optimizations (Next Quarter)

#### 4. Performance Optimization

**Impact:** Medium-High | **Effort:** Medium | **Timeline:** 2-3 weeks

**4.1 Build Pipeline Parallelization**

* **Current:** 6 esbuild tasks run serially (tsc → skill-bridge → mcp-server → codex → gemini → team-bridge)

* **Opportunity:** Tasks 2-6 are independent after tsc completes

* **Solution:** Use `Promise.all()` for parallel esbuild execution

* **Expected Gain:** 40-50% build time reduction

**4.2 State Query Indexing**

* **Current:** `state_list_active` traverses all session directories

* **Opportunity:** Add index file `.omc/state/active-sessions.json`

* **Solution:** Update on state_write, read on list_active

* **Expected Gain:** O(n) → O(1) for active session queries

**4.3 LSP Client Prewarming**

* **Current:** Language servers start on first use

* **Opportunity:** Preload TypeScript/Python LSP on project open

* **Solution:** Background initialization in `src/tools/lsp/manager.ts`

* **Expected Gain:** 2-3s faster first hover/definition request

#### 5. Architecture Refactoring

**Impact:** Medium | **Effort:** High | **Timeline:** 3-4 weeks

**5.1 Unified Worker Backend**

* **Current:** Separate handling for Claude native, MCP Codex, MCP Gemini

* **Opportunity:** Abstract to common Worker interface

* **Solution:** Create `src/team/worker-interface.ts` with unified API

* **Benefit:** Simplified routing, easier to add new providers

**5.2 Swarm State Migration**

* **Current:** Swarm uses SQLite (`swarm.db`), incompatible with session isolation

* **Opportunity:** Migrate to JSON + atomic writes like other modes

* **Solution:** Create migration script, update `src/workflows/swarm/state.ts`

* **Benefit:** Consistent state management, session isolation support

---

### P2 - Quality of Life Improvements (Backlog)

#### 6. Developer Experience

**Impact:** Medium | **Effort:** Low-Medium | **Timeline:** 1-2 weeks

**6.1 Heartbeat Cleanup**

* **Issue:** MCP worker heartbeat files accumulate indefinitely

* **Solution:** Auto-cleanup files older than 7 days in `src/team/heartbeat.ts`

**6.2 AST Tool Auto-Install**

* **Issue:** `@ast-grep/napi` missing causes silent degradation

* **Solution:** Add optional dependency check + installation prompt

**6.3 Architecture Decision Records**

* **Issue:** Key design decisions (session isolation, atomic writes) undocumented

* **Solution:** Create `docs/adr/` with 5-10 core ADRs

#### 7. Documentation Enhancement

**Impact:** Low-Medium | **Effort:** Medium | **Timeline:** 1-2 weeks

* Generate API docs from TypeScript types using TypeDoc

* Add troubleshooting guide for common issues (state leaks, hook failures, MCP connection)

* Create performance baseline report for future comparison

---

### Implementation Priority Matrix

```
High Impact │ P0-1 Security    │ P0-2 Timeouts   │ P1-4 Performance │
            │ P0-3 Tests       │                 │                  │
────────────┼──────────────────┼─────────────────┼──────────────────┤
Medium      │ P1-5 Arch        │ P2-6 DevEx      │                  │
Impact      │                  │                 │                  │
────────────┼──────────────────┼─────────────────┼──────────────────┤
Low Impact  │                  │ P2-7 Docs       │                  │
            │                  │                 │                  │
────────────┴──────────────────┴─────────────────┴──────────────────
             Low Effort         Medium Effort     High Effort
```

---

### Cost-Benefit Analysis

| Priority | Total Effort | Expected ROI | Key Metrics |
| ---------- | ------------- | -------------- | ------------- |
| P0 | 4-6 weeks | Very High | Security compliance, stability, test confidence |
| P1 | 5-7 weeks | High | 40% faster builds, simplified architecture |
| P2 | 2-4 weeks | Medium | Better DX, reduced support burden |

**Total Investment:** 11-17 weeks (3-4 months)
**Expected Outcomes:**

* 100% security compliance with runtime-protection standards

* 85%+ test coverage for core modules

* 40-50% build time reduction

* Unified worker architecture for easier extensibility

---

### Risk Mitigation

**High-Risk Items:**
1. **Swarm Migration (P1-5.2):** Requires data migration script, potential user impact
   - Mitigation: Provide backward compatibility layer, clear migration guide
1. **Test Coverage (P0-3):** Large effort, may uncover hidden bugs
   - Mitigation: Incremental approach, fix bugs as discovered

**Dependencies:**

* P0 items block marketplace submission approval

* P1-5 (Architecture) should precede P2 items to avoid rework

---

### Next Steps

1. **Immediate (Week 1-2):** Address P0-1 (Security) and P0-2 (Timeouts)
2. **Short-term (Week 3-6):** Complete P0-3 (Test Coverage)
3. **Medium-term (Month 2-3):** Execute P1 optimizations
4. **Long-term (Month 4+):** P2 quality improvements

**Success Criteria:**

* All P0 items completed before v6.0.0 release

* Performance benchmarks show 30%+ improvement in key metrics

* Zero critical security findings in audit

* Test suite execution time < 5 minutes

---

**Report Generated:** 2026-03-05
**Analysis Sources:**

* `.omc/research/comprehensive-analysis.md`

* `.omc/axiom/review_critic.md`

* `.omc/circular-deps-analysis.md`

* `.omc/scientist/reports/20260228_build_pipeline_analysis.md`

---

## Comprehensive Technical Analysis Report

### Executive Summary

ultrapower v5.5.18 is a sophisticated multi-agent orchestration system with strong technical foundations. Based on comprehensive analysis including UX, Product, Critic, and Domain Expert reviews, the project demonstrates:

**Strengths:**

* ✅ Complete multi-agent orchestration (Team/ultrawork/ralph/autopilot)

* ✅ Deep MCP integration (Codex/Gemini)

* ✅ Rich code intelligence tools (12 LSP + AST + Python REPL)

* ✅ Well-structured TypeScript architecture

* ✅ Comprehensive hook system (15 types)

**Key Findings:**

* ⚠️ Test coverage needs improvement (target: 80%+ for core modules)

* ⚠️ Performance metrics need quantification (P50/P95/P99 latency)

* ⚠️ MCP protocol version compatibility requires validation

* ⚠️ Agent coordination complexity needs optimization

**Expert Review Consensus:**

* **Strategic Value:** Medium (6/10) - Strong technical capability, needs clearer business goals

* **Feasibility:** Medium (4/10) - Scope too broad, requires focus on core areas

* **Risk Level:** Medium - P0 security risks manageable with proper mitigation

* **Recommendation:** REVISE - Requires refinement before full implementation

---

### Architecture Analysis

#### 1. Multi-Agent Orchestration

**Team Mode** (Recommended):
```
team-plan → team-prd → team-exec → team-verify → team-fix (loop)
```

* Phase-aware agent routing

* State persistence and recovery

* Supports combination with ralph mode

**Execution Modes:**

* **ultrawork**: Maximum parallelism for independent tasks

* **ralph**: Self-referential loop with verifier validation

* **autopilot**: Fully autonomous execution from idea to code

**Lifecycle Management:**

* Timeout handling: explore (15min), executor (30min), writer (45min)

* Orphan detection and cleanup

* Deadlock monitoring

* Cost limit enforcement

#### 2. MCP Integration Architecture

**Three MCP Servers:**
1. **omc-tools-server**: 35 custom tools (LSP/AST/State)
2. **codex-server**: OpenAI Codex integration for analysis/review
3. **gemini-server**: Google Gemini with 1M token context

**Communication:**

* Protocol: MCP 1.26.0

* Transport: stdio/WebSocket

* Serialization: JSON-RPC 2.0

#### 3. Hook System

**15 Hook Types** per `docs/standards/hook-execution-order.md`:

* session-start/end, tool-call/response, message-send

* permission-request, setup, error, state-change

* agent-spawn/complete, skill-trigger, mode-enter/exit

**Security:**

* Path traversal protection via `assertValidMode()`

* Input sanitization through `bridge-normalize.ts`

* Whitelist-based field filtering

#### 4. Code Intelligence Tools

**LSP Tools (12):**

* hover, goto_definition, find_references

* document_symbols, workspace_symbols

* diagnostics, rename, code_actions

**AST Tools:**

* ast_grep_search: Structural code search

* ast_grep_replace: Structural transformations

* Supports 17 languages with meta-variables

**Python REPL:**

* Persistent sessions with variable retention

* Memory tracking (RSS/VMS)

* 5-minute default timeout

---

### Expert Review Synthesis

#### UX Director Findings

**Structure Issues:**

* ❌ Missing quick navigation (200+ line docs without TOC)

* ❌ Key information buried (success criteria should be upfront)

* ❌ Duplicate content (analysis methods repeated)

**Recommendations:**

* Add interactive table of contents

* Restructure chapter order for better flow

* Use visual hierarchy (emoji, color markers)

#### Product Director Findings

**Strategic Alignment:**

* ❌ Lacks clear business objectives

* ❌ No quantified success metrics

* ❌ Disconnected from user value

**Priority Issues:**

* ❌ All 7 domains treated equally (no differentiation)

* ❌ Resources scattered (40% on low-ROI items)

* ❌ Missing critical path identification

**Recommended Focus:**
```
P0 (60% resources):
1. Test coverage and quality
2. Agent orchestration system

P1 (30% resources):
1. MCP integration architecture
2. Hook system implementation

P2 (10% resources):
1. CLI/Skills/Custom tools

Delete:

* Horizontal comparisons (academic > practical value)

* External research (time-consuming, low ROI)
```

#### Critic Findings

**Security Risks (P0):**

* ⚠️ External search may leak project details

* ⚠️ Hook execution has code injection risk

* ⚠️ MCP integration involves sensitive configs

**Edge Cases (P1):**

* ⚠️ Parallel agents may deadlock

* ⚠️ Large codebase analysis may timeout

* ⚠️ API quota may be exhausted

* ⚠️ External dependencies may be unavailable

**Logic Consistency (P2):**

* ❌ Success criteria lack quality thresholds

* ❌ Time estimates unrealistic (should be 13-18 days)

* ❌ Team role overlap

* ❌ Comparison scope too broad

#### Domain Expert Findings

**Industry Standards:**

* ✅ Multi-agent coordination follows mainstream patterns

* ✅ State management design is sound

* ⚠️ Missing agent communication protocol standardization

* ⚠️ Missing fault tolerance mechanism comparison

* ❌ MCP protocol version compatibility not assessed

**Comparison Gaps:**

* ⚠️ Missing cost model (token consumption)

* ⚠️ Missing debugging experience comparison

* ❌ External sources too vague

**Methodology:**

* ✅ Static code analysis methods complete

* ⚠️ Architecture assessment lacks quantitative metrics

* ✅ Test analysis comprehensive

* ❌ External research lacks specific sources

---

### Quality Metrics

#### Current State

| Metric | Value | Target |
| -------- | ------- | -------- |
| Test Pass Rate | 99.98% (5782 tests) | Maintain |
| Core Module Coverage | To be measured | 80%+ |
| Agent Count | 50 | - |
| Skill Count | 71 | - |
| Hook Types | 15 | - |
| LSP Tools | 12 | - |
| MCP Tools | 35 | - |
| Code Lines | 5000+ | - |

#### Performance Targets

**To be established:**

* Agent orchestration latency: P50/P95/P99

* MCP tool call throughput

* State file I/O performance

* Memory usage peaks

---

### Technology Stack

**Core Dependencies:**

* `@anthropic-ai/claude-agent-sdk`: ^0.1.0

* `@modelcontextprotocol/sdk`: ^1.26.0

* `@ast-grep/napi`: ^0.31.0

* `better-sqlite3`: ^12.6.2

* `commander`: ^12.1.0

* `zod`: ^3.23.8

**Development:**

* TypeScript 5.7.2

* Vitest 4.0.17

* ESLint 9.17.0

* esbuild 0.27.2

**Runtime:**

* Node.js >=20.0.0

---

### Improvement Roadmap Summary

#### Phase 1: Quality Baseline (2-3 weeks)

* Test coverage to 80%+

* Performance benchmarking

* MCP compatibility validation

* Security audit (Hook system)

#### Phase 2: Performance Optimization (2-3 weeks)

* Agent orchestration latency optimization

* Token consumption optimization

* State file I/O optimization

* Memory leak fixes

#### Phase 3: Observability (1-2 weeks)

* Trace visualization

* State snapshots

* Time-travel debugging

* OpenTelemetry integration

#### Phase 4: Documentation & Ecosystem (1-2 weeks)

* API documentation generation

* Architecture decision records

* Contribution guide updates

* Example projects

**Total Timeline:** 7-10 weeks
**Expected Outcomes:**

* 80%+ test coverage

* 30% performance improvement

* Complete observability tooling

* Comprehensive documentation

---

### Risk Assessment

**High Priority Risks:**
1. **Parallel Agent Deadlock** - Mitigation: Resource isolation, timeout enforcement
2. **MCP Version Incompatibility** - Mitigation: Compatibility testing, upgrade path
3. **Test Coverage Gaps** - Mitigation: Incremental test addition, bug fixes

**Medium Priority Risks:**
1. **Performance Bottlenecks** - Mitigation: Profiling, optimization
2. **External Dependency Failures** - Mitigation: Fallback strategies, retry logic

**Low Priority Risks:**
1. **Documentation Gaps** - Mitigation: Continuous documentation updates

---

### Conclusion

ultrapower demonstrates strong technical foundations with comprehensive multi-agent orchestration capabilities. The project is well-positioned for marketplace submission after addressing P0 improvements:

**Must Complete Before Submission:**
1. Security hardening (permission-request blocking)
2. Hook timeout enforcement
3. Test coverage enhancement (85%+ core modules)

**Recommended for Quality:**
1. Performance optimization (40% build time reduction)
2. Architecture refactoring (unified worker backend)
3. Developer experience improvements

**Long-term Vision:**
1. Enhanced observability
2. Comprehensive documentation
3. Community ecosystem growth

The project's modular architecture, extensive tooling, and clear separation of concerns provide a solid foundation for future enhancements. With focused execution on the prioritized roadmap, ultrapower can achieve production-ready quality standards.

---

**Analysis Completed:** 2026-03-05T08:26:00Z
**Report Version:** 1.0
**Status:** Complete
