"""Tests for the knowledge_graph module."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

nx = pytest.importorskip("networkx")

from knowledge_graph import KnowledgeEdge, KnowledgeGraph, KnowledgeNode


# ---------------------------------------------------------------------------
# KnowledgeNode / KnowledgeEdge dataclass tests
# ---------------------------------------------------------------------------


class TestKnowledgeNode:
    def test_node_defaults(self):
        node = KnowledgeNode(id="agent:executor", node_type="agent")
        assert node.id == "agent:executor"
        assert node.node_type == "agent"
        assert node.properties == {}
        assert node.confidence == 0.5
        assert node.last_updated  # non-empty

    def test_node_custom_properties(self):
        node = KnowledgeNode(
            id="tool:Read",
            node_type="tool",
            properties={"category": "filesystem"},
            confidence=0.9,
        )
        assert node.properties["category"] == "filesystem"
        assert node.confidence == 0.9


class TestKnowledgeEdge:
    def test_edge_defaults(self):
        edge = KnowledgeEdge(source="a", target="b", relation="uses")
        assert edge.source == "a"
        assert edge.target == "b"
        assert edge.relation == "uses"
        assert edge.weight == 1.0
        assert edge.evidence_count == 1
        assert edge.properties == {}


# ---------------------------------------------------------------------------
# KnowledgeGraph core tests
# ---------------------------------------------------------------------------


class TestKnowledgeGraphCore:
    def test_add_and_get_node(self):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(id="agent:executor", node_type="agent"))
        node = g.get_node("agent:executor")
        assert node is not None
        assert node.node_type == "agent"
        assert node.confidence == 0.5

    def test_add_node_merges_existing(self):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(
            id="agent:executor", node_type="agent",
            properties={"version": "1"}, confidence=0.5,
        ))
        g.add_node(KnowledgeNode(
            id="agent:executor", node_type="agent",
            properties={"tier": "high"}, confidence=0.9,
        ))
        node = g.get_node("agent:executor")
        assert node is not None
        # Properties merged
        assert node.properties["version"] == "1"
        assert node.properties["tier"] == "high"
        # Confidence: EMA = 0.7 * 0.5 + 0.3 * 0.9 = 0.62
        assert abs(node.confidence - 0.62) < 0.01

    def test_add_and_get_edge(self):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(id="a", node_type="agent"))
        g.add_node(KnowledgeNode(id="b", node_type="skill"))
        g.add_edge(KnowledgeEdge(source="a", target="b", relation="uses"))
        edges = g.get_edges("a", direction="out")
        assert len(edges) == 1
        assert edges[0].relation == "uses"

    def test_add_edge_strengthens_existing(self):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(id="a", node_type="agent"))
        g.add_node(KnowledgeNode(id="b", node_type="skill"))
        g.add_edge(KnowledgeEdge(source="a", target="b", relation="uses", weight=1.0))
        g.add_edge(KnowledgeEdge(source="a", target="b", relation="uses", weight=1.0))
        edges = g.get_edges("a", direction="out")
        assert len(edges) == 1
        assert edges[0].evidence_count == 2
        assert edges[0].weight > 1.0  # weight increased

    def test_get_neighbors(self):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(id="a", node_type="agent"))
        g.add_node(KnowledgeNode(id="b", node_type="skill"))
        g.add_node(KnowledgeNode(id="c", node_type="tool"))
        g.add_edge(KnowledgeEdge(source="a", target="b", relation="uses"))
        g.add_edge(KnowledgeEdge(source="a", target="c", relation="triggers"))
        neighbors = g.get_neighbors("a")
        assert len(neighbors) == 2

    def test_get_neighbors_filtered_by_relation(self):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(id="a", node_type="agent"))
        g.add_node(KnowledgeNode(id="b", node_type="skill"))
        g.add_node(KnowledgeNode(id="c", node_type="tool"))
        g.add_edge(KnowledgeEdge(source="a", target="b", relation="uses"))
        g.add_edge(KnowledgeEdge(source="a", target="c", relation="triggers"))
        neighbors = g.get_neighbors("a", relation="uses")
        assert len(neighbors) == 1
        assert neighbors[0].id == "b"

    def test_get_edges_direction(self):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(id="a", node_type="agent"))
        g.add_node(KnowledgeNode(id="b", node_type="skill"))
        g.add_edge(KnowledgeEdge(source="a", target="b", relation="uses"))
        assert len(g.get_edges("a", direction="out")) == 1
        assert len(g.get_edges("a", direction="in")) == 0
        assert len(g.get_edges("b", direction="in")) == 1
        assert len(g.get_edges("b", direction="both")) == 1
        assert len(g.get_edges("a", direction="both")) == 1

    def test_find_path(self):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(id="a", node_type="agent"))
        g.add_node(KnowledgeNode(id="b", node_type="skill"))
        g.add_node(KnowledgeNode(id="c", node_type="tool"))
        g.add_edge(KnowledgeEdge(source="a", target="b", relation="uses"))
        g.add_edge(KnowledgeEdge(source="b", target="c", relation="triggers"))
        path = g.find_path("a", "c")
        assert path == ["a", "b", "c"]

    def test_find_path_no_connection(self):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(id="a", node_type="agent"))
        g.add_node(KnowledgeNode(id="b", node_type="skill"))
        assert g.find_path("a", "b") is None

    def test_get_node_nonexistent(self):
        g = KnowledgeGraph()
        assert g.get_node("nope") is None

    def test_get_neighbors_nonexistent_node(self):
        g = KnowledgeGraph()
        assert g.get_neighbors("nope") == []


# ---------------------------------------------------------------------------
# Query tests
# ---------------------------------------------------------------------------


class TestKnowledgeGraphQueries:
    def test_get_subgraph_by_type(self):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(id="agent:exec", node_type="agent"))
        g.add_node(KnowledgeNode(id="agent:debug", node_type="agent"))
        g.add_node(KnowledgeNode(id="tool:Read", node_type="tool"))
        agents = g.get_subgraph("agent")
        assert len(agents) == 2
        assert all(n.node_type == "agent" for n in agents)

    def test_get_most_connected(self):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(id="a", node_type="agent"))
        g.add_node(KnowledgeNode(id="b", node_type="skill"))
        g.add_node(KnowledgeNode(id="c", node_type="tool"))
        g.add_node(KnowledgeNode(id="d", node_type="tool"))
        g.add_edge(KnowledgeEdge(source="a", target="b", relation="uses"))
        g.add_edge(KnowledgeEdge(source="a", target="c", relation="uses"))
        g.add_edge(KnowledgeEdge(source="a", target="d", relation="uses"))
        g.add_edge(KnowledgeEdge(source="b", target="c", relation="triggers"))
        top = g.get_most_connected(n=2)
        # "a" has degree 3 (3 out-edges), should be first
        assert top[0][0] == "a"
        assert top[0][1] == 3

    def test_get_most_connected_filtered_by_type(self):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(id="a", node_type="agent"))
        g.add_node(KnowledgeNode(id="b", node_type="tool"))
        g.add_node(KnowledgeNode(id="c", node_type="tool"))
        g.add_edge(KnowledgeEdge(source="a", target="b", relation="uses"))
        g.add_edge(KnowledgeEdge(source="a", target="c", relation="uses"))
        top = g.get_most_connected(node_type="tool", n=5)
        assert all(
            g.get_node(nid).node_type == "tool" for nid, _ in top
        )

    def test_query_related_bfs(self):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(id="a", node_type="agent"))
        g.add_node(KnowledgeNode(id="b", node_type="skill"))
        g.add_node(KnowledgeNode(id="c", node_type="tool"))
        g.add_edge(KnowledgeEdge(source="a", target="b", relation="uses"))
        g.add_edge(KnowledgeEdge(source="b", target="c", relation="triggers"))
        related = g.query_related("a", max_depth=2)
        assert "1" in related
        assert "2" in related
        assert any(n.id == "b" for n in related["1"])
        assert any(n.id == "c" for n in related["2"])

    def test_query_related_nonexistent(self):
        g = KnowledgeGraph()
        assert g.query_related("nope") == {}

    def test_get_recommendations_for(self):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(id="a", node_type="agent", confidence=0.8))
        g.add_node(KnowledgeNode(id="b", node_type="skill", confidence=0.9))
        g.add_node(KnowledgeNode(id="c", node_type="tool", confidence=0.3))
        g.add_edge(KnowledgeEdge(
            source="a", target="b", relation="uses",
            weight=2.0, evidence_count=5,
        ))
        g.add_edge(KnowledgeEdge(
            source="a", target="c", relation="uses",
            weight=1.0, evidence_count=1,
        ))
        recs = g.get_recommendations_for("a")
        assert len(recs) == 2
        # b should score higher: 2.0 * 5 * 0.9 = 9.0 vs c: 1.0 * 1 * 0.3 = 0.3
        assert recs[0][0] == "b"
        assert recs[0][1] > recs[1][1]

    def test_get_recommendations_nonexistent(self):
        g = KnowledgeGraph()
        assert g.get_recommendations_for("nope") == []


# ---------------------------------------------------------------------------
# Event ingestion tests
# ---------------------------------------------------------------------------


class TestBuildFromEvents:
    def test_build_from_events_creates_agent_nodes(self):
        g = KnowledgeGraph()
        events = [
            {
                "agentTypes": ["executor", "verifier"],
                "agentsSpawned": 2,
                "agentsCompleted": 2,
                "errors": [],
            },
        ]
        g.build_from_events(events)
        assert g.get_node("agent:executor") is not None
        assert g.get_node("agent:verifier") is not None
        assert g.get_node("agent:executor").node_type == "agent"

    def test_build_from_events_creates_cooccurrence_edges(self):
        g = KnowledgeGraph()
        events = [
            {
                "agentTypes": ["executor", "verifier"],
                "agentsSpawned": 2,
                "agentsCompleted": 2,
                "errors": [],
            },
        ]
        g.build_from_events(events)
        edges = g.get_edges("agent:executor", direction="out")
        cooc = [e for e in edges if e.relation == "co_occurs_with"]
        assert len(cooc) == 1
        assert cooc[0].target == "agent:verifier"

    def test_build_from_events_handles_errors(self):
        g = KnowledgeGraph()
        events = [
            {
                "agentTypes": ["executor"],
                "agentsSpawned": 1,
                "agentsCompleted": 0,
                "errors": [{"type": "timeout", "message": "Agent timed out"}],
            },
        ]
        g.build_from_events(events)
        err_node = g.get_node("error:timeout")
        assert err_node is not None
        assert err_node.node_type == "error"
        edges = g.get_edges("agent:executor", direction="out")
        causes = [e for e in edges if e.relation == "causes"]
        assert len(causes) == 1

    def test_build_from_events_increments_evidence(self):
        g = KnowledgeGraph()
        events = [
            {
                "agentTypes": ["executor", "verifier"],
                "agentsSpawned": 2,
                "agentsCompleted": 2,
                "errors": [],
            },
            {
                "agentTypes": ["executor", "verifier"],
                "agentsSpawned": 2,
                "agentsCompleted": 2,
                "errors": [],
            },
        ]
        g.build_from_events(events)
        edges = g.get_edges("agent:executor", direction="out")
        cooc = [e for e in edges if e.relation == "co_occurs_with"]
        assert len(cooc) == 1
        assert cooc[0].evidence_count == 2

    def test_build_from_events_creates_mode_uses_edges(self):
        g = KnowledgeGraph()
        events = [
            {
                "modesUsed": ["ultrawork"],
                "agentTypes": ["executor"],
                "skillsTriggered": ["autopilot"],
                "agentsSpawned": 1,
                "agentsCompleted": 1,
                "errors": [],
            },
        ]
        g.build_from_events(events)
        edges = g.get_edges("mode:ultrawork", direction="out")
        uses = [e for e in edges if e.relation == "uses"]
        targets = {e.target for e in uses}
        assert "agent:executor" in targets
        assert "skill:autopilot" in targets

    def test_build_from_events_creates_triggers_edges(self):
        g = KnowledgeGraph()
        events = [
            {
                "skillsTriggered": ["autopilot"],
                "toolCalls": [{"name": "Read"}, {"name": "Edit"}],
                "errors": [],
            },
        ]
        g.build_from_events(events)
        edges = g.get_edges("skill:autopilot", direction="out")
        triggers = [e for e in edges if e.relation == "triggers"]
        targets = {e.target for e in triggers}
        assert "tool:Read" in targets
        assert "tool:Edit" in targets


# ---------------------------------------------------------------------------
# Serialization tests
# ---------------------------------------------------------------------------


class TestSerialization:
    def test_to_dict_from_dict_round_trip(self):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(id="agent:exec", node_type="agent", confidence=0.8))
        g.add_node(KnowledgeNode(id="skill:auto", node_type="skill", confidence=0.6))
        g.add_edge(KnowledgeEdge(
            source="agent:exec", target="skill:auto",
            relation="uses", weight=2.5, evidence_count=3,
        ))
        data = g.to_dict()
        restored = KnowledgeGraph.from_dict(data)

        node = restored.get_node("agent:exec")
        assert node is not None
        assert node.confidence == 0.8

        edges = restored.get_edges("agent:exec", direction="out")
        assert len(edges) == 1
        assert edges[0].weight == 2.5
        assert edges[0].evidence_count == 3

    def test_save_and_load(self, tmp_path):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(id="agent:exec", node_type="agent"))
        g.add_edge(KnowledgeEdge(
            source="agent:exec", target="agent:exec",
            relation="self_ref", weight=1.0,
        ))
        fpath = tmp_path / "graph.json"
        g.save(fpath)
        assert fpath.exists()

        loaded = KnowledgeGraph.load(fpath)
        assert loaded.get_node("agent:exec") is not None

    def test_load_nonexistent_returns_empty(self, tmp_path):
        fpath = tmp_path / "does_not_exist.json"
        g = KnowledgeGraph.load(fpath)
        assert g.stats()["node_count"] == 0
        assert g.stats()["edge_count"] == 0


# ---------------------------------------------------------------------------
# Stats test
# ---------------------------------------------------------------------------


class TestStats:
    def test_stats_returns_correct_counts(self):
        g = KnowledgeGraph()
        g.add_node(KnowledgeNode(id="agent:exec", node_type="agent"))
        g.add_node(KnowledgeNode(id="agent:debug", node_type="agent"))
        g.add_node(KnowledgeNode(id="tool:Read", node_type="tool"))
        g.add_edge(KnowledgeEdge(
            source="agent:exec", target="tool:Read", relation="uses",
        ))
        s = g.stats()
        assert s["node_count"] == 3
        assert s["edge_count"] == 1
        assert s["by_type"]["agent"] == 2
        assert s["by_type"]["tool"] == 1
        assert 0.0 <= s["density"] <= 1.0
