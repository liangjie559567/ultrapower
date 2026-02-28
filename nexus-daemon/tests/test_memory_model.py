"""Tests for memory_model.py — FourLayerMemory system."""

from __future__ import annotations

import math
import time
from pathlib import Path

import pytest

from memory_model import FourLayerMemory, MemoryItem, MemoryLayer


# ---------------------------------------------------------------------------
# MemoryItem tests
# ---------------------------------------------------------------------------


class TestMemoryItem:
    def _make(self, **kwargs) -> MemoryItem:
        now = time.time()
        defaults = dict(
            key="k",
            content="v",
            layer="sensory",
            created_at=now,
            last_accessed=now,
            access_count=0,
            importance=0.5,
            decay_rate=1.0,
            metadata={},
        )
        defaults.update(kwargs)
        return MemoryItem(**defaults)

    def test_strength_new_item(self):
        item = self._make(importance=1.0, decay_rate=1.0, access_count=0)
        s = item.strength(now=item.created_at)
        # age=0 → exp(0)=1, log(1)=0 → strength = 1.0 * 1.0 * 1.0 = 1.0
        assert math.isclose(s, 1.0, rel_tol=1e-6)

    def test_strength_old_item_decays(self):
        item = self._make(importance=1.0, decay_rate=1.0, access_count=0)
        # 24 hours later → exp(-1) ≈ 0.368
        future = item.created_at + 3600 * 24
        s = item.strength(now=future)
        assert math.isclose(s, math.exp(-1.0), rel_tol=1e-6)

    def test_strength_increases_with_access(self):
        item = self._make(importance=0.5, decay_rate=0.0, access_count=0)
        s0 = item.strength(now=item.created_at)
        item.access_count = 10
        s10 = item.strength(now=item.created_at)
        assert s10 > s0

    def test_to_dict_from_dict_roundtrip(self):
        now = time.time()
        item = MemoryItem(
            key="abc",
            content={"x": 1},
            layer="working",
            created_at=now,
            last_accessed=now,
            access_count=3,
            importance=0.8,
            decay_rate=2.0,
            metadata={"tag": "test"},
        )
        restored = MemoryItem.from_dict(item.to_dict())
        assert restored.key == item.key
        assert restored.content == item.content
        assert restored.layer == item.layer
        assert restored.access_count == item.access_count
        assert math.isclose(restored.importance, item.importance)
        assert math.isclose(restored.decay_rate, item.decay_rate)
        assert restored.metadata == item.metadata


# ---------------------------------------------------------------------------
# MemoryLayer tests
# ---------------------------------------------------------------------------


class TestMemoryLayer:
    def test_store_and_retrieve(self):
        layer = MemoryLayer("test", capacity=10, default_decay=1.0)
        layer.store("k1", "hello")
        item = layer.retrieve("k1")
        assert item is not None
        assert item.content == "hello"

    def test_retrieve_updates_access_count(self):
        layer = MemoryLayer("test", capacity=10, default_decay=1.0)
        layer.store("k1", "hello")
        layer.retrieve("k1")
        layer.retrieve("k1")
        item = layer.retrieve("k1")
        assert item.access_count == 3

    def test_capacity_evicts_weakest(self):
        layer = MemoryLayer("test", capacity=3, default_decay=1.0)
        layer.store("a", "A", importance=0.1)
        layer.store("b", "B", importance=0.9)
        layer.store("c", "C", importance=0.8)
        # Adding a 4th should evict "a" (lowest importance / strength)
        layer.store("d", "D", importance=0.7)
        assert layer.size() == 3
        assert layer.retrieve("a") is None  # evicted

    def test_cleanup_removes_weak_items(self):
        layer = MemoryLayer("test", capacity=100, default_decay=1.0)
        # Store item with very old created_at so strength ≈ 0
        now = time.time()
        old_item = MemoryItem(
            key="old",
            content="stale",
            layer="test",
            created_at=now - 3600 * 24 * 365,  # 1 year ago
            last_accessed=now - 3600 * 24 * 365,
            importance=0.5,
            decay_rate=10.0,
        )
        layer._items["old"] = old_item
        layer.store("fresh", "new", importance=0.9)
        removed = layer.cleanup(min_strength=0.01)
        assert removed >= 1
        assert layer.retrieve("old") is None
        assert layer.retrieve("fresh") is not None

    def test_search_by_predicate(self):
        layer = MemoryLayer("test", capacity=10, default_decay=1.0)
        layer.store("k1", "alpha", importance=0.3)
        layer.store("k2", "beta", importance=0.8)
        layer.store("k3", "gamma", importance=0.6)
        results = layer.search(lambda item: item.importance >= 0.6)
        keys = {r.key for r in results}
        assert "k2" in keys
        assert "k3" in keys
        assert "k1" not in keys

    def test_to_dict_from_dict_roundtrip(self):
        layer = MemoryLayer("episodic", capacity=50, default_decay=0.1)
        layer.store("e1", {"event": "login"}, importance=0.7)
        layer.store("e2", {"event": "logout"}, importance=0.4)
        restored = MemoryLayer.from_dict(layer.to_dict())
        assert restored._name == "episodic"
        assert restored._capacity == 50
        assert restored.size() == 2
        assert restored.retrieve("e1") is not None


# ---------------------------------------------------------------------------
# FourLayerMemory tests
# ---------------------------------------------------------------------------


class TestFourLayerMemory:
    def test_perceive_stores_in_sensory(self):
        mem = FourLayerMemory()
        item = mem.perceive("evt1", {"type": "click"})
        assert item.layer == "sensory"
        assert mem.sensory.retrieve("evt1") is not None

    def test_attend_promotes_to_working(self):
        mem = FourLayerMemory()
        mem.perceive("evt1", "raw data")
        promoted = mem.attend("evt1")
        assert promoted is not None
        assert promoted.layer == "working"
        assert mem.working.retrieve("evt1") is not None

    def test_attend_returns_none_if_not_in_sensory(self):
        mem = FourLayerMemory()
        result = mem.attend("nonexistent")
        assert result is None

    def test_consolidate_moves_to_episodic(self):
        mem = FourLayerMemory()
        mem.perceive("e1", "experience")
        mem.attend("e1")
        consolidated = mem.consolidate("e1")
        assert consolidated is not None
        assert consolidated.layer == "episodic"
        assert mem.episodic.retrieve("e1") is not None

    def test_consolidate_returns_none_if_not_in_working(self):
        mem = FourLayerMemory()
        result = mem.consolidate("ghost")
        assert result is None

    def test_abstract_moves_to_semantic(self):
        mem = FourLayerMemory()
        mem.perceive("k1", "raw")
        mem.attend("k1")
        mem.consolidate("k1")
        abstracted = mem.abstract("k1", abstracted_content="abstract knowledge")
        assert abstracted is not None
        assert abstracted.layer == "semantic"
        assert abstracted.content == "abstract knowledge"
        assert mem.semantic.retrieve("k1") is not None

    def test_abstract_uses_original_content_if_none_given(self):
        mem = FourLayerMemory()
        mem.perceive("k2", "original")
        mem.attend("k2")
        mem.consolidate("k2")
        abstracted = mem.abstract("k2")
        assert abstracted.content == "original"

    def test_recall_cross_layer_priority(self):
        mem = FourLayerMemory()
        # Store same key in sensory and semantic
        mem.perceive("shared", "sensory_val")
        mem.semantic.store("shared", "semantic_val", importance=0.9)
        # recall should prefer semantic
        item = mem.recall("shared")
        assert item is not None
        assert item.content == "semantic_val"

    def test_recall_falls_back_to_lower_layers(self):
        mem = FourLayerMemory()
        mem.perceive("only_sensory", "raw")
        item = mem.recall("only_sensory")
        assert item is not None
        assert item.content == "raw"

    def test_recall_returns_none_for_missing_key(self):
        mem = FourLayerMemory()
        assert mem.recall("missing") is None

    def test_process_event_stores_in_sensory(self):
        mem = FourLayerMemory()
        results = mem.process_event({"key": "ev1", "importance": 0.3, "data": "x"})
        assert any(r.layer == "sensory" for r in results)
        assert mem.sensory.retrieve("ev1") is not None

    def test_process_event_promotes_high_importance(self):
        mem = FourLayerMemory()
        results = mem.process_event({"key": "ev2", "importance": 0.9})
        layers = {r.layer for r in results}
        assert "sensory" in layers
        assert "working" in layers

    def test_process_event_no_promote_low_importance(self):
        mem = FourLayerMemory()
        results = mem.process_event({"key": "ev3", "importance": 0.3})
        layers = {r.layer for r in results}
        assert "sensory" in layers
        assert "working" not in layers

    def test_maintenance_returns_counts(self):
        mem = FourLayerMemory()
        mem.perceive("x", "data")
        result = mem.maintenance()
        assert set(result.keys()) == {"sensory", "working", "episodic", "semantic"}
        assert all(isinstance(v, int) for v in result.values())

    def test_stats_returns_all_layers(self):
        mem = FourLayerMemory()
        mem.perceive("a", 1)
        mem.perceive("b", 2)
        s = mem.stats()
        assert set(s.keys()) == {"sensory", "working", "episodic", "semantic"}
        assert s["sensory"]["size"] == 2
        assert s["sensory"]["capacity"] == 1000
        assert s["working"]["capacity"] == 9

    def test_working_memory_capacity_limit(self):
        mem = FourLayerMemory()
        # Fill working memory beyond capacity (9)
        for i in range(12):
            mem.working.store(f"w{i}", f"val{i}", importance=float(i) / 12)
        assert mem.working.size() <= 9

    def test_sensory_fast_decay(self):
        mem = FourLayerMemory()
        item = mem.perceive("fast", "data", importance=1.0)
        # After 1 hour, sensory (decay=10) should be much weaker than semantic (decay=0.01)
        future = item.created_at + 3600
        sensory_strength = item.strength(now=future)
        sem_item = mem.semantic.store("slow", "data", importance=1.0)
        sem_item.created_at = item.created_at
        semantic_strength = sem_item.strength(now=future)
        assert sensory_strength < semantic_strength


# ---------------------------------------------------------------------------
# Persistence tests
# ---------------------------------------------------------------------------


class TestPersistence:
    def test_to_dict_from_dict_full_roundtrip(self):
        mem = FourLayerMemory()
        mem.perceive("s1", "sensory data", importance=0.4)
        mem.perceive("s2", "more data", importance=0.8)
        mem.attend("s2")
        mem.consolidate("s2")
        mem.abstract("s2", "abstract")

        restored = FourLayerMemory.from_dict(mem.to_dict())
        assert restored.sensory.size() == mem.sensory.size()
        assert restored.working.size() == mem.working.size()
        assert restored.episodic.size() == mem.episodic.size()
        assert restored.semantic.size() == mem.semantic.size()
        item = restored.recall("s2")
        assert item is not None

    def test_save_and_load(self, tmp_path: Path):
        mem = FourLayerMemory()
        mem.perceive("p1", {"event": "test"}, importance=0.6)
        mem.attend("p1")

        save_path = tmp_path / "memory.json"
        mem.save(save_path)
        assert save_path.exists()

        loaded = FourLayerMemory.load(save_path)
        assert loaded.sensory.size() == mem.sensory.size()
        assert loaded.working.size() == mem.working.size()
        assert loaded.recall("p1") is not None

    def test_empty_model_serialization(self):
        mem = FourLayerMemory()
        d = mem.to_dict()
        assert "sensory" in d
        assert "working" in d
        assert "episodic" in d
        assert "semantic" in d
        restored = FourLayerMemory.from_dict(d)
        assert restored.sensory.size() == 0
        assert restored.working.size() == 0

    def test_load_missing_file_returns_empty(self, tmp_path: Path):
        mem = FourLayerMemory.load(tmp_path / "nonexistent.json")
        assert mem.sensory.size() == 0
        assert mem.semantic.size() == 0
