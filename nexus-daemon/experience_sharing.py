"""
Cross-agent experience propagation module for nexus-daemon.

Lets one agent's success/failure experiences be leveraged by other agents
via the KnowledgeGraph structure.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from knowledge_graph import KnowledgeEdge, KnowledgeGraph, KnowledgeNode

logger = logging.getLogger("nexus.experience_sharing")

# Relevance weights for propagation hops
_WEIGHT_DIRECT: float = 1.0
_WEIGHT_HOP1: float = 0.7
_WEIGHT_HOP2: float = 0.4


@dataclass
class ExperienceRecord:
    """Single experience record produced by an agent."""

    agent_type: str
    task_context: str
    outcome: str  # "success" | "failure" | "partial"
    lessons: list[str] = field(default_factory=list)
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    confidence: float = 0.5
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "agent_type": self.agent_type,
            "task_context": self.task_context,
            "outcome": self.outcome,
            "lessons": list(self.lessons),
            "timestamp": self.timestamp,
            "confidence": self.confidence,
            "metadata": dict(self.metadata),
        }

    @classmethod
    def from_dict(cls, data: dict) -> ExperienceRecord:
        return cls(
            agent_type=data.get("agent_type", ""),
            task_context=data.get("task_context", ""),
            outcome=data.get("outcome", ""),
            lessons=list(data.get("lessons", [])),
            timestamp=data.get("timestamp", datetime.now(timezone.utc).isoformat()),
            confidence=float(data.get("confidence", 0.5)),
            metadata=dict(data.get("metadata", {})),
        )


class ExperienceStore:
    """Experience store with per-agent FIFO eviction and outcome filtering."""

    def __init__(self, max_per_agent: int = 100) -> None:
        self._max = max_per_agent
        self._records: dict[str, list[ExperienceRecord]] = defaultdict(list)

    def add(self, record: ExperienceRecord) -> None:
        """Add a record; evict oldest if over capacity."""
        bucket = self._records[record.agent_type]
        bucket.append(record)
        if len(bucket) > self._max:
            self._records[record.agent_type] = bucket[-self._max :]

    def get_for_agent(
        self, agent_type: str, outcome: str | None = None
    ) -> list[ExperienceRecord]:
        """Return records for an agent, optionally filtered by outcome."""
        records = list(self._records.get(agent_type, []))
        if outcome is not None:
            records = [r for r in records if r.outcome == outcome]
        return records

    def get_recent(self, n: int = 10) -> list[ExperienceRecord]:
        """Return n most recent records across all agents, sorted by timestamp desc."""
        all_records: list[ExperienceRecord] = []
        for bucket in self._records.values():
            all_records.extend(bucket)
        all_records.sort(key=lambda r: r.timestamp, reverse=True)
        return all_records[:n]

    def to_dict(self) -> dict:
        return {
            "max_per_agent": self._max,
            "records": {
                agent: [r.to_dict() for r in recs]
                for agent, recs in self._records.items()
            },
        }

    @classmethod
    def from_dict(cls, data: dict) -> ExperienceStore:
        store = cls(max_per_agent=data.get("max_per_agent", 100))
        for agent, recs in data.get("records", {}).items():
            for r in recs:
                rec = ExperienceRecord.from_dict(r)
                store._records[agent].append(rec)
        return store


class ExperiencePropagator:
    """Cross-agent experience propagation engine backed by KnowledgeGraph."""

    def __init__(self, store: ExperienceStore, graph: KnowledgeGraph) -> None:
        self._store = store
        self._graph = graph

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _determine_outcome(event: dict) -> str:
        errors = event.get("errors", [])
        spawned = event.get("agentsSpawned", 0)
        completed = event.get("agentsCompleted", 0)
        has_errors = bool(errors)
        if spawned > 0:
            if completed >= spawned and not has_errors:
                return "success"
            if completed > 0:
                return "partial"
            return "failure"
        return "failure" if has_errors else "success"

    @staticmethod
    def _extract_lessons(event: dict, outcome: str) -> list[str]:
        lessons: list[str] = []
        errors = event.get("errors", [])
        if outcome == "success":
            agents = event.get("agentTypes", [])
            if agents:
                lessons.append(f"Agents {agents} completed successfully together.")
            skills = event.get("skillsTriggered", [])
            if skills:
                lessons.append(f"Skills {skills} were effective.")
        else:
            for err in errors:
                if isinstance(err, dict):
                    msg = err.get("message", err.get("type", str(err)))
                else:
                    msg = str(err)
                lessons.append(f"Error encountered: {msg}")
        return lessons

    @staticmethod
    def _build_metadata(event: dict, outcome: str) -> dict:
        meta: dict[str, Any] = {"outcome": outcome}
        errors = event.get("errors", [])
        if errors:
            error_types = []
            for e in errors:
                if isinstance(e, dict):
                    error_types.append(e.get("type", e.get("message", "unknown")))
                else:
                    error_types.append(str(e))
            meta["error_types"] = error_types
        duration = event.get("duration")
        if duration is not None:
            meta["duration"] = duration
        return meta

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def record_experience(self, event: dict) -> list[ExperienceRecord]:
        """Extract ExperienceRecords from an event and update the graph."""
        agents: list[str] = event.get("agentTypes", [])
        if not agents:
            return []

        outcome = self._determine_outcome(event)
        lessons = self._extract_lessons(event, outcome)
        metadata = self._build_metadata(event, outcome)
        confidence = 0.8 if outcome == "success" else (0.5 if outcome == "partial" else 0.3)
        task_context = event.get("taskContext", event.get("task_context", ""))
        ts = datetime.now(timezone.utc).isoformat()

        records: list[ExperienceRecord] = []
        for agent in agents:
            rec = ExperienceRecord(
                agent_type=agent,
                task_context=task_context,
                outcome=outcome,
                lessons=list(lessons),
                timestamp=ts,
                confidence=confidence,
                metadata=dict(metadata),
            )
            self._store.add(rec)
            records.append(rec)

            # Update graph: ensure agent node exists
            self._graph.add_node(KnowledgeNode(
                id=f"agent:{agent}",
                node_type="agent",
                confidence=confidence,
            ))

        # Add co_occurs_with edges between agents in this event
        from itertools import combinations
        for a1, a2 in combinations(sorted(set(agents)), 2):
            # Bidirectional: co_occurs_with is symmetric
            self._graph.add_edge(KnowledgeEdge(
                source=f"agent:{a1}",
                target=f"agent:{a2}",
                relation="co_occurs_with",
            ))
            self._graph.add_edge(KnowledgeEdge(
                source=f"agent:{a2}",
                target=f"agent:{a1}",
                relation="co_occurs_with",
            ))

        # Add causes edges for errors
        errors = event.get("errors", [])
        for err in errors:
            if isinstance(err, dict):
                err_type = err.get("type", err.get("message", "unknown"))
            else:
                err_type = str(err)
            self._graph.add_node(KnowledgeNode(
                id=f"error:{err_type}", node_type="error", confidence=0.8
            ))
            for agent in agents:
                self._graph.add_edge(KnowledgeEdge(
                    source=f"agent:{agent}",
                    target=f"error:{err_type}",
                    relation="causes",
                ))

        return records

    def propagate(
        self, target_agent: str, task_context: dict | None = None
    ) -> list[tuple[ExperienceRecord, float]]:
        """Return relevant experiences for target_agent with relevance scores.

        Scoring:
          - Direct (own) experiences: weight 1.0
          - 1-hop graph neighbors:    weight 0.7
          - 2-hop graph neighbors:    weight 0.4
        """
        scored: list[tuple[ExperienceRecord, float]] = []

        # 1. Direct experiences
        for rec in self._store.get_for_agent(target_agent):
            scored.append((rec, _WEIGHT_DIRECT))

        # 2. Graph-based propagation
        related = self._graph.query_related(f"agent:{target_agent}", max_depth=2)
        for depth_str, nodes in related.items():
            depth = int(depth_str)
            weight = _WEIGHT_HOP1 if depth == 1 else _WEIGHT_HOP2
            for node in nodes:
                if not node.id.startswith("agent:"):
                    continue
                neighbor_agent = node.id[len("agent:"):]
                for rec in self._store.get_for_agent(neighbor_agent):
                    scored.append((rec, weight))

        # Sort by weight desc, then timestamp desc
        scored.sort(key=lambda x: (x[1], x[0].timestamp), reverse=True)
        return scored

    def get_failure_patterns(self, agent_type: str) -> list[dict]:
        """Aggregate failure experiences into error-type frequency summary."""
        failures = self._store.get_for_agent(agent_type, outcome="failure")
        counter: dict[str, int] = defaultdict(int)
        for rec in failures:
            for err_type in rec.metadata.get("error_types", []):
                counter[err_type] += 1
            if not rec.metadata.get("error_types"):
                counter["unknown"] += 1

        patterns = [
            {"error_type": k, "count": v, "agent_type": agent_type}
            for k, v in sorted(counter.items(), key=lambda x: x[1], reverse=True)
        ]
        return patterns

    def get_success_strategies(self, agent_type: str) -> list[dict]:
        """Aggregate success experiences into high-confidence strategy summaries."""
        successes = self._store.get_for_agent(agent_type, outcome="success")
        lesson_scores: dict[str, list[float]] = defaultdict(list)
        for rec in successes:
            for lesson in rec.lessons:
                lesson_scores[lesson].append(rec.confidence)

        strategies = []
        for lesson, scores in lesson_scores.items():
            avg_conf = sum(scores) / len(scores)
            strategies.append({
                "lesson": lesson,
                "occurrences": len(scores),
                "avg_confidence": round(avg_conf, 4),
                "agent_type": agent_type,
            })
        strategies.sort(key=lambda x: (x["avg_confidence"], x["occurrences"]), reverse=True)
        return strategies

    def ingest_events(self, events: list[dict]) -> int:
        """Batch-ingest events; return total number of ExperienceRecords created."""
        total = 0
        for event in events:
            records = self.record_experience(event)
            total += len(records)
        return total

    def stats(self) -> dict:
        """Return summary statistics."""
        all_records: list[ExperienceRecord] = []
        for bucket in self._store._records.values():
            all_records.extend(bucket)

        by_outcome: dict[str, int] = defaultdict(int)
        by_agent: dict[str, int] = defaultdict(int)
        for rec in all_records:
            by_outcome[rec.outcome] += 1
            by_agent[rec.agent_type] += 1

        return {
            "total_records": len(all_records),
            "by_outcome": dict(by_outcome),
            "by_agent": dict(by_agent),
            "agent_count": len(self._store._records),
            "graph_stats": self._graph.stats(),
        }
