# nexus-daemon/tests/test_daemon.py
import pytest
import json
import os
import asyncio
from pathlib import Path
from unittest.mock import patch, MagicMock, AsyncMock

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from daemon import (
    NexusDaemon, DaemonConfig, load_config,
    GitSync, EventProcessor, ImprovementManager, HealthReporter,
)
from module_registry import CircuitBreaker, ModuleRegistry


# ============================================================
# Original tests (must continue to pass)
# ============================================================

class TestLoadConfig:
    def test_returns_default_when_no_file(self, tmp_path):
        config = load_config(tmp_path / 'nonexistent.json')
        assert config.poll_interval == 60
        assert config.openrouter_api_key == ''

    def test_loads_from_file(self, tmp_path):
        config_file = tmp_path / 'config.json'
        config_file.write_text(json.dumps({
            'poll_interval': 30,
            'openrouter_api_key': 'sk-test-123'
        }))
        config = load_config(config_file)
        assert config.poll_interval == 30
        assert config.openrouter_api_key == 'sk-test-123'

class TestNexusDaemon:
    def test_init_creates_directories(self, tmp_path):
        daemon = NexusDaemon(repo_path=tmp_path)
        assert (tmp_path / 'events').exists()
        assert (tmp_path / 'improvements').exists()
        assert (tmp_path / 'consciousness').exists()
        assert (tmp_path / 'evolution').exists()

    def test_get_new_events_returns_empty_when_no_files(self, tmp_path):
        daemon = NexusDaemon(repo_path=tmp_path)
        events = daemon.get_new_events()
        assert events == []

    def test_get_new_events_returns_unprocessed_files(self, tmp_path):
        daemon = NexusDaemon(repo_path=tmp_path)
        event_file = tmp_path / 'events' / 'sess-001-1234567890.json'
        event_file.write_text(json.dumps({
            'sessionId': 'sess-001',
            'timestamp': '2026-02-26T14:00:00Z',
            'toolCalls': [],
            'agentsSpawned': 2,
        }))
        events = daemon.get_new_events()
        assert len(events) == 1
        assert events[0]['sessionId'] == 'sess-001'

    def test_mark_event_processed(self, tmp_path):
        daemon = NexusDaemon(repo_path=tmp_path)
        event_file = tmp_path / 'events' / 'sess-002-9999.json'
        event_file.write_text('{}')
        daemon.mark_event_processed('sess-002-9999.json')
        events = daemon.get_new_events()
        assert all(e.get('_filename') != 'sess-002-9999.json' for e in events)


# ============================================================
# CircuitBreaker tests
# ============================================================

class TestCircuitBreaker:
    def test_normal_operation(self):
        cb = CircuitBreaker(max_failures=3)
        cb.record_success('mod_a')
        assert not cb.is_blown('mod_a')
        status = cb.get_status()
        assert status['mod_a']['failures'] == 0
        assert status['mod_a']['blown'] is False

    def test_blown_after_max_failures(self):
        cb = CircuitBreaker(max_failures=3)
        cb.record_failure('mod_a')
        cb.record_failure('mod_a')
        assert not cb.is_blown('mod_a')
        cb.record_failure('mod_a')
        assert cb.is_blown('mod_a')

    def test_reset_clears_blown(self):
        cb = CircuitBreaker(max_failures=2)
        cb.record_failure('mod_a')
        cb.record_failure('mod_a')
        assert cb.is_blown('mod_a')
        cb.reset('mod_a')
        assert not cb.is_blown('mod_a')

    def test_success_resets_failure_count(self):
        cb = CircuitBreaker(max_failures=3)
        cb.record_failure('mod_a')
        cb.record_failure('mod_a')
        cb.record_success('mod_a')
        cb.record_failure('mod_a')
        cb.record_failure('mod_a')
        assert not cb.is_blown('mod_a')  # reset by success


# ============================================================
# ModuleRegistry tests
# ============================================================

class TestModuleRegistry:
    def test_register_and_get(self):
        reg = ModuleRegistry()
        obj = object()
        reg.register('test_mod', obj)
        assert reg.get('test_mod') is obj
        assert reg.get('nonexistent') is None

    def test_run_safe_success(self):
        reg = ModuleRegistry()
        reg.register('adder', None)
        result = reg.run_safe('adder', lambda x, y: x + y, 3, 4)
        assert result == 7

    def test_run_safe_failure_records(self):
        reg = ModuleRegistry()
        reg.register('bad', None)

        def boom():
            raise RuntimeError('fail')

        for _ in range(3):
            reg.run_safe('bad', boom)
        assert reg.breaker.is_blown('bad')

    def test_run_safe_skips_blown(self):
        reg = ModuleRegistry()
        reg.register('bad', None)
        reg.breaker._blown.add('bad')
        result = reg.run_safe('bad', lambda: 42)
        assert result is None

    @pytest.mark.asyncio
    async def test_run_safe_async_success(self):
        reg = ModuleRegistry()
        reg.register('async_mod', None)

        async def coro():
            return 'ok'

        result = await reg.run_safe_async('async_mod', coro)
        assert result == 'ok'

    @pytest.mark.asyncio
    async def test_run_safe_async_blown(self):
        reg = ModuleRegistry()
        reg.register('async_mod', None)
        reg.breaker._blown.add('async_mod')

        async def coro():
            return 'ok'

        result = await reg.run_safe_async('async_mod', coro)
        assert result is None

    def test_get_status(self):
        reg = ModuleRegistry()
        reg.register('a', None)
        reg.register('b', None)
        status = reg.get_status()
        assert 'a' in status['modules']
        assert 'b' in status['modules']


# ============================================================
# EventProcessor tests
# ============================================================

class TestEventProcessor:
    def test_validate_event_warns_on_missing_sessionId(self, tmp_path):
        (tmp_path / 'events').mkdir()
        ep = EventProcessor(repo_path=tmp_path)
        warnings = ep._validate_event({'toolCalls': []})
        assert any('sessionId' in w for w in warnings)

    def test_validate_event_no_warnings_when_valid(self, tmp_path):
        (tmp_path / 'events').mkdir()
        ep = EventProcessor(repo_path=tmp_path)
        warnings = ep._validate_event({'sessionId': 'abc'})
        assert warnings == []

    def test_get_new_events_still_returns_invalid_events(self, tmp_path):
        """Warn-only: events missing required fields are still returned."""
        (tmp_path / 'events').mkdir()
        ep = EventProcessor(repo_path=tmp_path)
        event_file = tmp_path / 'events' / 'no-session-001.json'
        event_file.write_text(json.dumps({'toolCalls': []}))
        events = ep.get_new_events()
        assert len(events) == 1  # not blocked


# ============================================================
# HealthReporter tests
# ============================================================

class TestHealthReporter:
    @pytest.mark.asyncio
    async def test_generate_daily_report_integrates_anomaly_and_recommendations(self, tmp_path):
        (tmp_path / 'events').mkdir()
        (tmp_path / 'consciousness').mkdir()

        mock_evaluator = MagicMock()
        mock_report = MagicMock()
        mock_evaluator.generate_report.return_value = mock_report
        mock_evaluator.format_report.return_value = '# Health Report\n'

        reporter = HealthReporter(repo_path=tmp_path, evaluator=mock_evaluator)

        events = [
            {'sessionId': f's{i}', 'agentsSpawned': 2, 'agentTypes': ['executor']}
            for i in range(5)
        ]
        # Add a spike to trigger anomaly
        events.append({'sessionId': 's99', 'agentsSpawned': 100, 'agentTypes': ['executor']})

        result = await reporter.generate_daily_report(events, telegram=None)
        assert result is not None
        anomalies, recommendations = result

        # Verify report file was written
        from datetime import datetime, timezone
        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        report_path = tmp_path / 'consciousness' / f'health-{today}.md'
        assert report_path.exists()
        content = report_path.read_text()
        assert 'Anomalies Detected' in content
        assert 'Recommendations' in content

    @pytest.mark.asyncio
    async def test_skips_if_already_reported_today(self, tmp_path):
        (tmp_path / 'events').mkdir()
        (tmp_path / 'consciousness').mkdir()

        mock_evaluator = MagicMock()
        mock_evaluator.generate_report.return_value = MagicMock()
        mock_evaluator.format_report.return_value = '# Report\n'

        reporter = HealthReporter(repo_path=tmp_path, evaluator=mock_evaluator)

        events = [{'sessionId': 's1', 'agentsSpawned': 2}]
        await reporter.generate_daily_report(events)
        # Second call same day should skip
        result = await reporter.generate_daily_report(events)
        assert result is None
        assert mock_evaluator.generate_report.call_count == 1


# ============================================================
# NexusDaemon status.md output tests
# ============================================================

class TestNexusDaemonStatus:
    def test_write_status_creates_file(self, tmp_path):
        daemon = NexusDaemon(repo_path=tmp_path)
        daemon._write_status(0)
        status_path = tmp_path / 'consciousness' / 'status.md'
        assert status_path.exists()
        content = status_path.read_text()
        assert '# nexus Status' in content
        assert 'Events processed this cycle: 0' in content
        assert '## Module Status' in content

    def test_write_status_shows_module_states(self, tmp_path):
        daemon = NexusDaemon(repo_path=tmp_path)
        daemon._write_status(5)
        content = (tmp_path / 'consciousness' / 'status.md').read_text()
        assert 'git_sync: ok' in content
        assert 'event_processor: ok' in content
        assert 'evolution_engine: ok' in content

    def test_write_status_shows_blown_module(self, tmp_path):
        daemon = NexusDaemon(repo_path=tmp_path)
        # Blow the circuit breaker for evolution_engine
        for _ in range(3):
            daemon._registry.breaker.record_failure('evolution_engine')
        daemon._write_status(0)
        content = (tmp_path / 'consciousness' / 'status.md').read_text()
        assert 'evolution_engine: blown' in content

    def test_write_status_with_anomalies(self, tmp_path):
        daemon = NexusDaemon(repo_path=tmp_path)
        from anomaly_detector import AnomalyRecord
        anomalies = [
            AnomalyRecord(index=0, value=100.0, score=3.5,
                          detector='zscore', severity='high'),
        ]
        daemon._write_status(3, anomalies=anomalies)
        content = (tmp_path / 'consciousness' / 'status.md').read_text()
        assert 'agentsSpawned: 1 anomalies' in content

    def test_write_status_no_anomalies(self, tmp_path):
        daemon = NexusDaemon(repo_path=tmp_path)
        daemon._write_status(0, anomalies=[])
        content = (tmp_path / 'consciousness' / 'status.md').read_text()
        assert '- None' in content
