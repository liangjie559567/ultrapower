# nexus-daemon/tests/test_daemon.py
import pytest
import json
import os
from pathlib import Path
from unittest.mock import patch, MagicMock

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from daemon import NexusDaemon, DaemonConfig, load_config

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
