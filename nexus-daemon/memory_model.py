"""
Four-Layer Memory Model for nexus-daemon.

Simulates human memory architecture with four layers:
  1. Sensory  — high capacity, fast decay, raw events
  2. Working  — low capacity (7±2), medium decay, current task context
  3. Episodic — medium capacity, slow decay, concrete experiences
  4. Semantic — large capacity, very slow decay, abstract knowledge
"""

from __future__ import annotations

import json
import logging
import math
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

logger = logging.getLogger("nexus.memory_model")


@dataclass
class MemoryItem:
    """A single memory entry."""

    key: str
    content: Any
    layer: str  # "sensory" | "working" | "episodic" | "semantic"
    created_at: float
    last_accessed: float
    access_count: int = 0
    importance: float = 0.5
    decay_rate: float = 1.0
    metadata: dict = field(default_factory=dict)

    def strength(self, now: float | None = None) -> float:
        """Compute current memory strength.

        strength = importance * (1 + log(1 + access_count)) * exp(-decay_rate * age_hours / 24)
        """
        if now is None:
            now = time.time()
        age_hours = (now - self.created_at) / 3600.0
        return (
            self.importance
            * (1.0 + math.log(1.0 + self.access_count))
            * math.exp(-self.decay_rate * age_hours / 24.0)
        )

    def to_dict(self) -> dict:
        return {
            "key": self.key,
            "content": self.content,
            "layer": self.layer,
            "created_at": self.created_at,
            "last_accessed": self.last_accessed,
            "access_count": self.access_count,
            "importance": self.importance,
            "decay_rate": self.decay_rate,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: dict) -> MemoryItem:
        return cls(
            key=data["key"],
            content=data["content"],
            layer=data["layer"],
            created_at=data["created_at"],
            last_accessed=data["last_accessed"],
            access_count=data.get("access_count", 0),
            importance=data.get("importance", 0.5),
            decay_rate=data.get("decay_rate", 1.0),
            metadata=data.get("metadata", {}),
        )


class MemoryLayer:
    """Single-layer memory store with capacity management."""

    def __init__(self, name: str, capacity: int, default_decay: float) -> None:
        self._name = name
        self._capacity = capacity
        self._default_decay = default_decay
        self._items: dict[str, MemoryItem] = {}

    # ------------------------------------------------------------------
    def store(
        self,
        key: str,
        content: Any,
        importance: float = 0.5,
        metadata: dict | None = None,
    ) -> MemoryItem:
        """Store a memory item, evicting the weakest if at capacity."""
        if key not in self._items and len(self._items) >= self._capacity:
            self.evict_weakest()
        now = time.time()
        item = MemoryItem(
            key=key,
            content=content,
            layer=self._name,
            created_at=now,
            last_accessed=now,
            importance=importance,
            decay_rate=self._default_decay,
            metadata=metadata or {},
        )
        self._items[key] = item
        return item

    def retrieve(self, key: str) -> MemoryItem | None:
        """Retrieve and update last_accessed / access_count."""
        item = self._items.get(key)
        if item is None:
            return None
        item.last_accessed = time.time()
        item.access_count += 1
        return item

    def search(self, predicate: Callable[[MemoryItem], bool]) -> list[MemoryItem]:
        """Return all items matching predicate."""
        return [item for item in self._items.values() if predicate(item)]

    def evict_weakest(self) -> MemoryItem | None:
        """Remove and return the item with the lowest strength."""
        if not self._items:
            return None
        now = time.time()
        weakest_key = min(self._items, key=lambda k: self._items[k].strength(now))
        return self._items.pop(weakest_key)

    def cleanup(self, min_strength: float = 0.01) -> int:
        """Remove items below min_strength. Returns count removed."""
        now = time.time()
        dead = [k for k, v in self._items.items() if v.strength(now) < min_strength]
        for k in dead:
            del self._items[k]
        return len(dead)

    def size(self) -> int:
        return len(self._items)

    def to_dict(self) -> dict:
        return {
            "name": self._name,
            "capacity": self._capacity,
            "default_decay": self._default_decay,
            "items": {k: v.to_dict() for k, v in self._items.items()},
        }

    @classmethod
    def from_dict(cls, data: dict) -> MemoryLayer:
        layer = cls(
            name=data["name"],
            capacity=data["capacity"],
            default_decay=data["default_decay"],
        )
        for k, v in data.get("items", {}).items():
            layer._items[k] = MemoryItem.from_dict(v)
        return layer


class FourLayerMemory:
    """Four-layer memory model.

    1. Sensory  (感觉记忆): capacity=1000, decay=10.0  — raw events, fast fade
    2. Working  (工作记忆): capacity=9,    decay=2.0   — current task context
    3. Episodic (情景记忆): capacity=500,  decay=0.1   — concrete experiences
    4. Semantic (语义记忆): capacity=2000, decay=0.01  — abstract knowledge
    """

    def __init__(self) -> None:
        self.sensory = MemoryLayer("sensory", capacity=1000, default_decay=10.0)
        self.working = MemoryLayer("working", capacity=9, default_decay=2.0)
        self.episodic = MemoryLayer("episodic", capacity=500, default_decay=0.1)
        self.semantic = MemoryLayer("semantic", capacity=2000, default_decay=0.01)

    # ------------------------------------------------------------------
    # Layer-promotion API
    # ------------------------------------------------------------------

    def perceive(self, key: str, content: Any, **kwargs) -> MemoryItem:
        """Store into sensory memory."""
        importance = kwargs.get("importance", 0.5)
        metadata = kwargs.get("metadata", {})
        return self.sensory.store(key, content, importance=importance, metadata=metadata)

    def attend(self, key: str) -> MemoryItem | None:
        """Promote from sensory to working memory (attention mechanism)."""
        item = self.sensory.retrieve(key)
        if item is None:
            return None
        return self.working.store(
            key, item.content,
            importance=item.importance,
            metadata={**item.metadata, "promoted_from": "sensory"},
        )

    def consolidate(self, key: str) -> MemoryItem | None:
        """Consolidate from working to episodic memory."""
        item = self.working.retrieve(key)
        if item is None:
            return None
        return self.episodic.store(
            key, item.content,
            importance=item.importance,
            metadata={**item.metadata, "promoted_from": "working"},
        )

    def abstract(self, key: str, abstracted_content: Any = None) -> MemoryItem | None:
        """Abstract from episodic to semantic memory."""
        item = self.episodic.retrieve(key)
        if item is None:
            return None
        content = abstracted_content if abstracted_content is not None else item.content
        return self.semantic.store(
            key, content,
            importance=min(1.0, item.importance + 0.1),
            metadata={**item.metadata, "promoted_from": "episodic"},
        )

    def recall(self, key: str) -> MemoryItem | None:
        """Cross-layer retrieval: semantic -> episodic -> working -> sensory."""
        for layer in (self.semantic, self.episodic, self.working, self.sensory):
            item = layer.retrieve(key)
            if item is not None:
                return item
        return None

    def process_event(self, event: dict) -> list[MemoryItem]:
        """Process an event dict: store in sensory; promote important ones to working."""
        results: list[MemoryItem] = []
        key = event.get("key", f"event_{int(time.time() * 1000)}")
        importance = float(event.get("importance", 0.5))
        item = self.perceive(key, event, importance=importance, metadata=event.get("metadata", {}))
        results.append(item)
        # Auto-promote high-importance events to working memory
        if importance >= 0.7:
            promoted = self.attend(key)
            if promoted is not None:
                results.append(promoted)
        return results

    def maintenance(self) -> dict:
        """Clean weak memories from all layers. Returns removal counts per layer."""
        return {
            "sensory": self.sensory.cleanup(),
            "working": self.working.cleanup(),
            "episodic": self.episodic.cleanup(),
            "semantic": self.semantic.cleanup(),
        }

    def stats(self) -> dict:
        """Return size and capacity stats for each layer."""
        layers = {
            "sensory": self.sensory,
            "working": self.working,
            "episodic": self.episodic,
            "semantic": self.semantic,
        }
        return {
            name: {"size": layer.size(), "capacity": layer._capacity}
            for name, layer in layers.items()
        }

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def to_dict(self) -> dict:
        return {
            "sensory": self.sensory.to_dict(),
            "working": self.working.to_dict(),
            "episodic": self.episodic.to_dict(),
            "semantic": self.semantic.to_dict(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> FourLayerMemory:
        mem = cls.__new__(cls)
        mem.sensory = MemoryLayer.from_dict(data["sensory"])
        mem.working = MemoryLayer.from_dict(data["working"])
        mem.episodic = MemoryLayer.from_dict(data["episodic"])
        mem.semantic = MemoryLayer.from_dict(data["semantic"])
        return mem

    def save(self, path: Path) -> None:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.to_dict(), indent=2), encoding="utf-8")
        logger.info("Saved FourLayerMemory to %s", path)

    @classmethod
    def load(cls, path: Path) -> FourLayerMemory:
        path = Path(path)
        if not path.exists():
            logger.info("No memory file at %s, returning empty model", path)
            return cls()
        data = json.loads(path.read_text(encoding="utf-8"))
        return cls.from_dict(data)
