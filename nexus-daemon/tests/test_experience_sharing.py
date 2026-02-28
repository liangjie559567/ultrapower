"""Tests for the experience_sharing module."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

nx = pytest.importorskip("networkx")

from knowledge_graph import KnowledgeEdge, KnowledgeGraph, KnowledgeNode
from experience_sharing import ExperienceRecord, ExperienceStore, ExperiencePropagator


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_store(max_per_agent: int = 100) -> ExperienceStore:
    return ExperienceStore(max_per_agent=max_per_agent)


def _make_propagator(
    max_per_agent: int = 100,
) -> tuple[ExperiencePropagator, ExperienceStore, KnowledgeGraph]:
    store = ExperienceStore(max_per_agent=max_per_agent)
    graph = KnowledgeGraph()
    prop = ExperiencePropagator(store, graph)
    return prop, store, graph


def _success_event(agents: list[str], skills: list[str] | None = None) -> dict:
    return {
        "agentTypes": agents,
        "skillsTriggered": skills or [],
        "toolCalls": [],
        "modesUsed": [],
        "errors": [],
        "agentsSpawned": len(agents),
        "agentsCompleted": len(agents),
        "taskContext": "test task",
    }


def _failure_event(agents: list[str], errors: list[dict] | None = None) -> dict:
    return {
        "agentTypes": agents,
        "skillsTriggered": [],
        "toolCalls": [],
        "modesUsed": [],
        "errors": errors or [{"type": "TimeoutError", "message": "timed out"}],
        "agentsSpawned": len(agents),
        "agentsCompleted": 0,
        "taskContext": "failing task",
    }


# ---------------------------------------------------------------------------
# ExperienceRecord
# ---------------------------------------------------------------------------

class TestExperienceRecord:
    def test_defaults(self):
        rec = ExperienceRecord(agent_type="executor", task_context="ctx", outcome="success")
        assert rec.lessons == []
        assert rec.metadata == {}
        assert 0.0 <= rec.confidence <= 1.0
        assert rec.timestamp  # non-empty ISO string

    def test_to_dict_from_dict_roundtrip(self):
        rec = ExperienceRecord(
            agent_type="planner",
            task_context="plan a feature",
            outcome="failure",
            lessons=["lesson A", "lesson B"],
            confidence=0.3,
            metadata={"error_types": ["ValueError"]},
        )
        d = rec.to_dict()
        restored = ExperienceRecord.from_dict(d)
        assert restored.agent_type == rec.agent_type
        assert restored.task_context == rec.task_context
        assert restored.outcome == rec.outcome
        assert restored.lessons == rec.lessons
        assert restored.confidence == rec.confidence
        assert restored.metadata == rec.metadata
        assert restored.timestamp == rec.timestamp


# ---------------------------------------------------------------------------
# ExperienceStore
# ---------------------------------------------------------------------------

class TestExperienceStore:
    def test_add_and_get_for_agent(self):
        store = _make_store()
        rec = ExperienceRecord(agent_type="executor", task_context="t", outcome="success")
        store.add(rec)
        results = store.get_for_agent("executor")
        assert len(results) == 1
        assert results[0].agent_type == "executor"

    def test_get_for_agent_unknown_returns_empty(self):
        store = _make_store()
        assert store.get_for_agent("nonexistent") == []

    def test_max_per_agent_fifo_eviction(self):
        store = _make_store(max_per_agent=3)
        for i in range(5):
            store.add(ExperienceRecord(
                agent_type="executor",
                task_context=f"ctx-{i}",
                outcome="success",
            ))
        results = store.get_for_agent("executor")
        assert len(results) == 3
        # Oldest (ctx-0, ctx-1) should be evicted; newest 3 remain
        contexts = [r.task_context for r in results]
        assert "ctx-0" not in contexts
        assert "ctx-4" in contexts

    def test_outcome_filter(self):
        store = _make_store()
        store.add(ExperienceRecord(agent_type="a", task_context="t1", outcome="success"))
        store.add(ExperienceRecord(agent_type="a", task_context="t2", outcome="failure"))
        store.add(ExperienceRecord(agent_type="a", task_context="t3", outcome="partial"))
        assert len(store.get_for_agent("a", outcome="success")) == 1
        assert len(store.get_for_agent("a", outcome="failure")) == 1
        assert len(store.get_for_agent("a", outcome="partial")) == 1
        assert len(store.get_for_agent("a")) == 3

    def test_get_recent_cross_agent_sorted(self):
        import time
        store = _make_store()
        store.add(ExperienceRecord(
            agent_type="a", task_context="old", outcome="success",
            timestamp="2024-01-01T00:00:00+00:00",
        ))
        store.add(ExperienceRecord(
            agent_type="b", task_context="new", outcome="success",
            timestamp="2025-01-01T00:00:00+00:00",
        ))
        recent = store.get_recent(n=2)
        assert recent[0].task_context == "new"
        assert recent[1].task_context == "old"

    def test_get_recent_respects_n(self):
        store = _make_store()
        for i in range(10):
            store.add(ExperienceRecord(agent_type="x", task_context=f"t{i}", outcome="success"))
        assert len(store.get_recent(n=3)) == 3

    def test_serialization_roundtrip(self):
        store = _make_store(max_per_agent=50)
        store.add(ExperienceRecord(
            agent_type="executor", task_context="ctx", outcome="success",
            lessons=["works"], confidence=0.9,
        ))
        d = store.to_dict()
        restored = ExperienceStore.from_dict(d)
        results = restored.get_for_agent("executor")
        assert len(results) == 1
        assert results[0].lessons == ["works"]
        assert restored._max == 50


# ---------------------------------------------------------------------------
# ExperiencePropagator
# ---------------------------------------------------------------------------

class TestExperiencePropagatorRecordExperience:
    def test_record_success_event(self):
        prop, store, graph = _make_propagator()
        event = _success_event(["executor", "planner"])
        records = prop.record_experience(event)
        assert len(records) == 2
        outcomes = {r.outcome for r in records}
        assert outcomes == {"success"}

    def test_record_failure_event(self):
        prop, store, graph = _make_propagator()
        event = _failure_event(["executor"], [{"type": "TimeoutError"}])
        records = prop.record_experience(event)
        assert len(records) == 1
        assert records[0].outcome == "failure"
        assert "TimeoutError" in records[0].metadata.get("error_types", [])

    def test_record_empty_agents_returns_empty(self):
        prop, store, graph = _make_propagator()
        records = prop.record_experience({"agentTypes": [], "errors": []})
        assert records == []

    def test_record_updates_graph_nodes(self):
        prop, store, graph = _make_propagator()
        prop.record_experience(_success_event(["executor"]))
        assert graph.get_node("agent:executor") is not None

    def test_record_adds_co_occurs_with_edge(self):
        prop, store, graph = _make_propagator()
        prop.record_experience(_success_event(["executor", "planner"]))
        neighbors = graph.get_neighbors("agent:executor", relation="co_occurs_with")
        neighbor_ids = {n.id for n in neighbors}
        assert "agent:planner" in neighbor_ids

    def test_record_adds_causes_edge_on_failure(self):
        prop, store, graph = _make_propagator()
        prop.record_experience(_failure_event(["executor"], [{"type": "OOMError"}]))
        neighbors = graph.get_neighbors("agent:executor", relation="causes")
        neighbor_ids = {n.id for n in neighbors}
        assert "error:OOMError" in neighbor_ids


class TestExperiencePropagatorPropagate:
    def test_propagate_returns_direct_experiences(self):
        prop, store, graph = _make_propagator()
        prop.record_experience(_success_event(["executor"]))
        results = prop.propagate("executor")
        assert len(results) == 1
        rec, weight = results[0]
        assert rec.agent_type == "executor"
        assert weight == 1.0

    def test_propagate_direct_weight_is_1(self):
        prop, store, graph = _make_propagator()
        prop.record_experience(_success_event(["executor"]))
        results = prop.propagate("executor")
        weights = [w for _, w in results]
        assert all(w == 1.0 for w in weights)

    def test_propagate_hop1_weight_is_0_7(self):
        prop, store, graph = _make_propagator()
        # executor and planner co-occur -> 1-hop neighbors
        prop.record_experience(_success_event(["executor", "planner"]))
        # Now ask for planner's propagated experiences
        # executor has 1 record; planner is 1-hop from executor
        results = prop.propagate("planner")
        # planner's own direct record weight=1.0, executor's record via hop1 weight=0.7
        weights = {w for _, w in results}
        assert 1.0 in weights
        assert 0.7 in weights

    def test_propagate_hop2_weight_is_0_4(self):
        prop, store, graph = _make_propagator()
        # Build chain: executor <-> planner <-> architect
        prop.record_experience(_success_event(["executor", "planner"]))
        prop.record_experience(_success_event(["planner", "architect"]))
        # executor is 2 hops from architect
        results = prop.propagate("architect")
        weights = {w for _, w in results}
        assert 0.4 in weights

    def test_propagate_empty_store_returns_empty(self):
        prop, store, graph = _make_propagator()
        results = prop.propagate("executor")
        assert results == []

    def test_propagate_unknown_agent_returns_empty(self):
        prop, store, graph = _make_propagator()
        prop.record_experience(_success_event(["executor"]))
        results = prop.propagate("nonexistent_agent")
        assert results == []

    def test_propagate_sorted_by_weight_desc(self):
        prop, store, graph = _make_propagator()
        prop.record_experience(_success_event(["executor", "planner"]))
        results = prop.propagate("planner")
        weights = [w for _, w in results]
        assert weights == sorted(weights, reverse=True)


class TestExperiencePropagatorPatterns:
    def test_get_failure_patterns_aggregates(self):
        prop, store, graph = _make_propagator()
        prop.record_experience(_failure_event(["executor"], [{"type": "TimeoutError"}]))
        prop.record_experience(_failure_event(["executor"], [{"type": "TimeoutError"}]))
        prop.record_experience(_failure_event(["executor"], [{"type": "OOMError"}]))
        patterns = prop.get_failure_patterns("executor")
        assert len(patterns) >= 1
        timeout_pattern = next((p for p in patterns if p["error_type"] == "TimeoutError"), None)
        assert timeout_pattern is not None
        assert timeout_pattern["count"] == 2

    def test_get_failure_patterns_empty_agent(self):
        prop, store, graph = _make_propagator()
        patterns = prop.get_failure_patterns("nonexistent")
        assert patterns == []

    def test_get_success_strategies_aggregates(self):
        prop, store, graph = _make_propagator()
        prop.record_experience(_success_event(["executor"]))
        prop.record_experience(_success_event(["executor"]))
        strategies = prop.get_success_strategies("executor")
        assert len(strategies) >= 1
        assert all("lesson" in s for s in strategies)
        assert all("avg_confidence" in s for s in strategies)

    def test_get_success_strategies_empty_agent(self):
        prop, store, graph = _make_propagator()
        strategies = prop.get_success_strategies("nonexistent")
        assert strategies == []


class TestExperiencePropagatorIngestAndStats:
    def test_ingest_events_returns_count(self):
        prop, store, graph = _make_propagator()
        events = [
            _success_event(["executor", "planner"]),
            _failure_event(["executor"]),
        ]
        count = prop.ingest_events(events)
        # 2 agents in event1 + 1 agent in event2
        assert count == 3

    def test_ingest_events_empty_list(self):
        prop, store, graph = _make_propagator()
        assert prop.ingest_events([]) == 0

    def test_stats_returns_correct_totals(self):
        prop, store, graph = _make_propagator()
        prop.ingest_events([
            _success_event(["executor"]),
            _failure_event(["planner"]),
        ])
        s = prop.stats()
        assert s["total_records"] == 2
        assert s["by_outcome"]["success"] == 1
        assert s["by_outcome"]["failure"] == 1
        assert s["agent_count"] == 2
        assert "graph_stats" in s

    def test_stats_empty(self):
        prop, store, graph = _make_propagator()
        s = prop.stats()
        assert s["total_records"] == 0
        assert s["agent_count"] == 0


# ---------------------------------------------------------------------------
# Integration tests
# ---------------------------------------------------------------------------

class TestIntegration:
    def test_full_flow_with_knowledge_graph(self):
        """Full integration: ingest events, propagate, verify graph updated."""
        store = ExperienceStore()
        graph = KnowledgeGraph()
        prop = ExperiencePropagator(store, graph)

        events = [
            _success_event(["executor", "planner", "architect"]),
            _failure_event(["executor"], [{"type": "TimeoutError"}]),
        ]
        count = prop.ingest_events(events)
        assert count == 4  # 3 + 1

        # Graph should have agent nodes
        assert graph.get_node("agent:executor") is not None
        assert graph.get_node("agent:planner") is not None

        # Propagate for architect: should get direct + hop1 (executor, planner)
        results = prop.propagate("architect")
        assert len(results) > 0
        weights = {w for _, w in results}
        assert 1.0 in weights  # direct

    def test_graph_structure_updated_after_propagation(self):
        """After recording experiences, graph edges reflect co-occurrence."""
        store = ExperienceStore()
        graph = KnowledgeGraph()
        prop = ExperiencePropagator(store, graph)

        prop.record_experience(_success_event(["executor", "planner"]))
        # executor and planner should be connected
        path = graph.find_path("agent:executor", "agent:planner")
        assert path is not None

    def test_serialization_deserialization_full_roundtrip(self):
        """Store serializes and restores all records correctly."""
        store = ExperienceStore(max_per_agent=50)
        graph = KnowledgeGraph()
        prop = ExperiencePropagator(store, graph)

        prop.ingest_events([
            _success_event(["executor"]),
            _failure_event(["planner"], [{"type": "ValueError"}]),
        ])

        # Serialize store
        d = store.to_dict()
        restored_store = ExperienceStore.from_dict(d)

        executor_recs = restored_store.get_for_agent("executor")
        planner_recs = restored_store.get_for_agent("planner")
        assert len(executor_recs) == 1
        assert len(planner_recs) == 1
        assert executor_recs[0].outcome == "success"
        assert planner_recs[0].outcome == "failure"
