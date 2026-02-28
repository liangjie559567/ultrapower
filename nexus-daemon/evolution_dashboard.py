from __future__ import annotations
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_STATUS_SCORE: dict[str, float] = {
    "healthy": 100.0,
    "warning": 60.0,
    "critical": 20.0,
    "unknown": 50.0,
}


@dataclass
class DashboardSection:
    """仪表盘的一个区域"""
    title: str
    status: str          # "healthy" | "warning" | "critical" | "unknown"
    metrics: dict        # 关键指标
    details: str         # Markdown 格式详情

    def status_emoji(self) -> str:
        return {"healthy": "[OK]", "warning": "[WARN]",
                "critical": "[CRIT]", "unknown": "[?]"}.get(self.status, "[?]")


@dataclass
class DashboardReport:
    """完整仪表盘报告"""
    timestamp: str
    overall_status: str
    overall_score: float
    sections: list[DashboardSection]
    event_count: int

    def to_dict(self) -> dict:
        return {
            "timestamp": self.timestamp,
            "overall_status": self.overall_status,
            "overall_score": self.overall_score,
            "event_count": self.event_count,
            "sections": [
                {
                    "title": s.title,
                    "status": s.status,
                    "metrics": s.metrics,
                    "details": s.details,
                }
                for s in self.sections
            ],
        }


class EvolutionDashboard:
    """进化系统综合仪表盘"""

    def __init__(self) -> None:
        pass  # 无状态，每次 generate 时传入数据

    def generate(
        self,
        events: list[dict],
        patterns: Any | None = None,
        health_report: Any | None = None,
        anomalies: list | None = None,
        recommendations: list | None = None,
        bottleneck_report: Any | None = None,
        reflection_entries: list | None = None,
        graph_stats: dict | None = None,
    ) -> DashboardReport:
        """生成综合仪表盘报告"""
        sections = [
            self._build_overview_section(events),
            self._build_pattern_section(patterns),
            self._build_health_section(health_report),
            self._build_anomaly_section(anomalies),
            self._build_recommendation_section(recommendations),
            self._build_bottleneck_section(bottleneck_report),
            self._build_reflection_section(reflection_entries),
            self._build_knowledge_section(graph_stats),
        ]
        overall_score = self._compute_overall_score(sections)
        overall_status = self._score_to_status(overall_score)
        return DashboardReport(
            timestamp=datetime.now(timezone.utc).isoformat(),
            overall_status=overall_status,
            overall_score=overall_score,
            sections=sections,
            event_count=len(events),
        )

    # ------------------------------------------------------------------
    # Section builders
    # ------------------------------------------------------------------

    def _build_overview_section(self, events: list[dict]) -> DashboardSection:
        total = len(events)
        error_count = sum(
            1 for e in events
            if e.get("agentErrors") or e.get("error") or e.get("status") == "error"
        )
        error_rate = (error_count / total) if total > 0 else 0.0
        agent_types: dict[str, int] = {}
        for e in events:
            for at in e.get("agentTypes", []):
                agent_types[at] = agent_types.get(at, 0) + 1
        if error_rate > 0.3:
            status = "critical"
        elif error_rate > 0.1:
            status = "warning"
        else:
            status = "healthy"
        top = sorted(agent_types.items(), key=lambda x: x[1], reverse=True)[:3]
        agent_lines = "\n".join(f"  - {n}: {c}" for n, c in top)
        details = f"Total events: {total}\nError count: {error_count}\nError rate: {error_rate:.1%}"
        if agent_lines:
            details += f"\nTop agents:\n{agent_lines}"
        return DashboardSection(
            title="Overview",
            status=status,
            metrics={"total_events": total, "error_count": error_count, "error_rate": round(error_rate, 4)},
            details=details,
        )

    def _build_pattern_section(self, patterns: Any | None) -> DashboardSection:
        if patterns is None:
            return DashboardSection(
                title="Pattern Detection", status="unknown",
                metrics={"pattern_count": 0}, details="No pattern data available.",
            )
        if isinstance(patterns, list):
            count = len(patterns)
            type_counts: dict[str, int] = {}
            for p in patterns:
                pt = getattr(p, "pattern_type", None) or (p.get("pattern_type") if isinstance(p, dict) else "unknown")
                type_counts[pt] = type_counts.get(pt, 0) + 1
        elif isinstance(patterns, dict):
            count = patterns.get("count", len(patterns))
            type_counts = patterns.get("types", {})
        else:
            count = 0
            type_counts = {}
        status = "healthy" if count > 0 else "warning"
        type_lines = "\n".join(f"  - {t}: {c}" for t, c in type_counts.items())
        details = f"Patterns found: {count}"
        if type_lines:
            details += f"\nTypes:\n{type_lines}"
        return DashboardSection(
            title="Pattern Detection", status=status,
            metrics={"pattern_count": count, "type_breakdown": type_counts},
            details=details,
        )

    def _build_health_section(self, health_report: Any | None) -> DashboardSection:
        if health_report is None:
            return DashboardSection(
                title="Health Assessment", status="unknown",
                metrics={"overall_score": None}, details="No health report available.",
            )
        overall = getattr(health_report, "overall_score", None)
        if overall is None:
            overall = health_report.get("overall_score", 0.5) if isinstance(health_report, dict) else 0.5
        score_pct = overall * 100 if overall <= 1.0 else overall
        if score_pct >= 80:
            status = "healthy"
        elif score_pct >= 50:
            status = "warning"
        else:
            status = "critical"
        dims = getattr(health_report, "dimension_scores", [])
        dim_lines = "\n".join(
            f"  - {getattr(d, 'name', d)}: {getattr(d, 'score', 0):.2f}" for d in dims
        )
        details = f"Overall score: {score_pct:.1f}%"
        if dim_lines:
            details += f"\nDimensions:\n{dim_lines}"
        return DashboardSection(
            title="Health Assessment", status=status,
            metrics={"overall_score": round(score_pct, 2)}, details=details,
        )

    def _build_anomaly_section(self, anomalies: list | None) -> DashboardSection:
        if anomalies is None:
            return DashboardSection(
                title="Anomaly Detection", status="unknown",
                metrics={"anomaly_count": 0}, details="No anomaly data available.",
            )
        count = len(anomalies)
        severity_counts: dict[str, int] = {}
        for a in anomalies:
            sev = getattr(a, "severity", None) or (a.get("severity") if isinstance(a, dict) else "unknown")
            severity_counts[sev] = severity_counts.get(sev, 0) + 1
        high_critical = severity_counts.get("high", 0) + severity_counts.get("critical", 0)
        if high_critical > 0:
            status = "critical"
        elif count > 0:
            status = "warning"
        else:
            status = "healthy"
        sev_lines = "\n".join(f"  - {s}: {c}" for s, c in severity_counts.items())
        details = f"Anomalies detected: {count}"
        if sev_lines:
            details += f"\nSeverity breakdown:\n{sev_lines}"
        return DashboardSection(
            title="Anomaly Detection", status=status,
            metrics={"anomaly_count": count, "severity_breakdown": severity_counts},
            details=details,
        )

    def _build_recommendation_section(self, recommendations: list | None) -> DashboardSection:
        if recommendations is None:
            return DashboardSection(
                title="Recommendations", status="unknown",
                metrics={"recommendation_count": 0}, details="No recommendation data available.",
            )
        count = len(recommendations)
        top = recommendations[:3]
        top_lines = "\n".join(
            f"  - {getattr(r, 'name', r)}: {getattr(r, 'score', '')}" for r in top
        )
        status = "healthy" if count > 0 else "warning"
        details = f"Recommendations available: {count}"
        if top_lines:
            details += f"\nTop picks:\n{top_lines}"
        return DashboardSection(
            title="Recommendations", status=status,
            metrics={"recommendation_count": count}, details=details,
        )

    def _build_bottleneck_section(self, bottleneck_report: Any | None) -> DashboardSection:
        if bottleneck_report is None:
            return DashboardSection(
                title="Bottleneck Analysis", status="unknown",
                metrics={"bottleneck_count": 0}, details="No bottleneck data available.",
            )
        bottlenecks = getattr(bottleneck_report, "bottlenecks", [])
        count = len(bottlenecks)
        critical = getattr(bottleneck_report, "critical_count", 0)
        high = getattr(bottleneck_report, "high_count", 0)
        if critical > 0:
            status = "critical"
        elif high > 0 or count > 0:
            status = "warning"
        else:
            status = "healthy"
        top = bottlenecks[:3]
        top_lines = "\n".join(
            f"  - [{getattr(b, 'severity', '?').upper()}] {getattr(b, 'component', '?')}: {getattr(b, 'description', '')}"
            for b in top
        )
        details = f"Bottlenecks found: {count} (critical: {critical}, high: {high})"
        if top_lines:
            details += f"\n{top_lines}"
        return DashboardSection(
            title="Bottleneck Analysis", status=status,
            metrics={"bottleneck_count": count, "critical_count": critical, "high_count": high},
            details=details,
        )

    def _build_reflection_section(self, entries: list | None) -> DashboardSection:
        if entries is None:
            return DashboardSection(
                title="Reflexion", status="unknown",
                metrics={"entry_count": 0, "avg_score": None}, details="No reflection data available.",
            )
        count = len(entries)
        if count == 0:
            return DashboardSection(
                title="Reflexion", status="warning",
                metrics={"entry_count": 0, "avg_score": None}, details="No reflection entries recorded.",
            )
        scores = [
            getattr(e, "score", None) or (e.get("score") if isinstance(e, dict) else None)
            for e in entries
        ]
        valid_scores = [s for s in scores if s is not None]
        avg_score = sum(valid_scores) / len(valid_scores) if valid_scores else 0.0
        if avg_score >= 0.7:
            status = "healthy"
        elif avg_score >= 0.4:
            status = "warning"
        else:
            status = "critical"
        recent = entries[-3:]
        recent_lines = "\n".join(
            f"  - Round {getattr(e, 'round_num', i + 1)}: score={getattr(e, 'score', '?')}"
            for i, e in enumerate(recent)
        )
        details = f"Total reflections: {count}\nAvg score: {avg_score:.2f}\nRecent:\n{recent_lines}"
        return DashboardSection(
            title="Reflexion", status=status,
            metrics={"entry_count": count, "avg_score": round(avg_score, 4)},
            details=details,
        )

    def _build_knowledge_section(self, stats: dict | None) -> DashboardSection:
        if stats is None:
            return DashboardSection(
                title="Knowledge Graph", status="unknown",
                metrics={"node_count": 0, "edge_count": 0}, details="No knowledge graph data available.",
            )
        nodes = stats.get("node_count", stats.get("nodes", 0))
        edges = stats.get("edge_count", stats.get("edges", 0))
        status = "healthy" if nodes > 0 else "warning"
        return DashboardSection(
            title="Knowledge Graph", status=status,
            metrics={"node_count": nodes, "edge_count": edges},
            details=f"Nodes: {nodes}\nEdges: {edges}",
        )

    # ------------------------------------------------------------------
    # Scoring
    # ------------------------------------------------------------------

    def _compute_overall_score(self, sections: list[DashboardSection]) -> float:
        if not sections:
            return 50.0
        scores = [_STATUS_SCORE.get(s.status, 50.0) for s in sections]
        return round(sum(scores) / len(scores), 2)

    def _score_to_status(self, score: float) -> str:
        if score >= 80:
            return "healthy"
        if score >= 50:
            return "warning"
        return "critical"

    # ------------------------------------------------------------------
    # Formatting & persistence
    # ------------------------------------------------------------------

    def format_markdown(self, report: DashboardReport) -> str:
        emoji = {"healthy": "[OK]", "warning": "[WARN]", "critical": "[CRIT]", "unknown": "[?]"}.get(
            report.overall_status, "[?]"
        )
        lines = [
            "# Evolution Dashboard",
            "",
            f"**Status:** {emoji} {report.overall_status} | "
            f"**Score:** {report.overall_score:.0f}/100 | "
            f"**Events:** {report.event_count}",
            f"**Generated:** {report.timestamp}",
            "",
        ]
        for section in report.sections:
            sec_emoji = section.status_emoji()
            lines.append(f"## {section.title}")
            lines.append("")
            lines.append(f"**Status:** {sec_emoji} {section.status}")
            lines.append("")
            lines.append(section.details)
            lines.append("")
        return "\n".join(lines)

    def save_report(self, report: DashboardReport, path: Path) -> None:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(self.format_markdown(report), encoding="utf-8")
        logger.info("Dashboard report saved to %s", path)
