import pytest
from pathlib import Path
import json
from self_evaluator import SelfEvaluator, SkillStats, HealthReport


@pytest.fixture
def tmp_repo(tmp_path):
    events_dir = tmp_path / 'events'
    events_dir.mkdir()
    return tmp_path


def make_event(session_id: str, skills_triggered: list[str]) -> dict:
    return {
        'sessionId': session_id,
        'timestamp': '2026-02-26T10:00:00Z',
        'skillsTriggered': skills_triggered,
    }


def test_empty_events_returns_empty_report(tmp_repo):
    ev = SelfEvaluator(repo_path=tmp_repo)
    report = ev.generate_report()
    assert isinstance(report, HealthReport)
    assert report.total_sessions == 0
    assert report.skill_stats == {}


def test_counts_skill_usage(tmp_repo):
    (tmp_repo / 'events').mkdir(exist_ok=True)
    evt = make_event('s1', ['learner', 'autopilot'])
    (tmp_repo / 'events' / 's1.json').write_text(json.dumps(evt))
    ev = SelfEvaluator(repo_path=tmp_repo)
    report = ev.generate_report()
    assert report.skill_stats['learner'].trigger_count == 1
    assert report.skill_stats['autopilot'].trigger_count == 1


def test_detects_zombie_skills(tmp_repo):
    (tmp_repo / 'events').mkdir(exist_ok=True)
    # 10 sessions, none trigger 'zombie-skill'
    for i in range(10):
        evt = make_event(f's{i}', ['learner'])
        (tmp_repo / 'events' / f's{i}.json').write_text(json.dumps(evt))
    ev = SelfEvaluator(repo_path=tmp_repo, zombie_threshold=5)
    report = ev.generate_report()
    assert 'zombie-skill' not in report.skill_stats
    assert report.total_sessions == 10


def test_format_report_markdown(tmp_repo):
    ev = SelfEvaluator(repo_path=tmp_repo)
    report = HealthReport(total_sessions=3, skill_stats={}, zombie_skills=[])
    md = ev.format_report(report)
    assert '# nexus Health Report' in md
    assert 'Total sessions: 3' in md
