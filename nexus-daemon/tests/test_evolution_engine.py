# nexus-daemon/tests/test_evolution_engine.py
import pytest
import json
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from evolution_engine import EvolutionEngine, PatternRecord, detect_patterns

class TestDetectPatterns:
    def test_returns_empty_for_no_events(self):
        patterns = detect_patterns([])
        assert patterns == []

    def test_detects_repeated_modes(self):
        events = [
            {'modesUsed': ['ultrawork'], 'agentsSpawned': 3},
            {'modesUsed': ['ultrawork'], 'agentsSpawned': 2},
            {'modesUsed': ['ultrawork'], 'agentsSpawned': 4},
        ]
        patterns = detect_patterns(events)
        mode_patterns = [p for p in patterns if p.pattern_type == 'mode_usage']
        assert any(p.value == 'ultrawork' and p.occurrences >= 3 for p in mode_patterns)

    def test_pattern_below_threshold_not_promoted(self):
        events = [
            {'modesUsed': ['ralph'], 'agentsSpawned': 1},
            {'modesUsed': ['ralph'], 'agentsSpawned': 1},
        ]
        patterns = detect_patterns(events)
        promoted = [p for p in patterns if p.occurrences >= 3]
        assert len(promoted) == 0

class TestEvolutionEngine:
    def test_init_creates_knowledge_base(self, tmp_path):
        engine = EvolutionEngine(repo_path=tmp_path)
        assert (tmp_path / 'evolution' / 'knowledge_base.md').exists()

    def test_process_events_updates_knowledge_base(self, tmp_path):
        engine = EvolutionEngine(repo_path=tmp_path)
        events = [
            {'sessionId': f'sess-{i}', 'modesUsed': ['ultrawork'],
             'agentsSpawned': 3, 'agentsCompleted': 3, 'toolCalls': []}
            for i in range(3)
        ]
        engine.process_events(events)
        kb = (tmp_path / 'evolution' / 'knowledge_base.md').read_text()
        assert 'ultrawork' in kb

    def test_process_events_writes_pattern_library(self, tmp_path):
        engine = EvolutionEngine(repo_path=tmp_path)
        events = [
            {'sessionId': f's{i}', 'modesUsed': ['ralph'],
             'agentsSpawned': 2, 'agentsCompleted': 2, 'toolCalls': []}
            for i in range(3)
        ]
        engine.process_events(events)
        pl = (tmp_path / 'evolution' / 'pattern_library.md').read_text()
        assert 'ralph' in pl
