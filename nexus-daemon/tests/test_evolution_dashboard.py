"""Tests for evolution_dashboard.py — at least 20 test cases."""
from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from evolution_dashboard import (
    DashboardReport,
    DashboardSection,
    EvolutionDashboard,
)


# ---------------------------------------------------------------------------
# Helpers / stubs
# ---------------------------------------------------------------------------

def _section(status: str = "healthy") -> DashboardSection:
    return DashboardSection(title="Test", status=status, metrics={}, details="d")


@dataclass
class _HealthReport:
    overall_score: float
    dimension_scores: list = None

    def __post_init__(self):
        if self.dimension_scores is None:
            self.dimension_scores = []


@dataclass
class _DimScore:
    name: str
    score: float


@dataclass
class _Anomaly:
    severity: str
    value: float = 1.0


@dataclass
class _Recommendation:
    name: str
    score: float
    reason: str = ""


@dataclass
class _BottleneckRecord:
    severity: str
    component: str
    description: str


@dataclass
class _BottleneckReport:
    bottlenecks: list
    analyzed_events: int = 0
    analysis_timestamp: str = "2026-01-01T00:00:00+00:00"
    summary: str = ""

    @property
    def critical_count(self) -> int:
        return sum(1 for b in self.bottlenecks if b.severity == "critical")

    @property
    def high_count(self) -> int:
        return sum(1 for b in self.bottlenecks if b.severity == "high")


@dataclass
class _ReflectionEntry:
    round_num: int
    score: float
    observation: str = ""
    evaluation: str = ""
    reflection: str = ""
    action_items: list = None
    timestamp: str = "2026-01-01T00:00:00+00:00"

    def __post_init__(self):
        if self.action_items is None:
            self.action_items = []


@dataclass
class _PatternRecord:
    pattern_type: str
    value: str
    occurrences: int = 1


# ---------------------------------------------------------------------------
# DashboardSection
# ---------------------------------------------------------------------------

class TestDashboardSection:
    def test_status_emoji_healthy(self):
        assert _section("healthy").status_emoji() == "[OK]"

    def test_status_emoji_warning(self):
        assert _section("warning").status_emoji() == "[WARN]"

    def test_status_emoji_critical(self):
        assert _section("critical").status_emoji() == "[CRIT]"

    def test_status_emoji_unknown(self):
        assert _section("unknown").status_emoji() == "[?]"

    def test_status_emoji_fallback(self):
        assert _section("bogus").status_emoji() == "[?]"


# ---------------------------------------------------------------------------
# DashboardReport
# ---------------------------------------------------------------------------

class TestDashboardReport:
    def _make_report(self) -> DashboardReport:
        return DashboardReport(
            timestamp="2026-01-01T00:00:00+00:00",
            overall_status="healthy",
            overall_score=85.0,
            sections=[_section("healthy"), _section("warning")],
            event_count=10,
        )

    def test_to_dict_keys(self):
        d = self._make_report().to_dict()
        assert set(d.keys()) == {"timestamp", "overall_status", "overall_score", "event_count", "sections"}

    def test_to_dict_sections_serialized(self):
        d = self._make_report().to_dict()
        assert len(d["sections"]) == 2
        assert d["sections"][0]["status"] == "healthy"

    def test_to_dict_score(self):
        assert self._make_report().to_dict()["overall_score"] == 85.0

    def test_attribute_access(self):
        r = self._make_report()
        assert r.event_count == 10
        assert r.overall_status == "healthy"


# ---------------------------------------------------------------------------
# EvolutionDashboard
# ---------------------------------------------------------------------------

class TestEvolutionDashboard:
    def setup_method(self):
        self.dash = EvolutionDashboard()

    # generate — empty / minimal
    def test_generate_empty_events(self):
        report = self.dash.generate(events=[])
        assert report.event_count == 0
        assert len(report.sections) == 8

    def test_generate_returns_dashboard_report(self):
        report = self.dash.generate(events=[])
        assert isinstance(report, DashboardReport)

    def test_generate_timestamp_set(self):
        report = self.dash.generate(events=[])
        assert "T" in report.timestamp  # ISO format

    def test_generate_full_input(self):
        events = [{"agentTypes": ["executor"], "toolCalls": []}]
        patterns = [_PatternRecord("mode_usage", "autopilot", 3)]
        health = _HealthReport(overall_score=0.85)
        anomalies = [_Anomaly("low")]
        recs = [_Recommendation("executor", 0.9)]
        bn = _BottleneckReport(bottlenecks=[])
        reflections = [_ReflectionEntry(1, 0.8)]
        graph = {"node_count": 5, "edge_count": 8}

        report = self.dash.generate(
            events=events,
            patterns=patterns,
            health_report=health,
            anomalies=anomalies,
            recommendations=recs,
            bottleneck_report=bn,
            reflection_entries=reflections,
            graph_stats=graph,
        )
        assert report.event_count == 1
        assert report.overall_score > 0

    # _build_overview_section
    def test_overview_healthy_no_errors(self):
        events = [{"agentTypes": ["executor"]} for _ in range(5)]
        sec = self.dash._build_overview_section(events)
        assert sec.status == "healthy"
        assert sec.metrics["total_events"] == 5
        assert sec.metrics["error_count"] == 0

    def test_overview_critical_high_error_rate(self):
        events = [{"agentErrors": ["err"]} for _ in range(4)] + [{}]
        sec = self.dash._build_overview_section(events)
        assert sec.status == "critical"
        assert sec.metrics["error_count"] == 4

    def test_overview_warning_moderate_error_rate(self):
        # 2 errors out of 10 = 20% > 10%
        events = [{"agentErrors": ["e"]} for _ in range(2)] + [{} for _ in range(8)]
        sec = self.dash._build_overview_section(events)
        assert sec.status == "warning"

    def test_overview_empty_events(self):
        sec = self.dash._build_overview_section([])
        assert sec.status == "healthy"
        assert sec.metrics["total_events"] == 0

    # _build_pattern_section
    def test_pattern_none_input(self):
        sec = self.dash._build_pattern_section(None)
        assert sec.status == "unknown"
        assert sec.metrics["pattern_count"] == 0

    def test_pattern_with_list(self):
        patterns = [_PatternRecord("mode_usage", "autopilot"), _PatternRecord("tool_seq", "bash")]
        sec = self.dash._build_pattern_section(patterns)
        assert sec.status == "healthy"
        assert sec.metrics["pattern_count"] == 2

    def test_pattern_empty_list(self):
        sec = self.dash._build_pattern_section([])
        assert sec.status == "warning"

    def test_pattern_dict_input(self):
        sec = self.dash._build_pattern_section({"count": 3, "types": {"mode_usage": 2, "tool_seq": 1}})
        assert sec.metrics["pattern_count"] == 3

    # _build_anomaly_section
    def test_anomaly_none_input(self):
        sec = self.dash._build_anomaly_section(None)
        assert sec.status == "unknown"

    def test_anomaly_critical_severity(self):
        anomalies = [_Anomaly("critical"), _Anomaly("low")]
        sec = self.dash._build_anomaly_section(anomalies)
        assert sec.status == "critical"

    def test_anomaly_warning_low_severity(self):
        anomalies = [_Anomaly("low")]
        sec = self.dash._build_anomaly_section(anomalies)
        assert sec.status == "warning"

    def test_anomaly_healthy_empty(self):
        sec = self.dash._build_anomaly_section([])
        assert sec.status == "healthy"

    # _build_bottleneck_section
    def test_bottleneck_none_input(self):
        sec = self.dash._build_bottleneck_section(None)
        assert sec.status == "unknown"

    def test_bottleneck_critical(self):
        bn = _BottleneckReport(bottlenecks=[_BottleneckRecord("critical", "executor", "high fail")])
        sec = self.dash._build_bottleneck_section(bn)
        assert sec.status == "critical"
        assert sec.metrics["critical_count"] == 1

    def test_bottleneck_healthy_empty(self):
        bn = _BottleneckReport(bottlenecks=[])
        sec = self.dash._build_bottleneck_section(bn)
        assert sec.status == "healthy"

    # _build_reflection_section
    def test_reflection_none_input(self):
        sec = self.dash._build_reflection_section(None)
        assert sec.status == "unknown"

    def test_reflection_healthy_high_scores(self):
        entries = [_ReflectionEntry(i, 0.8) for i in range(3)]
        sec = self.dash._build_reflection_section(entries)
        assert sec.status == "healthy"
        assert sec.metrics["avg_score"] == pytest.approx(0.8, abs=0.01)

    def test_reflection_critical_low_scores(self):
        entries = [_ReflectionEntry(i, 0.2) for i in range(3)]
        sec = self.dash._build_reflection_section(entries)
        assert sec.status == "critical"

    def test_reflection_empty_list(self):
        sec = self.dash._build_reflection_section([])
        assert sec.status == "warning"

    # _build_knowledge_section
    def test_knowledge_none_input(self):
        sec = self.dash._build_knowledge_section(None)
        assert sec.status == "unknown"

    def test_knowledge_with_stats(self):
        sec = self.dash._build_knowledge_section({"node_count": 10, "edge_count": 15})
        assert sec.status == "healthy"
        assert sec.metrics["node_count"] == 10
        assert sec.metrics["edge_count"] == 15

    def test_knowledge_empty_graph(self):
        sec = self.dash._build_knowledge_section({"node_count": 0, "edge_count": 0})
        assert sec.status == "warning"

    # _compute_overall_score
    def test_compute_score_all_healthy(self):
        sections = [_section("healthy")] * 4
        score = self.dash._compute_overall_score(sections)
        assert score == 100.0

    def test_compute_score_mixed(self):
        sections = [_section("healthy"), _section("critical"), _section("warning"), _section("unknown")]
        score = self.dash._compute_overall_score(sections)
        # (100 + 20 + 60 + 50) / 4 = 57.5
        assert score == pytest.approx(57.5, abs=0.01)

    def test_compute_score_empty(self):
        assert self.dash._compute_overall_score([]) == 50.0

    # _score_to_status
    def test_score_to_status_healthy(self):
        assert self.dash._score_to_status(80.0) == "healthy"
        assert self.dash._score_to_status(100.0) == "healthy"

    def test_score_to_status_warning(self):
        assert self.dash._score_to_status(50.0) == "warning"
        assert self.dash._score_to_status(79.9) == "warning"

    def test_score_to_status_critical(self):
        assert self.dash._score_to_status(49.9) == "critical"
        assert self.dash._score_to_status(0.0) == "critical"

    # format_markdown
    def test_format_markdown_contains_header(self):
        report = self.dash.generate(events=[])
        md = self.dash.format_markdown(report)
        assert "# Evolution Dashboard" in md

    def test_format_markdown_contains_status(self):
        report = self.dash.generate(events=[])
        md = self.dash.format_markdown(report)
        assert "**Status:**" in md

    def test_format_markdown_contains_all_sections(self):
        report = self.dash.generate(events=[])
        md = self.dash.format_markdown(report)
        for title in ["Overview", "Pattern Detection", "Health Assessment",
                      "Anomaly Detection", "Recommendations", "Bottleneck Analysis",
                      "Reflexion", "Knowledge Graph"]:
            assert title in md, f"Missing section: {title}"

    def test_format_markdown_score_displayed(self):
        report = self.dash.generate(events=[])
        md = self.dash.format_markdown(report)
        assert "/100" in md


# ---------------------------------------------------------------------------
# Integration tests
# ---------------------------------------------------------------------------

class TestEvolutionDashboardIntegration:
    def setup_method(self):
        self.dash = EvolutionDashboard()

    def test_full_pipeline(self):
        """完整流程：事件 -> 各子系统 -> dashboard"""
        events = [
            {"agentTypes": ["executor", "planner"], "toolCalls": [{"name": "bash"}]},
            {"agentTypes": ["executor"], "agentErrors": ["timeout"]},
            {"agentTypes": ["verifier"], "toolCalls": []},
        ]
        patterns = [_PatternRecord("mode_usage", "autopilot", 5)]
        health = _HealthReport(
            overall_score=0.75,
            dimension_scores=[_DimScore("skill_health", 0.8), _DimScore("error_health", 0.6)],
        )
        anomalies = [_Anomaly("medium")]
        recs = [_Recommendation("executor", 0.9, "high success"), _Recommendation("planner", 0.7, "good")]
        bn = _BottleneckReport(
            bottlenecks=[_BottleneckRecord("high", "executor", "high failure rate")],
        )
        reflections = [_ReflectionEntry(1, 0.75), _ReflectionEntry(2, 0.8)]
        graph = {"node_count": 12, "edge_count": 20}

        report = self.dash.generate(
            events=events,
            patterns=patterns,
            health_report=health,
            anomalies=anomalies,
            recommendations=recs,
            bottleneck_report=bn,
            reflection_entries=reflections,
            graph_stats=graph,
        )
        assert report.event_count == 3
        assert report.overall_score > 0
        assert report.overall_status in {"healthy", "warning", "critical"}
        d = report.to_dict()
        assert len(d["sections"]) == 8

    def test_save_report_writes_file(self, tmp_path):
        report = self.dash.generate(events=[{"agentTypes": ["executor"]}])
        out = tmp_path / "reports" / "dashboard.md"
        self.dash.save_report(report, out)
        assert out.exists()
        content = out.read_text(encoding="utf-8")
        assert "# Evolution Dashboard" in content

    def test_large_event_volume(self):
        """大量事件处理"""
        events = [
            {"agentTypes": ["executor"], "toolCalls": [{"name": "bash"}]}
            for _ in range(500)
        ]
        report = self.dash.generate(events=events)
        assert report.event_count == 500
        assert report.sections[0].metrics["total_events"] == 500

    def test_all_none_subsystems(self):
        """所有子系统数据为 None 时，所有 section 状态为 unknown（除 overview）"""
        report = self.dash.generate(events=[])
        unknown_sections = [s for s in report.sections if s.status == "unknown"]
        # overview 有数据，其余 7 个应为 unknown
        assert len(unknown_sections) == 7

    def test_report_to_dict_roundtrip(self):
        report = self.dash.generate(
            events=[{"agentTypes": ["executor"]}],
            graph_stats={"node_count": 3, "edge_count": 4},
        )
        d = report.to_dict()
        assert d["event_count"] == 1
        assert isinstance(d["sections"], list)
        assert all("title" in s for s in d["sections"])
