import pytest
import json
from pathlib import Path
from unittest.mock import patch, MagicMock
import tempfile
import shutil

from self_modifier import SelfModifier, ModificationResult


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
