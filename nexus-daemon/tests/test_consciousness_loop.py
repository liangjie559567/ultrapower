# nexus-daemon/tests/test_consciousness_loop.py
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
import json

from consciousness_loop import ConsciousnessLoop, ConsciousnessConfig


@pytest.fixture
def tmp_repo(tmp_path):
    (tmp_path / 'consciousness').mkdir()
    (tmp_path / 'consciousness' / 'rounds').mkdir()
    return tmp_path


def make_loop(tmp_repo):
    cfg = ConsciousnessConfig(
        interval_seconds=300,
        budget_percent=10,
        max_rounds_per_session=5,
    )
    return ConsciousnessLoop(repo_path=tmp_repo, config=cfg)


def test_scratchpad_path(tmp_repo):
    loop = make_loop(tmp_repo)
    assert loop.scratchpad_path == tmp_repo / 'consciousness' / 'scratchpad.md'


def test_rounds_dir(tmp_repo):
    loop = make_loop(tmp_repo)
    assert loop.rounds_dir == tmp_repo / 'consciousness' / 'rounds'


def test_write_scratchpad(tmp_repo):
    loop = make_loop(tmp_repo)
    loop._write_scratchpad('test content')
    assert loop.scratchpad_path.read_text() == 'test content'


def test_write_round_record(tmp_repo):
    loop = make_loop(tmp_repo)
    loop._write_round_record(round_num=1, content='round 1 thoughts')
    files = list(loop.rounds_dir.glob('round-*.md'))
    assert len(files) == 1
    assert 'round 1 thoughts' in files[0].read_text()


def test_is_paused_when_busy(tmp_repo):
    loop = make_loop(tmp_repo)
    # Create a busy marker
    (tmp_repo / '.nexus-busy').write_text('1')
    assert loop.is_paused() is True


def test_not_paused_when_idle(tmp_repo):
    loop = make_loop(tmp_repo)
    assert loop.is_paused() is False
