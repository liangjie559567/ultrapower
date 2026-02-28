import pytest
import json
from pathlib import Path
from unittest.mock import patch, MagicMock
import tempfile
import shutil

from self_modifier import (
    SelfModifier, ModificationResult,
    SandboxValidator, SandboxResult,
    ModificationHistory,
)


@pytest.fixture
def repo(tmp_path):
    """Create a minimal fake ultrapower repo."""
    skills_dir = tmp_path / 'skills' / 'learner'
    skills_dir.mkdir(parents=True)
    skill_file = skills_dir / 'SKILL.md'
    skill_file.write_text(
        '---\nname: learner\ntriggers:\n  - learn\n---\n# Learner\n'
    )
    # Init git
    import subprocess
    subprocess.run(['git', 'init'], cwd=tmp_path, capture_output=True)
    subprocess.run(['git', 'add', '.'], cwd=tmp_path, capture_output=True)
    subprocess.run(
        ['git', 'commit', '-m', 'init'],
        cwd=tmp_path, capture_output=True,
        env={**__import__('os').environ, 'GIT_AUTHOR_NAME': 'test',
             'GIT_AUTHOR_EMAIL': 'test@test.com',
             'GIT_COMMITTER_NAME': 'test',
             'GIT_COMMITTER_EMAIL': 'test@test.com'},
    )
    return tmp_path


def test_apply_skill_update_low_confidence_skipped(repo):
    """Improvements with confidence < 70 are skipped."""
    modifier = SelfModifier(repo_path=repo)
    improvement = {
        'id': 'imp-001',
        'type': 'skill_update',
        'targetFile': 'skills/learner/SKILL.md',
        'confidence': 60,
        'diff': '--- a/skills/learner/SKILL.md\n+++ b/skills/learner/SKILL.md\n'
                '@@ -3,1 +3,2 @@\n   - learn\n+  - study\n',
        'reason': 'add synonym',
    }
    result = modifier.apply(improvement)
    assert result.status == 'skipped'
    assert result.reason == 'confidence below threshold'


def test_apply_skill_update_high_confidence_applies(repo):
    """Improvements with confidence >= 70 on skill files are applied."""
    modifier = SelfModifier(repo_path=repo)
    new_content = (
        '---\nname: learner\ntriggers:\n  - learn\n  - study\n---\n# Learner\n'
    )
    improvement = {
        'id': 'imp-002',
        'type': 'skill_update',
        'targetFile': 'skills/learner/SKILL.md',
        'confidence': 75,
        'newContent': new_content,
        'reason': 'add synonym study',
    }
    result = modifier.apply(improvement)
    assert result.status == 'applied'
    applied_content = (repo / 'skills' / 'learner' / 'SKILL.md').read_text()
    assert 'study' in applied_content


def test_apply_rejects_path_traversal(repo):
    """Path traversal in targetFile is rejected."""
    modifier = SelfModifier(repo_path=repo)
    improvement = {
        'id': 'imp-003',
        'type': 'skill_update',
        'targetFile': '../../etc/passwd',
        'confidence': 90,
        'newContent': 'malicious',
        'reason': 'test',
    }
    result = modifier.apply(improvement)
    assert result.status == 'rejected'
    assert 'path traversal' in result.reason.lower()


# ---------------------------------------------------------------------------
# SandboxValidator tests
# ---------------------------------------------------------------------------

@pytest.fixture
def validator():
    return SandboxValidator()


def test_sandbox_valid_content_passes(validator, tmp_path):
    content = '# Hello\n\nThis is valid markdown content.\n'
    result = validator.validate('skills/foo/SKILL.md', content, tmp_path)
    assert result.passed is True
    assert result.failures == []
    assert 'non_empty' in result.checks
    assert result.duration_ms >= 0


def test_sandbox_empty_content_fails(validator, tmp_path):
    result = validator.validate('skills/foo/SKILL.md', '', tmp_path)
    assert result.passed is False
    assert any('non_empty' in f for f in result.failures)


def test_sandbox_whitespace_only_fails(validator, tmp_path):
    result = validator.validate('skills/foo/SKILL.md', '   \n\t\n', tmp_path)
    assert result.passed is False
    assert any('non_empty' in f for f in result.failures)


def test_sandbox_oversized_content_fails(validator, tmp_path):
    big = 'x' * (1024 * 1024 + 1)
    result = validator.validate('skills/foo/SKILL.md', big, tmp_path)
    assert result.passed is False
    assert any('size_limit' in f for f in result.failures)


def test_sandbox_dangerous_pattern_rm_rf(validator, tmp_path):
    content = '# Bad\n\nrm -rf /\n'
    result = validator.validate('skills/foo/SKILL.md', content, tmp_path)
    assert result.passed is False
    assert any('dangerous_patterns' in f for f in result.failures)


def test_sandbox_dangerous_pattern_eval(validator, tmp_path):
    content = '# Bad\n\neval(user_input)\n'
    result = validator.validate('skills/foo/SKILL.md', content, tmp_path)
    assert result.passed is False
    assert any('dangerous_patterns' in f for f in result.failures)


# ---------------------------------------------------------------------------
# ModificationHistory tests
# ---------------------------------------------------------------------------

@pytest.fixture
def history(tmp_path):
    return ModificationHistory(tmp_path / 'history')


def test_history_record_and_get(history, tmp_path):
    rid = history.record('imp-1', 'skills/foo/SKILL.md', 'old', 'new')
    assert rid
    entry = history.get_record(rid)
    assert entry is not None
    assert entry['imp_id'] == 'imp-1'
    assert entry['old_content'] == 'old'
    assert entry['new_content'] == 'new'
    assert entry['target_file'] == 'skills/foo/SKILL.md'


def test_history_get_record_missing(history):
    assert history.get_record('nonexistent-id') is None


def test_history_get_recent_sorted(history):
    import time as _time
    history.record('a', 'skills/a/SKILL.md', None, 'a')
    _time.sleep(0.01)
    history.record('b', 'skills/b/SKILL.md', None, 'b')
    _time.sleep(0.01)
    history.record('c', 'skills/c/SKILL.md', None, 'c')
    recent = history.get_recent(2)
    assert len(recent) == 2
    # Most recent first
    assert recent[0]['imp_id'] == 'c'
    assert recent[1]['imp_id'] == 'b'


def test_history_rollback_restores_content(history, tmp_path):
    target = tmp_path / 'skills' / 'foo' / 'SKILL.md'
    target.parent.mkdir(parents=True)
    target.write_text('original content', encoding='utf-8')

    rid = history.record('imp-x', 'skills/foo/SKILL.md', 'original content', 'new content')
    target.write_text('new content', encoding='utf-8')

    ok = history.rollback(rid, tmp_path)
    assert ok is True
    assert target.read_text(encoding='utf-8') == 'original content'


def test_history_rollback_new_file_deletes(history, tmp_path):
    target = tmp_path / 'skills' / 'new' / 'SKILL.md'
    target.parent.mkdir(parents=True)
    target.write_text('brand new', encoding='utf-8')

    rid = history.record('imp-y', 'skills/new/SKILL.md', None, 'brand new')
    ok = history.rollback(rid, tmp_path)
    assert ok is True
    assert not target.exists()


# ---------------------------------------------------------------------------
# SelfModifier enhanced apply() tests
# ---------------------------------------------------------------------------

def _good_improvement(imp_id='imp-s1'):
    return {
        'id': imp_id,
        'targetFile': 'skills/learner/SKILL.md',
        'confidence': 80,
        'newContent': '# Updated\n\nSome valid content.\n',
    }


def test_apply_sandbox_true_valid_passes(repo):
    modifier = SelfModifier(repo_path=repo)
    result = modifier.apply(_good_improvement(), sandbox=True, canary=False)
    assert result.status == 'applied'


def test_apply_sandbox_true_rejects_empty_content(repo):
    modifier = SelfModifier(repo_path=repo)
    imp = {
        'id': 'imp-bad',
        'targetFile': 'skills/learner/SKILL.md',
        'confidence': 80,
        'newContent': '',
    }
    result = modifier.apply(imp, sandbox=True, canary=False)
    assert result.status == 'rejected'
    assert 'sandbox' in result.reason.lower()


def test_apply_sandbox_true_rejects_dangerous_content(repo):
    modifier = SelfModifier(repo_path=repo)
    imp = {
        'id': 'imp-danger',
        'targetFile': 'skills/learner/SKILL.md',
        'confidence': 80,
        'newContent': '# Skill\n\nrm -rf /\n',
    }
    result = modifier.apply(imp, sandbox=True, canary=False)
    assert result.status == 'rejected'
    assert 'sandbox' in result.reason.lower()


def test_apply_canary_true_records_history(repo, tmp_path):
    history_dir = tmp_path / 'hist'
    modifier = SelfModifier(repo_path=repo, history_dir=history_dir)
    result = modifier.apply(_good_improvement('imp-c1'), sandbox=False, canary=True)
    assert result.status == 'applied'
    assert 'record=' in result.reason
    # History directory should have at least one record
    records = list(history_dir.glob('*.json'))
    assert len(records) == 1


def test_apply_canary_true_rollback_on_write_failure(repo, tmp_path):
    history_dir = tmp_path / 'hist'
    modifier = SelfModifier(repo_path=repo, history_dir=history_dir)

    original_content = (repo / 'skills' / 'learner' / 'SKILL.md').read_text()

    imp = _good_improvement('imp-fail')
    target_path = repo / 'skills' / 'learner' / 'SKILL.md'

    original_write = Path.write_text

    def failing_write(self, data, encoding=None, errors=None):
        # Only fail when writing to the target skill file
        if self == target_path:
            raise OSError('simulated write failure')
        return original_write(self, data, encoding=encoding or 'utf-8')

    import unittest.mock as mock
    with mock.patch.object(Path, 'write_text', failing_write):
        result = modifier.apply(imp, sandbox=False, canary=True)

    assert result.status == 'error'
    # After rollback the file should still have original content
    restored = (repo / 'skills' / 'learner' / 'SKILL.md').read_text()
    assert restored == original_content
