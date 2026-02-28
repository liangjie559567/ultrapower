"""Nexus Integrator — orchestrates all self-evolution subsystems.

Wires together: EvolutionEngine, SelfEvaluator, AnomalyDetector,
RecommendationEngine, BottleneckAnalyzer, ReflexionEngine,
KnowledgeGraph, ExperiencePropagator, PromptOptimizer,
MemoryModel, CodeHealthScorer, EvolutionDashboard.
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger("nexus.integrator")


@dataclass
class IntegrationResult:
    """Result of a full integration cycle."""

    timestamp: str
    events_processed: int
    patterns_found: int
    health_score: float
    anomaly_count: int
    recommendation_count: int
    bottleneck_count: int
    reflection_score: float | None
    knowledge_nodes: int
    knowledge_edges: int
    dashboard_score: float
    dashboard_status: str
    errors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "timestamp": self.timestamp,
            "events_processed": self.events_processed,
            "patterns_found": self.patterns_found,
            "health_score": self.health_score,
            "anomaly_count": self.anomaly_count,
            "recommendation_count": self.recommendation_count,
            "bottleneck_count": self.bottleneck_count,
            "reflection_score": self.reflection_score,
            "knowledge_nodes": self.knowledge_nodes,
            "knowledge_edges": self.knowledge_edges,
            "dashboard_score": self.dashboard_score,
            "dashboard_status": self.dashboard_status,
            "errors": self.errors,
        }

    @property
    def success(self) -> bool:
        return len(self.errors) == 0


class NexusIntegrator:
    """Orchestrates all self-evolution subsystems into a single pipeline.

    Pipeline order:
      1. Pattern detection (EvolutionEngine)
      2. Health evaluation (SelfEvaluator)
      3. Anomaly detection (AnomalyDetector)
      4. Recommendation generation (RecommendationEngine)
      5. Bottleneck analysis (BottleneckAnalyzer)
      6. Reflexion cycle (ReflexionEngine)
      7. Knowledge graph update (KnowledgeGraph)
      8. Dashboard generation (EvolutionDashboard)
    """

    def __init__(self, repo_path: Path | None = None) -> None:
        self.repo_path = Path(repo_path) if repo_path else None
        self._errors: list[str] = []

    def run_cycle(self, events: list[dict]) -> IntegrationResult:
        """Execute a full integration cycle over the given events."""
        self._errors = []
        ts = datetime.now(timezone.utc).isoformat()

        # 1. Pattern detection
        patterns = self._run_patterns(events)

        # 2. Health evaluation
        health_score = self._run_health(events)

        # 3. Anomaly detection
        anomalies = self._run_anomalies(events)

        # 4. Recommendations
        recommendations = self._run_recommendations(events)

        # 5. Bottleneck analysis
        bottleneck_count = self._run_bottlenecks(events)

        # 6. Reflexion
        reflection_score = self._run_reflexion(events, health_score)

        # 7. Knowledge graph
        kg_nodes, kg_edges = self._run_knowledge_graph(events)

        # 8. Dashboard
        dash_score, dash_status = self._run_dashboard(
            events, patterns, health_score, anomalies,
            recommendations, bottleneck_count, reflection_score,
        )

        result = IntegrationResult(
            timestamp=ts,
            events_processed=len(events),
            patterns_found=len(patterns) if patterns else 0,
            health_score=health_score,
            anomaly_count=len(anomalies) if anomalies else 0,
            recommendation_count=len(recommendations) if recommendations else 0,
            bottleneck_count=bottleneck_count,
            reflection_score=reflection_score,
            knowledge_nodes=kg_nodes,
            knowledge_edges=kg_edges,
            dashboard_score=dash_score,
            dashboard_status=dash_status,
            errors=list(self._errors),
        )

        # Persist result if repo_path is set
        if self.repo_path:
            self._save_result(result)

        return result

    # ------------------------------------------------------------------
    # Pipeline steps (each catches its own errors to avoid blocking others)
    # ------------------------------------------------------------------

    def _run_patterns(self, events: list[dict]) -> list:
        try:
            from evolution_engine import detect_patterns
            return detect_patterns(events)
        except Exception as e:
            self._errors.append(f"pattern_detection: {e}")
            return []

    def _run_health(self, events: list[dict]) -> float:
        try:
            from self_evaluator import SelfEvaluator
            evaluator = SelfEvaluator(events=events)
            report = evaluator.generate_health_report()
            return report.overall_score
        except Exception as e:
            self._errors.append(f"health_evaluation: {e}")
            return 0.0

    def _run_anomalies(self, events: list[dict]) -> list:
        try:
            from anomaly_detector import detect_anomalies_in_events
            return detect_anomalies_in_events(events, metric="agentsSpawned")
        except Exception as e:
            self._errors.append(f"anomaly_detection: {e}")
            return []

    def _run_recommendations(self, events: list[dict]) -> list:
        try:
            from recommendation_engine import RecommendationEngine
            engine = RecommendationEngine()
            engine.load_from_events(events)
            return engine.recommend(n=5)
        except Exception as e:
            self._errors.append(f"recommendations: {e}")
            return []

    def _run_bottlenecks(self, events: list[dict]) -> int:
        try:
            from bottleneck_analyzer import BottleneckAnalyzer
            analyzer = BottleneckAnalyzer()
            report = analyzer.analyze(events)
            return len(report.bottlenecks)
        except Exception as e:
            self._errors.append(f"bottleneck_analysis: {e}")
            return 0

    def _run_reflexion(self, events: list[dict], health_score: float) -> float | None:
        try:
            from reflexion import ReflexionEngine
            engine = ReflexionEngine()
            entry = engine.run_cycle(events, health_score)
            return entry.score
        except Exception as e:
            self._errors.append(f"reflexion: {e}")
            return None

    def _run_knowledge_graph(self, events: list[dict]) -> tuple[int, int]:
        try:
            from knowledge_graph import KnowledgeGraph
            kg = KnowledgeGraph()
            kg.build_from_events(events)
            stats = kg.stats()
            return stats["node_count"], stats["edge_count"]
        except Exception as e:
            self._errors.append(f"knowledge_graph: {e}")
            return 0, 0

    def _run_dashboard(
        self,
        events: list[dict],
        patterns: list,
        health_score: float,
        anomalies: list,
        recommendations: list,
        bottleneck_count: int,
        reflection_score: float | None,
    ) -> tuple[float, str]:
        try:
            from evolution_dashboard import EvolutionDashboard
            dashboard = EvolutionDashboard()
            report = dashboard.generate(
                events=events,
                patterns=patterns,
                anomalies=anomalies,
                recommendations=recommendations,
            )
            return report.overall_score, report.overall_status
        except Exception as e:
            self._errors.append(f"dashboard: {e}")
            return 50.0, "unknown"

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def _save_result(self, result: IntegrationResult) -> None:
        if not self.repo_path:
            return
        out_dir = self.repo_path / "evolution"
        out_dir.mkdir(parents=True, exist_ok=True)
        ts_slug = result.timestamp[:19].replace(":", "-")
        path = out_dir / f"integration-{ts_slug}.json"
        try:
            path.write_text(
                json.dumps(result.to_dict(), indent=2, ensure_ascii=False),
                encoding="utf-8",
            )
            logger.info("Integration result saved to %s", path)
        except Exception as e:
            logger.error("Failed to save integration result: %s", e)

    # ------------------------------------------------------------------
    # Subsystem verification (used by CI gate)
    # ------------------------------------------------------------------

    @staticmethod
    def verify_subsystems() -> dict[str, bool]:
        """Import-check every subsystem. Returns {name: importable}."""
        modules = {
            "evolution_engine": "evolution_engine",
            "self_evaluator": "self_evaluator",
            "anomaly_detector": "anomaly_detector",
            "recommendation_engine": "recommendation_engine",
            "bottleneck_analyzer": "bottleneck_analyzer",
            "reflexion": "reflexion",
            "knowledge_graph": "knowledge_graph",
            "experience_sharing": "experience_sharing",
            "prompt_optimizer": "prompt_optimizer",
            "memory_model": "memory_model",
            "code_health_scorer": "code_health_scorer",
            "evolution_dashboard": "evolution_dashboard",
            "module_registry": "module_registry",
            "self_modifier": "self_modifier",
            "daemon": "daemon",
        }
        import importlib
        results: dict[str, bool] = {}
        for label, mod_name in modules.items():
            try:
                importlib.import_module(mod_name)
                results[label] = True
            except Exception:
                results[label] = False
        return results
