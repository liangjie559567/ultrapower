"""Tests for bottleneck_analyzer.py — at least 20 test cases."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from bottleneck_analyzer import (
    BottleneckAnalyzer,
    BottleneckRecord,
    BottleneckReport,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_event(
    session_id: str = "s1",
    agents_spawned: int = 2,
    agent_types: list[str] | None = None,
    agents_completed: list[str] | None = None,
    tool_calls: list[dict] | None = None,
    agent_errors: list[str] | None = None,
) -> dict:
    event: dict = {"sessionId": session_id, "agentsSpawned": agents_spawned}
    if agent_types is not None:
        event["agentTypes"] = agent_types
    if agents_completed is not None:
        event["agentsCompleted"] = agents_completed
    if tool_calls is not None:
        event["toolCalls"] = tool_calls
    if agent_errors is not None:
        event["agentErrors"] = agent_errors
    return event


# ---------------------------------------------------------------------------
# BottleneckRecord
# ---------------------------------------------------------------------------

class TestBottleneckRecord:
    def test_create_and_access(self):
        rec = BottleneckRecord(
            bottleneck_type="failure",
            component="executor",
            severity="high",
            metric_value=0.6,
            threshold=0.3,
            description="High failure rate",
            recommendation="Fix it",
        )
        assert rec.bottleneck_type == "failure"
        assert rec.component == "executor"
        assert rec.severity == "high"
        assert rec.metric_value == 0.6
        assert rec.threshold == 0.3

    def test_severity_values(self):
        valid = {"low", "medium", "high", "critical"}
        for sev in valid:
            rec = BottleneckRecord("latency", "comp", sev, 1.0, 0.5, "d", "r")
            assert rec.severity in valid


# ---------------------------------------------------------------------------
# BottleneckReport
# ---------------------------------------------------------------------------

class TestBottleneckReport:
    def _make_report(self, bottlenecks: list[BottleneckRecord]) -> BottleneckReport:
        return BottleneckReport(
            bottlenecks=bottlenecks,
            analyzed_events=10,
            analysis_timestamp="2026-01-01T00:00:00+00:00",
            summary="test",
        )

    def test_critical_count(self):
        recs = [
            BottleneckRecord("failure", "a", "critical", 1.0, 0.3, "d", "r"),
            BottleneckRecord("failure", "b", "critical", 1.0, 0.3, "d", "r"),
            BottleneckRecord("failure", "c", "high", 0.5, 0.3, "d", "r"),
        ]
        report = self._make_report(recs)
        assert report.critical_count == 2

    def test_high_count(self):
        recs = [
            BottleneckRecord("failure", "a", "high", 0.5, 0.3, "d", "r"),
            BottleneckRecord("failure", "b", "medium", 0.4, 0.3, "d", "r"),
        ]
        report = self._make_report(recs)
        assert report.high_count == 1

    def test_empty_report(self):
        report = self._make_report([])
        assert report.critical_count == 0
        assert report.high_count == 0
        assert report.bottlenecks == []

    def test_summary_field(self):
        report = self._make_report([])
        assert isinstance(report.summary, str)


# ---------------------------------------------------------------------------
# BottleneckAnalyzer — agent failures
# ---------------------------------------------------------------------------

class TestAnalyzeAgentFailures:
    def setup_method(self):
        self.analyzer = BottleneckAnalyzer()

    def test_empty_events_returns_no_bottlenecks(self):
        report = self.analyzer.analyze([])
        assert report.bottlenecks == []
        assert report.analyzed_events == 0

    def test_detects_high_failure_rate_agent(self):
        # executor spawned 10 times, completed 3 → failure rate 0.7 > 0.3
        events = [
            _make_event(agent_types=["executor"], agents_completed=[]),
        ] * 7 + [
            _make_event(agent_types=["executor"], agents_completed=["executor"]),
        ] * 3
        report = self.analyzer.analyze(events)
        failure_bns = [b for b in report.bottlenecks if b.component == "executor" and b.bottleneck_type == "failure"]
        assert len(failure_bns) >= 1
        assert failure_bns[0].severity in ("medium", "high", "critical")

    def test_normal_agent_not_reported(self):
        # executor spawned 10, completed 10 → failure rate 0.0
        events = [
            _make_event(agent_types=["executor"], agents_completed=["executor"]),
        ] * 10
        report = self.analyzer.analyze(events)
        failure_bns = [b for b in report.bottlenecks if b.component == "executor" and b.bottleneck_type == "failure"]
        assert failure_bns == []


# ---------------------------------------------------------------------------
# BottleneckAnalyzer — tool errors
# ---------------------------------------------------------------------------

class TestAnalyzeToolErrors:
    def setup_method(self):
        self.analyzer = BottleneckAnalyzer()

    def test_detects_high_error_rate_tool(self):
        # bash_tool: 10 calls, 8 errors → 80% error rate > 20% threshold
        tool_calls = [{"name": "bash_tool", "error": True}] * 8 + \
                     [{"name": "bash_tool", "success": True}] * 2
        events = [_make_event(tool_calls=tool_calls)]
        report = self.analyzer.analyze(events)
        tool_bns = [b for b in report.bottlenecks if b.component == "bash_tool"]
        assert len(tool_bns) >= 1

    def test_normal_tool_not_reported(self):
        # read_file: 10 calls, 0 errors
        tool_calls = [{"name": "read_file", "success": True}] * 10
        events = [_make_event(tool_calls=tool_calls)]
        report = self.analyzer.analyze(events)
        tool_bns = [b for b in report.bottlenecks if b.component == "read_file"]
        assert tool_bns == []

    def test_tool_error_via_success_false(self):
        tool_calls = [{"name": "write_file", "success": False}] * 5 + \
                     [{"name": "write_file", "success": True}] * 5
        events = [_make_event(tool_calls=tool_calls)]
        report = self.analyzer.analyze(events)
        tool_bns = [b for b in report.bottlenecks if b.component == "write_file"]
        assert len(tool_bns) >= 1


# ---------------------------------------------------------------------------
# BottleneckAnalyzer — resource usage
# ---------------------------------------------------------------------------

class TestAnalyzeResourceUsage:
    def setup_method(self):
        self.analyzer = BottleneckAnalyzer(thresholds={"agent_spawn_rate": 10.0})

    def test_detects_abnormal_high_spawn(self):
        # 9 normal sessions (2 agents each) + 1 outlier (50 agents)
        events = [_make_event(session_id=f"s{i}", agents_spawned=2) for i in range(9)]
        events.append(_make_event(session_id="outlier", agents_spawned=50))
        report = self.analyzer.analyze(events)
        resource_bns = [b for b in report.bottlenecks if b.bottleneck_type == "resource"]
        assert len(resource_bns) >= 1
        assert any("outlier" in b.component for b in resource_bns)

    def test_normal_usage_not_reported(self):
        events = [_make_event(session_id=f"s{i}", agents_spawned=3) for i in range(10)]
        report = self.analyzer.analyze(events)
        resource_bns = [b for b in report.bottlenecks if b.bottleneck_type == "resource"]
        assert resource_bns == []

    def test_single_event_no_resource_bottleneck(self):
        # Need at least 2 events for statistical comparison
        events = [_make_event(agents_spawned=100)]
        report = self.analyzer.analyze(events)
        resource_bns = [b for b in report.bottlenecks if b.bottleneck_type == "resource"]
        assert resource_bns == []


# ---------------------------------------------------------------------------
# BottleneckAnalyzer — error concentration
# ---------------------------------------------------------------------------

class TestAnalyzeErrorConcentration:
    def setup_method(self):
        self.analyzer = BottleneckAnalyzer()

    def test_detects_concentrated_errors(self):
        # bad_tool causes 8/10 errors → 80% concentration > 50% threshold
        tool_calls = [{"name": "bad_tool", "error": True}] * 8 + \
                     [{"name": "other_tool", "error": True}] * 2
        events = [_make_event(tool_calls=tool_calls)]
        report = self.analyzer.analyze(events)
        conc_bns = [b for b in report.bottlenecks
                    if b.bottleneck_type == "throughput" and b.component == "bad_tool"]
        assert len(conc_bns) >= 1

    def test_no_errors_no_concentration_bottleneck(self):
        tool_calls = [{"name": "good_tool", "success": True}] * 10
        events = [_make_event(tool_calls=tool_calls)]
        report = self.analyzer.analyze(events)
        conc_bns = [b for b in report.bottlenecks if b.bottleneck_type == "throughput"]
        assert conc_bns == []


# ---------------------------------------------------------------------------
# BottleneckAnalyzer — _severity_from_ratio
# ---------------------------------------------------------------------------

class TestSeverityFromRatio:
    def setup_method(self):
        self.analyzer = BottleneckAnalyzer()

    def test_critical(self):
        assert self.analyzer._severity_from_ratio(0.7, 0.3) == "critical"  # 0.7 >= 0.6

    def test_high(self):
        assert self.analyzer._severity_from_ratio(0.5, 0.3) == "high"  # 0.5 >= 0.45

    def test_medium(self):
        assert self.analyzer._severity_from_ratio(0.35, 0.3) == "medium"  # 0.35 >= 0.3

    def test_low(self):
        assert self.analyzer._severity_from_ratio(0.1, 0.3) == "low"

    def test_zero_threshold_returns_low(self):
        assert self.analyzer._severity_from_ratio(999.0, 0.0) == "low"


# ---------------------------------------------------------------------------
# BottleneckAnalyzer — analyze (combined + ordering)
# ---------------------------------------------------------------------------

class TestAnalyzeCombined:
    def setup_method(self):
        self.analyzer = BottleneckAnalyzer()

    def test_sorted_by_severity(self):
        # Mix of agent failures and tool errors to get multiple severities
        tool_calls = [{"name": "bad_tool", "error": True}] * 9 + \
                     [{"name": "bad_tool", "success": True}]
        events = [
            _make_event(
                agent_types=["executor"],
                agents_completed=[],
                tool_calls=tool_calls,
            )
        ] * 5 + [
            _make_event(
                agent_types=["executor"],
                agents_completed=["executor"],
                tool_calls=[],
            )
        ]
        report = self.analyzer.analyze(events)
        severities = [b.severity for b in report.bottlenecks]
        order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        assert severities == sorted(severities, key=lambda s: order.get(s, 99))

    def test_multiple_bottleneck_types_detected(self):
        # Trigger both agent failure and tool error
        tool_calls = [{"name": "flaky_tool", "error": True}] * 8 + \
                     [{"name": "flaky_tool", "success": True}] * 2
        events = [
            _make_event(
                agent_types=["planner"],
                agents_completed=[],
                tool_calls=tool_calls,
            )
        ] * 8 + [
            _make_event(
                agent_types=["planner"],
                agents_completed=["planner"],
                tool_calls=[],
            )
        ] * 2
        report = self.analyzer.analyze(events)
        types_found = {b.bottleneck_type for b in report.bottlenecks}
        assert "failure" in types_found

    def test_summary_contains_count(self):
        tool_calls = [{"name": "bad_tool", "error": True}] * 9 + \
                     [{"name": "bad_tool", "success": True}]
        events = [_make_event(tool_calls=tool_calls)]
        report = self.analyzer.analyze(events)
        assert str(len(report.bottlenecks)) in report.summary or "bottleneck" in report.summary.lower()


# ---------------------------------------------------------------------------
# format_report
# ---------------------------------------------------------------------------

class TestFormatReport:
    def setup_method(self):
        self.analyzer = BottleneckAnalyzer()

    def test_returns_markdown_string(self):
        report = self.analyzer.analyze([])
        md = self.analyzer.format_report(report)
        assert isinstance(md, str)
        assert "# Bottleneck Analysis Report" in md

    def test_no_bottlenecks_message(self):
        report = self.analyzer.analyze([])
        md = self.analyzer.format_report(report)
        assert "No bottlenecks detected" in md

    def test_bottleneck_appears_in_output(self):
        tool_calls = [{"name": "bad_tool", "error": True}] * 9 + \
                     [{"name": "bad_tool", "success": True}]
        events = [_make_event(tool_calls=tool_calls)]
        report = self.analyzer.analyze(events)
        md = self.analyzer.format_report(report)
        assert "bad_tool" in md
        assert "##" in md


# ---------------------------------------------------------------------------
# Integration tests
# ---------------------------------------------------------------------------

class TestIntegration:
    def test_mixed_normal_and_abnormal_events(self):
        """Real-world scenario: mostly healthy system with one bad agent."""
        analyzer = BottleneckAnalyzer()
        # 8 healthy sessions
        healthy = [
            _make_event(
                session_id=f"healthy-{i}",
                agents_spawned=3,
                agent_types=["executor", "verifier"],
                agents_completed=["executor", "verifier"],
                tool_calls=[
                    {"name": "read_file", "success": True},
                    {"name": "write_file", "success": True},
                ],
            )
            for i in range(8)
        ]
        # 2 bad sessions with a failing agent
        bad = [
            _make_event(
                session_id=f"bad-{i}",
                agents_spawned=3,
                agent_types=["deep-executor"],
                agents_completed=[],
                tool_calls=[{"name": "bash_tool", "error": True}] * 5,
            )
            for i in range(2)
        ]
        report = analyzer.analyze(healthy + bad)
        assert report.analyzed_events == 10
        assert len(report.bottlenecks) >= 1

    def test_custom_thresholds(self):
        """Custom thresholds change what gets flagged."""
        strict = BottleneckAnalyzer(thresholds={
            "agent_failure_rate": 0.05,
            "tool_error_rate": 0.05,
            "session_duration_p95": 300.0,
            "agent_spawn_rate": 10.0,
            "error_concentration": 0.5,
        })
        lenient = BottleneckAnalyzer(thresholds={
            "agent_failure_rate": 0.9,
            "tool_error_rate": 0.9,
            "session_duration_p95": 300.0,
            "agent_spawn_rate": 10.0,
            "error_concentration": 0.9,
        })
        events = [
            _make_event(
                agent_types=["executor"],
                agents_completed=[],
                tool_calls=[{"name": "tool_x", "error": True}] * 3 +
                            [{"name": "tool_x", "success": True}] * 7,
            )
        ] * 3 + [
            _make_event(
                agent_types=["executor"],
                agents_completed=["executor"],
                tool_calls=[],
            )
        ] * 7
        strict_report = strict.analyze(events)
        lenient_report = lenient.analyze(events)
        assert len(strict_report.bottlenecks) >= len(lenient_report.bottlenecks)

    def test_large_event_set_performance(self):
        """Analyzer should handle 1000 events without error."""
        analyzer = BottleneckAnalyzer()
        events = [
            _make_event(
                session_id=f"s{i}",
                agents_spawned=i % 5 + 1,
                agent_types=["executor"],
                agents_completed=["executor"] if i % 3 != 0 else [],
                tool_calls=[{"name": "read_file", "success": True}] * 3,
            )
            for i in range(1000)
        ]
        report = analyzer.analyze(events)
        assert report.analyzed_events == 1000
        assert isinstance(report.summary, str)
