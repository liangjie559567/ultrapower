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


class TestToolSequenceDetection:
    def test_detects_bigram_tool_sequences(self):
        events = [
            {'toolCalls': [{'name': 'Read'}, {'name': 'Edit'}, {'name': 'Read'}]},
            {'toolCalls': [{'name': 'Read'}, {'name': 'Edit'}]},
        ]
        patterns = detect_patterns(events)
        seq_patterns = [p for p in patterns if p.pattern_type == 'tool_sequence']
        assert any(p.value == 'Read -> Edit' and p.occurrences >= 2 for p in seq_patterns)

    def test_detects_trigram_tool_sequences(self):
        events = [
            {'toolCalls': [{'name': 'Glob'}, {'name': 'Read'}, {'name': 'Edit'}]},
            {'toolCalls': [{'name': 'Glob'}, {'name': 'Read'}, {'name': 'Edit'}]},
        ]
        patterns = detect_patterns(events)
        seq_patterns = [p for p in patterns if p.pattern_type == 'tool_sequence']
        assert any('Glob -> Read -> Edit' in p.value for p in seq_patterns)

    def test_no_tool_sequences_below_threshold(self):
        events = [
            {'toolCalls': [{'name': 'Read'}, {'name': 'Write'}]},
        ]
        patterns = detect_patterns(events)
        seq_patterns = [p for p in patterns if p.pattern_type == 'tool_sequence']
        assert all(p.value != 'Read -> Write' for p in seq_patterns)


class TestAgentCooccurrence:
    def test_detects_agent_pairs(self):
        events = [
            {'agentTypes': ['executor', 'verifier', 'planner']},
            {'agentTypes': ['executor', 'verifier']},
        ]
        patterns = detect_patterns(events)
        cooc = [p for p in patterns if p.pattern_type == 'agent_cooccurrence']
        assert any('executor' in p.value and 'verifier' in p.value for p in cooc)

    def test_no_cooccurrence_with_single_agent(self):
        events = [
            {'agentTypes': ['executor']},
            {'agentTypes': ['executor']},
        ]
        patterns = detect_patterns(events)
        cooc = [p for p in patterns if p.pattern_type == 'agent_cooccurrence']
        assert len(cooc) == 0


class TestErrorPatterns:
    def test_detects_recurring_errors(self):
        events = [
            {'errors': [{'type': 'timeout', 'message': 'Agent timed out'}]},
            {'errors': [{'type': 'timeout', 'message': 'Agent timed out'}]},
        ]
        patterns = detect_patterns(events)
        err_patterns = [p for p in patterns if p.pattern_type == 'error_pattern']
        assert any(p.value == 'timeout' and p.occurrences >= 2 for p in err_patterns)

    def test_handles_string_errors(self):
        events = [
            {'errors': ['connection_refused']},
            {'errors': ['connection_refused']},
        ]
        patterns = detect_patterns(events)
        err_patterns = [p for p in patterns if p.pattern_type == 'error_pattern']
        assert any(p.value == 'connection_refused' for p in err_patterns)

    def test_no_error_patterns_below_threshold(self):
        events = [
            {'errors': [{'type': 'rare_error'}]},
        ]
        patterns = detect_patterns(events)
        err_patterns = [p for p in patterns if p.pattern_type == 'error_pattern']
        assert len(err_patterns) == 0
