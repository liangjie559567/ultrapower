"""
Knowledge Graph module for nexus-daemon.

Stores and queries relationships between agents, skills, tools, modes, and patterns.
Uses networkx for graph operations. Foundation for cross-agent experience propagation.
"""

from __future__ import annotations

import json
import logging
import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from itertools import combinations
from pathlib import Path
from typing import Any

logger = logging.getLogger("nexus.knowledge_graph")


@dataclass
class KnowledgeNode:
    """A node in the knowledge graph."""

    id: str
    node_type: str  # "agent", "skill", "tool", "mode", "pattern", "error"
    properties: dict = field(default_factory=dict)
    confidence: float = 0.5
    last_updated: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


@dataclass
class KnowledgeEdge:
    """A relationship between two nodes."""

    source: str
    target: str
    relation: str  # "uses", "triggers", "co_occurs_with", "causes", "improves", "conflicts_with"
    weight: float = 1.0
    evidence_count: int = 1
    properties: dict = field(default_factory=dict)


class KnowledgeGraph:
    """Graph-based knowledge store for nexus-daemon.

    Uses networkx internally for graph operations.
    Persists to JSON for simplicity (no external DB dependency in P1).
    """

    def __init__(self) -> None:
        """Initialize empty graph. Import networkx here."""
        import networkx as nx

        self._graph: nx.DiGraph = nx.DiGraph()

    def add_node(self, node: KnowledgeNode) -> None:
        """Add or update a node. If exists, merge properties and update confidence."""
        if self._graph.has_node(node.id):
            existing = self._graph.nodes[node.id]
            old_conf = existing.get("confidence", 0.5)
            merged_props = {**existing.get("properties", {}), **node.properties}
            self._graph.nodes[node.id].update(
                {
                    "node_type": node.node_type,
                    "properties": merged_props,
                    "confidence": 0.7 * old_conf + 0.3 * node.confidence,
                    "last_updated": datetime.now(timezone.utc).isoformat(),
                }
            )
        else:
            self._graph.add_node(
                node.id,
                node_type=node.node_type,
                properties=node.properties,
                confidence=node.confidence,
                last_updated=node.last_updated,
            )

    def add_edge(self, edge: KnowledgeEdge) -> None:
        """Add or strengthen an edge. If exists, increment evidence_count and update weight."""
        if self._graph.has_edge(edge.source, edge.target):
            edata = self._graph.edges[edge.source, edge.target]
            if edata.get("relation") == edge.relation:
                new_count = edata.get("evidence_count", 1) + 1
                edata["evidence_count"] = new_count
                edata["weight"] = edata["weight"] + math.log(1 + new_count)
                edata["properties"].update(edge.properties)
                return
        # Ensure both endpoints exist as nodes
        if not self._graph.has_node(edge.source):
            self._graph.add_node(edge.source, node_type="unknown", properties={},
                                 confidence=0.5,
                                 last_updated=datetime.now(timezone.utc).isoformat())
        if not self._graph.has_node(edge.target):
            self._graph.add_node(edge.target, node_type="unknown", properties={},
                                 confidence=0.5,
                                 last_updated=datetime.now(timezone.utc).isoformat())
        self._graph.add_edge(
            edge.source,
            edge.target,
            relation=edge.relation,
            weight=edge.weight,
            evidence_count=edge.evidence_count,
            properties=edge.properties,
        )

    def get_node(self, node_id: str) -> KnowledgeNode | None:
        """Get a node by ID."""
        if not self._graph.has_node(node_id):
            return None
        data = self._graph.nodes[node_id]
        return KnowledgeNode(
            id=node_id,
            node_type=data.get("node_type", "unknown"),
            properties=data.get("properties", ),
            confidence=data.get("confidence", 0.5),
            last_updated=data.get("last_updated", ""),
        )

    def get_neighbors(
        self, node_id: str, relation: str | None = None
    ) -> list[KnowledgeNode]:
        """Get neighboring nodes, optionally filtered by relation type."""
        if not self._graph.has_node(node_id):
            return []
        result: list[KnowledgeNode] = []
        for _, target, edata in self._graph.out_edges(node_id, data=True):
            if relation is not None and edata.get("relation") != relation:
                continue
            node = self.get_node(target)
            if node is not None:
                result.append(node)
        return result

    def get_edges(self, node_id: str, direction: str = "out") -> list[KnowledgeEdge]:
        """Get edges from/to a node. direction: 'out', 'in', or 'both'."""
        if not self._graph.has_node(node_id):
            return []
        edges: list[KnowledgeEdge] = []
        if direction in ("out", "both"):
            for src, tgt, edata in self._graph.out_edges(node_id, data=True):
                edges.append(KnowledgeEdge(
                    source=src, target=tgt,
                    relation=edata.get("relation", ""),
                    weight=edata.get("weight", 1.0),
                    evidence_count=edata.get("evidence_count", 1),
                    properties=edata.get("properties", {}),
                ))
        if direction in ("in", "both"):
            for src, tgt, edata in self._graph.in_edges(node_id, data=True):
                edges.append(KnowledgeEdge(
                    source=src, target=tgt,
                    relation=edata.get("relation", ""),
                    weight=edata.get("weight", 1.0),
                    evidence_count=edata.get("evidence_count", 1),
                    properties=edata.get("properties", {}),
                ))
        return edges

    def find_path(self, source: str, target: str) -> list[str] | None:
        """Find shortest path between two nodes. Returns list of node IDs or None."""
        import networkx as nx

        if not self._graph.has_node(source) or not self._graph.has_node(target):
            return None
        try:
            return nx.shortest_path(self._graph, source, target)
        except nx.NetworkXNoPath:
            return None

    def get_subgraph(self, node_type: str) -> list[KnowledgeNode]:
        """Get all nodes of a specific type."""
        result: list[KnowledgeNode] = []
        for nid, data in self._graph.nodes(data=True):
            if data.get("node_type") == node_type:
                result.append(KnowledgeNode(
                    id=nid,
                    node_type=data.get("node_type", "unknown"),
                    properties=data.get("properties", {}),
                    confidence=data.get("confidence", 0.5),
                    last_updated=data.get("last_updated", ""),
                ))
        return result

    def get_most_connected(
        self, node_type: str | None = None, n: int = 5
    ) -> list[tuple[str, int]]:
        """Get top-n most connected nodes (by degree). Returns (node_id, degree) pairs."""
        candidates: list[tuple[str, int]] = []
        for nid in self._graph.nodes:
            if node_type is not None:
                if self._graph.nodes[nid].get("node_type") != node_type:
                    continue
            candidates.append((nid, self._graph.degree(nid)))
        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[:n]

    def query_related(
        self, node_id: str, max_depth: int = 2
    ) -> dict[str, list[KnowledgeNode]]:
        """BFS from node_id up to max_depth. Returns {depth_level: [nodes]}."""
        if not self._graph.has_node(node_id):
            return {}
        import networkx as nx

        result: dict[str, list[KnowledgeNode]] = {}
        lengths = nx.single_source_shortest_path_length(
            self._graph, node_id, cutoff=max_depth
        )
        for nid, depth in lengths.items():
            if nid == node_id:
                continue
            key = str(depth)
            node = self.get_node(nid)
            if node is not None:
                result.setdefault(key, []).append(node)
        return result

    def build_from_events(self, events: list[dict]) -> None:
        """Populate graph from historical events."""
        for event in events:
            has_errors = bool(event.get("errors"))
            agents = event.get("agentTypes", [])
            skills = event.get("skillsTriggered", [])
            tools = event.get("toolCalls", [])
            modes = event.get("modesUsed", [])
            errors = event.get("errors", [])

            # Determine success
            spawned = event.get("agentsSpawned", 0)
            completed = event.get("agentsCompleted", 0)
            if spawned > 0:
                success = completed >= spawned and not has_errors
            else:
                success = not has_errors
            conf = 0.7 if success else 0.3

            # Create agent nodes
            if isinstance(agents, list):
                for agent in agents:
                    self.add_node(KnowledgeNode(
                        id=f"agent:{agent}", node_type="agent",
                        confidence=conf,
                    ))

            # Create skill nodes
            if isinstance(skills, list):
                for skill in skills:
                    self.add_node(KnowledgeNode(
                        id=f"skill:{skill}", node_type="skill",
                        confidence=conf,
                    ))

            # Create tool nodes
            tool_names: list[str] = []
            if isinstance(tools, list):
                for t in tools:
                    name = t.get("name", str(t)) if isinstance(t, dict) else str(t)
                    tool_names.append(name)
                    self.add_node(KnowledgeNode(
                        id=f"tool:{name}", node_type="tool",
                        confidence=conf,
                    ))

            # Create mode nodes
            if isinstance(modes, list):
                for mode in modes:
                    self.add_node(KnowledgeNode(
                        id=f"mode:{mode}", node_type="mode",
                        confidence=conf,
                    ))

            # co_occurs_with edges between agents used together
            if isinstance(agents, list) and len(agents) >= 2:
                for a1, a2 in combinations(sorted(set(agents)), 2):
                    self.add_edge(KnowledgeEdge(
                        source=f"agent:{a1}", target=f"agent:{a2}",
                        relation="co_occurs_with",
                    ))

            # uses edges from modes to agents/skills
            if isinstance(modes, list):
                for mode in modes:
                    if isinstance(agents, list):
                        for agent in agents:
                            self.add_edge(KnowledgeEdge(
                                source=f"mode:{mode}", target=f"agent:{agent}",
                                relation="uses",
                            ))
                    if isinstance(skills, list):
                        for skill in skills:
                            self.add_edge(KnowledgeEdge(
                                source=f"mode:{mode}", target=f"skill:{skill}",
                                relation="uses",
                            ))

            # triggers edges from skills to tools
            if isinstance(skills, list):
                for skill in skills:
                    for tname in tool_names:
                        self.add_edge(KnowledgeEdge(
                            source=f"skill:{skill}", target=f"tool:{tname}",
                            relation="triggers",
                        ))

            # Error nodes and causes edges
            if isinstance(errors, list):
                for err in errors:
                    if isinstance(err, dict):
                        err_type = err.get("type", err.get("message", "unknown"))
                    else:
                        err_type = str(err)
                    self.add_node(KnowledgeNode(
                        id=f"error:{err_type}", node_type="error",
                        confidence=0.8,
                    ))
                    if isinstance(agents, list):
                        for agent in agents:
                            self.add_edge(KnowledgeEdge(
                                source=f"agent:{agent}",
                                target=f"error:{err_type}",
                                relation="causes",
                            ))

    def get_recommendations_for(
        self, node_id: str
    ) -> list[tuple[str, float]]:
        """Recommend related nodes based on graph structure.

        Uses a simple scoring: weight * evidence_count * confidence of neighbor.
        Returns sorted list of (node_id, score).
        """
        if not self._graph.has_node(node_id):
            return []
        scored: list[tuple[str, float]] = []
        for _, target, edata in self._graph.out_edges(node_id, data=True):
            tdata = self._graph.nodes[target]
            weight = edata.get("weight", 1.0)
            evidence = edata.get("evidence_count", 1)
            confidence = tdata.get("confidence", 0.5)
            score = weight * evidence * confidence
            scored.append((target, round(score, 4)))
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored

    def stats(self) -> dict:
        """Return graph statistics: node_count, edge_count, by_type counts, density."""
        import networkx as nx

        by_type: dict[str, int] = {}
        for _, data in self._graph.nodes(data=True):
            nt = data.get("node_type", "unknown")
            by_type[nt] = by_type.get(nt, 0) + 1
        return {
            "node_count": self._graph.number_of_nodes(),
            "edge_count": self._graph.number_of_edges(),
            "by_type": by_type,
            "density": nx.density(self._graph),
        }

    def to_dict(self) -> dict:
        """Serialize entire graph to dict for JSON persistence."""
        nodes: list[dict] = []
        for nid, data in self._graph.nodes(data=True):
            nodes.append({
                "id": nid,
                "node_type": data.get("node_type", "unknown"),
                "properties": data.get("properties", {}),
                "confidence": data.get("confidence", 0.5),
                "last_updated": data.get("last_updated", ""),
            })
        edges: list[dict] = []
        for src, tgt, data in self._graph.edges(data=True):
            edges.append({
                "source": src,
                "target": tgt,
                "relation": data.get("relation", ""),
                "weight": data.get("weight", 1.0),
                "evidence_count": data.get("evidence_count", 1),
                "properties": data.get("properties", {}),
            })
        return {"nodes": nodes, "edges": edges}

    @classmethod
    def from_dict(cls, data: dict) -> KnowledgeGraph:
        """Restore graph from serialized dict."""
        graph = cls()
        for n in data.get("nodes", []):
            graph.add_node(KnowledgeNode(
                id=n["id"],
                node_type=n.get("node_type", "unknown"),
                properties=n.get("properties", {}),
                confidence=n.get("confidence", 0.5),
                last_updated=n.get("last_updated", ""),
            ))
        for e in data.get("edges", []):
            graph.add_edge(KnowledgeEdge(
                source=e["source"],
                target=e["target"],
                relation=e.get("relation", ""),
                weight=e.get("weight", 1.0),
                evidence_count=e.get("evidence_count", 1),
                properties=e.get("properties", {}),
            ))
        return graph

    def save(self, path: Path) -> None:
        """Save graph to JSON file."""
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.to_dict(), indent=2), encoding="utf-8")
        logger.info("Saved knowledge graph to %s", path)

    @classmethod
    def load(cls, path: Path) -> KnowledgeGraph:
        """Load graph from JSON file. Returns empty graph if file doesn't exist."""
        path = Path(path)
        if not path.exists():
            logger.info("No graph file at %s, returning empty graph", path)
            return cls()
        data = json.loads(path.read_text(encoding="utf-8"))
        return cls.from_dict(data)
