# nexus-daemon/tests/test_reflexion.py
import pytest
import json
from pathlib import Path

from reflexion import ReflectionEntry, ReflectionMemory, ReflexionEngine


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_entry(round_num: int = 1, score: float = 0.7,
               action_items: list[str] | None = None,
               observation: str = 'test obs',
               reflection: str = 'test reflection') -> ReflectionEntry:
    return ReflectionEntry(
        round_num=round_num,
        timestamp='2026-02-28T10:00:00Z',
        observation=observation,
        evaluation='test eval',
        reflection=reflection,
        action_items=action_items or [],
        score=score,
    )


def make_events(n: int = 5, error_count: int = 0,
                agents_spawned: int = 3, agents_completed: int = 3,
                tool_errors: int = 0) -> list[dict]:
    """Build a list of synthetic event dicts."""
    events: list[dict] = []
    for i in range(n):
        evt: dict = {
            'sessionId': f's{i}',
            'skillsTriggered': ['autopilot'],
            'agentsSpawned': agents_spawned,
            'agentsCompleted': agents_completed,
            'toolCalls': [{'name': 'Read'}, {'name': 'Edit'}],
        }
        if i < error_count:
            evt['errors'] = [{'type': 'timeout'}]
        else:
            evt['errors'] = []
        if i < tool_errors:
            evt['toolCalls'] = [{'name': 'Read', 'error': 'fail'}, {'name': 'Edit'}]
        events.append(evt)
    return events


# ---------------------------------------------------------------------------
# ReflectionMemory tests
# ---------------------------------------------------------------------------

class TestReflectionMemory:
    def test_add_and_get_recent(self):
        mem = ReflectionMemory()
        for i in range(10):
            mem.add(make_entry(round_num=i, score=0.5 + i * 0.01))
        recent = mem.get_recent(3)
        assert len(recent) == 3
        assert recent[0].round_num == 7
        assert recent[-1].round_num == 9

    def test_max_entries_eviction(self):
        mem = ReflectionMemory(max_entries=5)
        for i in range(8):
            mem.add(make_entry(round_num=i))
        # Should keep only the last 5
        assert len(mem.get_recent(100)) == 5
        assert mem.get_recent(100)[0].round_num == 3

    def test_get_by_score_range(self):
        mem = ReflectionMemory()
        mem.add(make_entry(round_num=1, score=0.2))
        mem.add(make_entry(round_num=2, score=0.5))
        mem.add(make_entry(round_num=3, score=0.8))
        mem.add(make_entry(round_num=4, score=0.95))
        results = mem.get_by_score_range(0.4, 0.85)
        assert len(results) == 2
        scores = {e.score for e in results}
        assert scores == {0.5, 0.8}

    def test_get_action_items(self):
        mem = ReflectionMemory()
        mem.add(make_entry(action_items=['fix A', 'fix B']))
        mem.add(make_entry(action_items=['fix B', 'fix C']))
        # All pending, deduplicated
        items = mem.get_action_items(pending_only=True)
        assert items == ['fix A', 'fix B', 'fix C']
        # Mark one complete
        mem.complete_action('fix A')
        items = mem.get_action_items(pending_only=True)
        assert 'fix A' not in items
        assert 'fix B' in items
        # pending_only=False returns all
        all_items = mem.get_action_items(pending_only=False)
        assert 'fix A' in all_items

    def test_average_score(self):
        mem = ReflectionMemory()
        assert mem.average_score() == 0.0
        mem.add(make_entry(score=0.6))
        mem.add(make_entry(score=0.8))
        assert abs(mem.average_score() - 0.7) < 1e-9

    def test_serialization_round_trip(self):
        mem = ReflectionMemory(max_entries=10)
        mem.add(make_entry(round_num=1, score=0.5, action_items=['item1']))
        mem.add(make_entry(round_num=2, score=0.9, action_items=['item2']))
        mem.complete_action('item1')

        data = mem.to_dict()
        restored = ReflectionMemory.from_dict(data)

        assert len(restored.get_recent(100)) == 2
        assert restored.get_recent(100)[0].round_num == 1
        assert abs(restored.average_score() - 0.7) < 1e-9
        assert restored.get_action_items(pending_only=True) == ['item2']


# ---------------------------------------------------------------------------
# ReflexionEngine tests
# ---------------------------------------------------------------------------

class TestReflexionEngine:
    def test_evaluate_perfect_events(self):
        engine = ReflexionEngine()
        events = make_events(n=5, error_count=0, agents_spawned=5, agents_completed=5)
        evaluation = engine.evaluate(events, health_score=0.9)
        assert 'Error rate: 0.0%' in evaluation
        assert 'Agent completion rate: 100.0%' in evaluation
        assert engine._last_score >= 0.8

    def test_evaluate_with_errors(self):
        engine = ReflexionEngine()
        events = make_events(n=10, error_count=5, agents_spawned=4, agents_completed=2)
        evaluation = engine.evaluate(events, health_score=0.4)
        assert 'Error rate: 50.0%' in evaluation
        assert engine._last_score < 0.7

    def test_evaluate_with_trend(self):
        """Declining scores in memory should lower the trend component."""
        mem = ReflectionMemory()
        mem.add(make_entry(round_num=1, score=0.9))
        mem.add(make_entry(round_num=2, score=0.7))
        mem.add(make_entry(round_num=3, score=0.5))
        engine = ReflexionEngine(memory=mem)
        events = make_events(n=5, error_count=0)
        engine.evaluate(events, health_score=0.8)
        # Trend should be < 0.5 because scores are declining
        trend = engine._compute_trend_score()
        assert trend < 0.5

    def test_reflect_generates_action_items(self):
        engine = ReflexionEngine()
        # Simulate high error rate in evaluation text
        engine._last_score = 0.4
        evaluation = (
            'Evaluation (score: 0.400):\n'
            '  Error rate: 50.0% (weight 0.3)\n'
            '  Agent completion rate: 60.0% (weight 0.3)\n'
            '  Tool success rate: 80.0% (weight 0.2)\n'
            '  Trend score: 0.500 (weight 0.2)\n'
            '  Health score input: 0.400'
        )
        reflection, items = engine.reflect('obs', evaluation)
        assert len(items) >= 2
        assert any('error' in item.lower() for item in items)
        assert any('agent' in item.lower() for item in items)
        assert len(reflection) > 0

    def test_reflect_avoids_duplicate_insights(self):
        mem = ReflectionMemory()
        # Pre-populate memory with an entry that already has the error action item
        mem.add(make_entry(
            action_items=['Investigate recurring errors and identify root causes'],
        ))
        engine = ReflexionEngine(memory=mem)
        engine._last_score = 0.3
        evaluation = (
            'Evaluation (score: 0.300):\n'
            '  Error rate: 50.0% (weight 0.3)\n'
            '  Agent completion rate: 90.0% (weight 0.3)\n'
            '  Tool success rate: 95.0% (weight 0.2)\n'
            '  Trend score: 0.500 (weight 0.2)\n'
            '  Health score input: 0.300'
        )
        _, items = engine.reflect('obs', evaluation)
        # The error action item should NOT be duplicated
        error_items = [i for i in items if 'recurring errors' in i.lower()]
        assert len(error_items) == 0

    def test_run_cycle_full_loop(self):
        engine = ReflexionEngine()
        events = make_events(n=5, error_count=1, agents_spawned=4, agents_completed=3)
        entry = engine.run_cycle(events, health_score=0.7)
        assert entry.round_num == 1
        assert 0.0 <= entry.score <= 1.0
        assert '5 events' in entry.observation
        assert '1 errors' in entry.observation
        assert len(entry.timestamp) > 0
        # Memory should have the entry
        assert len(engine.memory.get_recent(10)) == 1


# ---------------------------------------------------------------------------
# Integration tests
# ---------------------------------------------------------------------------

from consciousness_loop import ConsciousnessLoop, ConsciousnessConfig


@pytest.fixture
def tmp_repo(tmp_path):
    (tmp_path / 'consciousness').mkdir()
    (tmp_path / 'consciousness' / 'rounds').mkdir()
    return tmp_path


class TestIntegration:
    @pytest.mark.asyncio
    async def test_consciousness_loop_with_reflexion(self, tmp_repo):
        cfg = ConsciousnessConfig(interval_seconds=300, max_rounds_per_session=5)
        engine = ReflexionEngine()
        loop = ConsciousnessLoop(repo_path=tmp_repo, config=cfg, reflexion=engine)

        # Feed events and run a round
        events = make_events(n=3, error_count=1, agents_spawned=2, agents_completed=2)
        loop.add_events(events)
        result = await loop.run_once()

        assert result is not None
        assert '## Reflexion' in result
        assert '**Score:**' in result
        assert '**Observation:**' in result
        # Memory should have one entry
        assert len(engine.memory.get_recent(10)) == 1

    @pytest.mark.asyncio
    async def test_reflexion_memory_persistence(self, tmp_repo):
        cfg = ConsciousnessConfig(interval_seconds=300, max_rounds_per_session=5)
        engine = ReflexionEngine()
        loop = ConsciousnessLoop(repo_path=tmp_repo, config=cfg, reflexion=engine)

        loop.add_events(make_events(n=2))
        await loop.run_once()

        # Verify file was written
        mem_path = tmp_repo / 'consciousness' / 'reflection_memory.json'
        assert mem_path.exists()

        # Reload from file
        data = json.loads(mem_path.read_text(encoding='utf-8'))
        restored = ReflectionMemory.from_dict(data)
        assert len(restored.get_recent(10)) == 1

    @pytest.mark.asyncio
    async def test_existing_consciousness_tests_still_pass(self, tmp_repo):
        """Backward compat: loop without reflexion works identically to before."""
        cfg = ConsciousnessConfig(interval_seconds=300, max_rounds_per_session=5)
        loop = ConsciousnessLoop(repo_path=tmp_repo, config=cfg)

        # No reflexion engine loaded (no persisted file)
        assert loop.reflexion is None

        result = await loop.run_once()
        assert result is not None
        assert loop._round_count == 1
        assert loop.scratchpad_path.exists()
        # No reflexion section in output
        assert '## Reflexion' not in result
