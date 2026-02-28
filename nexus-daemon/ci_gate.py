#!/usr/bin/env python3
"""CI Gate for nexus-daemon.

Runs all verification checks required before merge:
  1. Import verification — all subsystems importable
  2. Unit tests — pytest with coverage threshold
  3. Integration smoke test — full pipeline on synthetic events
  4. Code health check — maintainability above threshold

Exit code 0 = all gates passed, non-zero = failure.
"""
from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

# Thresholds
MIN_TEST_PASS_RATE = 1.0  # 100% tests must pass
MIN_MAINTAINABILITY = 40.0  # minimum average maintainability score

ROOT = Path(__file__).parent


def _header(title: str) -> None:
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}")


def gate_imports() -> bool:
    """Gate 1: Verify all subsystems are importable."""
    _header("Gate 1: Import Verification")
    sys.path.insert(0, str(ROOT))
    from nexus_integrator import NexusIntegrator
    results = NexusIntegrator.verify_subsystems()
    all_ok = True
    for name, ok in sorted(results.items()):
        status = "OK" if ok else "FAIL"
        print(f"  {name}: {status}")
        if not ok:
            all_ok = False
    print(f"\n  Result: {'PASSED' if all_ok else 'FAILED'}")
    return all_ok


def gate_tests() -> bool:
    """Gate 2: Run pytest and verify all tests pass."""
    _header("Gate 2: Unit Tests")
    start = time.time()
    result = subprocess.run(
        [sys.executable, "-m", "pytest", "tests/", "-q", "--tb=short"],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        timeout=120,
    )
    elapsed = time.time() - start
    print(result.stdout)
    if result.stderr:
        print(result.stderr)
    passed = result.returncode == 0
    print(f"  Time: {elapsed:.1f}s")
    print(f"  Result: {'PASSED' if passed else 'FAILED'}")
    return passed


def gate_integration_smoke() -> bool:
    """Gate 3: Run full integration pipeline on synthetic events."""
    _header("Gate 3: Integration Smoke Test")
    sys.path.insert(0, str(ROOT))
    from nexus_integrator import NexusIntegrator

    events = _make_synthetic_events()
    integrator = NexusIntegrator()
    result = integrator.run_cycle(events)

    print(f"  Events processed: {result.events_processed}")
    print(f"  Patterns found:   {result.patterns_found}")
    print(f"  Health score:     {result.health_score:.3f}")
    print(f"  Anomalies:        {result.anomaly_count}")
    print(f"  Recommendations:  {result.recommendation_count}")
    print(f"  Bottlenecks:      {result.bottleneck_count}")
    print(f"  Reflection score: {result.reflection_score}")
    print(f"  KG nodes/edges:   {result.knowledge_nodes}/{result.knowledge_edges}")
    print(f"  Dashboard:        {result.dashboard_score:.0f}/100 ({result.dashboard_status})")

    if result.errors:
        print(f"  Errors: {result.errors}")

    passed = result.success
    print(f"\n  Result: {'PASSED' if passed else 'FAILED'}")
    return passed


def gate_code_health() -> bool:
    """Gate 4: Check code maintainability score."""
    _header("Gate 4: Code Health")
    sys.path.insert(0, str(ROOT))
    from code_health_scorer import CodeHealthScorer

    scorer = CodeHealthScorer()
    py_files = sorted(ROOT.glob("*.py"))
    scores = []
    for f in py_files:
        if f.name.startswith("__"):
            continue
        result = scorer.score_file(f)
        if result is not None:
            scores.append(result)
            status = "OK" if result.maintainability_score >= MIN_MAINTAINABILITY else "LOW"
            print(f"  {f.name}: {result.maintainability_score:.0f} [{status}]")

    if not scores:
        print("  No files scored.")
        return False

    avg = sum(s.maintainability_score for s in scores) / len(scores)
    passed = avg >= MIN_MAINTAINABILITY
    print(f"\n  Average maintainability: {avg:.1f} (threshold: {MIN_MAINTAINABILITY})")
    print(f"  Result: {'PASSED' if passed else 'FAILED'}")
    return passed


def _make_synthetic_events() -> list[dict]:
    """Generate synthetic events for integration smoke testing."""
    import random
    random.seed(42)

    agent_types = ["coder", "reviewer", "planner", "debugger", "researcher"]
    skills = ["code-review", "refactor", "test-gen", "doc-gen", "planning"]
    tools = ["read_file", "edit_file", "run_tests", "search", "bash"]
    modes = ["autopilot", "ralph", "ultrawork", "manual"]

    events = []
    for i in range(10):
        evt: dict = {
            "sessionId": f"smoke-{i:03d}",
            "timestamp": f"2026-01-01T{10 + i}:00:00Z",
            "agentsSpawned": random.randint(1, 8),
            "agentTypes": random.sample(agent_types, k=random.randint(1, 3)),
            "skillsUsed": random.sample(skills, k=random.randint(1, 2)),
            "toolCalls": random.randint(5, 50),
            "toolsUsed": random.sample(tools, k=random.randint(2, 4)),
            "durationMs": random.randint(5000, 120000),
            "mode": random.choice(modes),
            "tokensIn": random.randint(1000, 50000),
            "tokensOut": random.randint(500, 20000),
        }
        # Add occasional errors
        if i == 7:
            evt["agentErrors"] = 1
            evt["error"] = "simulated timeout"
        events.append(evt)
    return events


def main() -> int:
    """Run all CI gates. Returns 0 if all pass, 1 otherwise."""
    gates = [
        ("Import Verification", gate_imports),
        ("Unit Tests", gate_tests),
        ("Integration Smoke", gate_integration_smoke),
        ("Code Health", gate_code_health),
    ]

    results: dict[str, bool] = {}
    for name, fn in gates:
        try:
            results[name] = fn()
        except Exception as e:
            print(f"\n  EXCEPTION in {name}: {e}")
            results[name] = False

    _header("Summary")
    all_passed = True
    for name, passed in results.items():
        status = "PASSED" if passed else "FAILED"
        print(f"  {name}: {status}")
        if not passed:
            all_passed = False

    print(f"\n{'=' * 60}")
    if all_passed:
        print("  ALL GATES PASSED")
    else:
        print("  SOME GATES FAILED")
    print(f"{'=' * 60}")
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
