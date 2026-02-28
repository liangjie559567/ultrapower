"""Bottleneck analysis for multi-agent system workflows.

Identifies latency, failure, and resource consumption hotspots
across agent/tool/skill components.
"""
from __future__ import annotations

import math
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

_SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


@dataclass
class BottleneckRecord:
    """A single identified bottleneck."""

    bottleneck_type: str   # "latency" | "failure" | "resource" | "throughput"
    component: str         # agent/skill/tool name
    severity: str          # "low" | "medium" | "high" | "critical"
    metric_value: float    # measured value
    threshold: float       # configured threshold
    description: str       # human-readable description
    recommendation: str    # improvement suggestion


@dataclass
class BottleneckReport:
    """Aggregated bottleneck analysis report."""

    bottlenecks: list[BottleneckRecord]
    analyzed_events: int
    analysis_timestamp: str
    summary: str

    @property
    def critical_count(self) -> int:
        return sum(1 for b in self.bottlenecks if b.severity == "critical")

    @property
    def high_count(self) -> int:
        return sum(1 for b in self.bottlenecks if b.severity == "high")


class BottleneckAnalyzer:
    """Identifies performance bottlenecks in multi-agent system event streams."""

    def __init__(self, thresholds: dict | None = None):
        self._thresholds: dict[str, float] = thresholds or {
            "agent_failure_rate": 0.3,
            "tool_error_rate": 0.2,
            "session_duration_p95": 300.0,
            "agent_spawn_rate": 10.0,
            "error_concentration": 0.5,
        }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def analyze(self, events: list[dict[str, Any]]) -> BottleneckReport:
        """Analyze an event list and return a BottleneckReport."""
        bottlenecks: list[BottleneckRecord] = []
        bottlenecks.extend(self._analyze_agent_failures(events))
        bottlenecks.extend(self._analyze_tool_errors(events))
        bottlenecks.extend(self._analyze_resource_usage(events))
        bottlenecks.extend(self._analyze_error_concentration(events))

        bottlenecks.sort(key=lambda b: _SEVERITY_ORDER.get(b.severity, 99))

        total = len(bottlenecks)
        critical = sum(1 for b in bottlenecks if b.severity == "critical")
        high = sum(1 for b in bottlenecks if b.severity == "high")

        if total == 0:
            summary = "No bottlenecks detected."
        else:
            summary = (
                f"Found {total} bottleneck(s): "
                f"{critical} critical, {high} high. "
                f"Analyzed {len(events)} event(s)."
            )

        return BottleneckReport(
            bottlenecks=bottlenecks,
            analyzed_events=len(events),
            analysis_timestamp=datetime.now(timezone.utc).isoformat(),
            summary=summary,
        )

    def format_report(self, report: BottleneckReport) -> str:
        """Format a BottleneckReport as a Markdown string."""
        lines: list[str] = [
            "# Bottleneck Analysis Report",
            "",
            f"**Timestamp:** {report.analysis_timestamp}",
            f"**Events analyzed:** {report.analyzed_events}",
            f"**Summary:** {report.summary}",
            "",
        ]

        if not report.bottlenecks:
            lines.append("_No bottlenecks detected._")
            return "\n".join(lines)

        lines.append("## Bottlenecks")
        lines.append("")

        for i, b in enumerate(report.bottlenecks, 1):
            lines.append(f"### {i}. [{b.severity.upper()}] {b.component} ({b.bottleneck_type})")
            lines.append("")
            lines.append(f"- **Metric value:** {b.metric_value:.4g}")
            lines.append(f"- **Threshold:** {b.threshold:.4g}")
            lines.append(f"- **Description:** {b.description}")
            lines.append(f"- **Recommendation:** {b.recommendation}")
            lines.append("")

        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Analysis helpers
    # ------------------------------------------------------------------

    def _analyze_agent_failures(
        self, events: list[dict[str, Any]]
    ) -> list[BottleneckRecord]:
        """Detect agent types with high failure rates."""
        if not events:
            return []

        spawned: Counter[str] = Counter()
        completed: Counter[str] = Counter()

        for event in events:
            for agent_type in event.get("agentTypes", []):
                if isinstance(agent_type, str):
                    spawned[agent_type] += 1
            for agent_type in event.get("agentsCompleted", []):
                if isinstance(agent_type, str):
                    completed[agent_type] += 1

        # Also support scalar agentsSpawned / agentsCompleted for aggregate events
        # (handled by _analyze_resource_usage; skip here)

        threshold = self._thresholds.get("agent_failure_rate", 0.3)
        records: list[BottleneckRecord] = []

        for agent_type, total_spawned in spawned.items():
            if total_spawned == 0:
                continue
            total_completed = completed.get(agent_type, 0)
            failure_rate = (total_spawned - total_completed) / total_spawned
            if failure_rate >= threshold:
                severity = self._severity_from_ratio(failure_rate, threshold)
                records.append(
                    BottleneckRecord(
                        bottleneck_type="failure",
                        component=agent_type,
                        severity=severity,
                        metric_value=round(failure_rate, 4),
                        threshold=threshold,
                        description=(
                            f"Agent '{agent_type}' has a failure rate of "
                            f"{failure_rate:.1%} ({total_spawned - total_completed}"
                            f"/{total_spawned} did not complete)."
                        ),
                        recommendation=(
                            f"Investigate why '{agent_type}' agents fail to complete. "
                            "Check timeout settings, input validation, and error logs."
                        ),
                    )
                )

        return records

    def _analyze_tool_errors(
        self, events: list[dict[str, Any]]
    ) -> list[BottleneckRecord]:
        """Detect tools with high error rates."""
        if not events:
            return []

        tool_calls: Counter[str] = Counter()
        tool_errors: Counter[str] = Counter()

        for event in events:
            raw_calls = event.get("toolCalls", [])
            if not isinstance(raw_calls, list):
                continue
            for call in raw_calls:
                if not isinstance(call, dict):
                    continue
                name = call.get("name", "unknown")
                tool_calls[name] += 1
                if call.get("error") or call.get("success") is False:
                    tool_errors[name] += 1

        threshold = self._thresholds.get("tool_error_rate", 0.2)
        records: list[BottleneckRecord] = []

        for tool_name, total_calls in tool_calls.items():
            if total_calls == 0:
                continue
            errors = tool_errors.get(tool_name, 0)
            error_rate = errors / total_calls
            if error_rate >= threshold:
                severity = self._severity_from_ratio(error_rate, threshold)
                records.append(
                    BottleneckRecord(
                        bottleneck_type="failure",
                        component=tool_name,
                        severity=severity,
                        metric_value=round(error_rate, 4),
                        threshold=threshold,
                        description=(
                            f"Tool '{tool_name}' has an error rate of "
                            f"{error_rate:.1%} ({errors}/{total_calls} calls failed)."
                        ),
                        recommendation=(
                            f"Review '{tool_name}' error handling and input contracts. "
                            "Consider adding retries or fallback logic."
                        ),
                    )
                )

        return records

    def _analyze_resource_usage(
        self, events: list[dict[str, Any]]
    ) -> list[BottleneckRecord]:
        """Detect sessions with abnormally high agent spawn counts."""
        if not events:
            return []

        spawn_counts: list[float] = []
        for event in events:
            v = event.get("agentsSpawned")
            if isinstance(v, (int, float)):
                spawn_counts.append(float(v))

        if len(spawn_counts) < 2:
            return []

        mean = sum(spawn_counts) / len(spawn_counts)
        variance = sum((x - mean) ** 2 for x in spawn_counts) / len(spawn_counts)
        std = math.sqrt(variance)

        threshold = self._thresholds.get("agent_spawn_rate", 10.0)
        records: list[BottleneckRecord] = []

        # Flag sessions that exceed mean + 2*std AND the absolute threshold
        upper_bound = mean + 2 * std if std > 0 else mean

        for event in events:
            v = event.get("agentsSpawned")
            if not isinstance(v, (int, float)):
                continue
            count = float(v)
            if count > upper_bound and count >= threshold:
                severity = self._severity_from_ratio(count, threshold)
                session_id = event.get("sessionId", "unknown")
                records.append(
                    BottleneckRecord(
                        bottleneck_type="resource",
                        component=f"session:{session_id}",
                        severity=severity,
                        metric_value=count,
                        threshold=threshold,
                        description=(
                            f"Session '{session_id}' spawned {int(count)} agents, "
                            f"which is {count - mean:.1f} above the mean ({mean:.1f}) "
                            f"and exceeds the threshold of {threshold}."
                        ),
                        recommendation=(
                            "Review task decomposition strategy for this session. "
                            "Consider batching sub-tasks or increasing agent reuse."
                        ),
                    )
                )

        return records

    def _analyze_error_concentration(
        self, events: list[dict[str, Any]]
    ) -> list[BottleneckRecord]:
        """Detect components that account for a disproportionate share of errors."""
        if not events:
            return []

        error_counts: Counter[str] = Counter()

        for event in events:
            # Errors from toolCalls
            raw_calls = event.get("toolCalls", [])
            if isinstance(raw_calls, list):
                for call in raw_calls:
                    if not isinstance(call, dict):
                        continue
                    if call.get("error") or call.get("success") is False:
                        name = call.get("name", "unknown")
                        error_counts[name] += 1

            # Errors from agentTypes that failed
            raw_errors = event.get("agentErrors", [])
            if isinstance(raw_errors, list):
                for agent_type in raw_errors:
                    if isinstance(agent_type, str):
                        error_counts[agent_type] += 1

        total_errors = sum(error_counts.values())
        if total_errors == 0:
            return []

        threshold = self._thresholds.get("error_concentration", 0.5)
        records: list[BottleneckRecord] = []

        for component, count in error_counts.items():
            concentration = count / total_errors
            if concentration >= threshold:
                severity = self._severity_from_ratio(concentration, threshold)
                records.append(
                    BottleneckRecord(
                        bottleneck_type="throughput",
                        component=component,
                        severity=severity,
                        metric_value=round(concentration, 4),
                        threshold=threshold,
                        description=(
                            f"'{component}' accounts for {concentration:.1%} of all errors "
                            f"({count}/{total_errors} total errors)."
                        ),
                        recommendation=(
                            f"'{component}' is a single point of failure. "
                            "Prioritize fixing or replacing this component."
                        ),
                    )
                )

        return records

    # ------------------------------------------------------------------
    # Utility
    # ------------------------------------------------------------------

    def _severity_from_ratio(self, ratio: float, threshold: float) -> str:
        """Map a ratio relative to its threshold to a severity level."""
        if threshold <= 0:
            return "low"
        if ratio >= threshold * 2:
            return "critical"
        if ratio >= threshold * 1.5:
            return "high"
        if ratio >= threshold:
            return "medium"
        return "low"
