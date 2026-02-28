import pytest
from pathlib import Path
import json
from self_evaluator import SelfEvaluator, SkillStats, HealthReport, DimensionScore, EnhancedHealthReport


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
    # 10 sessions: 'learner' triggered every time, 'rare-skill' triggered only once (<10%)
    for i in range(10):
        evt = make_event(f's{i}', ['learner'])
        (tmp_repo / 'events' / f's{i}.json').write_text(json.dumps(evt))
    # Add 10 more sessions with only 'learner', then one session with 'rare-skill'.
    # Total: 21 sessions, rare-skill triggered 1/21 ≈ 4.8% < 10% → zombie.
    for i in range(10, 20):
        evt = make_event(f's{i}', ['learner'])
        (tmp_repo / 'events' / f's{i}.json').write_text(json.dumps(evt))
    rare_evt = make_event('s_rare', ['rare-skill'])
    (tmp_repo / 'events' / 's_rare.json').write_text(json.dumps(rare_evt))
    ev = SelfEvaluator(repo_path=tmp_repo, zombie_threshold=5)
    report = ev.generate_report()
    assert report.total_sessions == 21
    assert 'rare-skill' in report.zombie_skills
    assert 'learner' not in report.zombie_skills


def test_zombie_detection_suppressed_below_threshold(tmp_path):
    # With only 3 sessions (< default threshold of 10), no zombies should be flagged
    events_dir = tmp_path / 'events'
    events_dir.mkdir()
    for i in range(3):
        (events_dir / f's{i}.json').write_text(
            json.dumps({'sessionId': f's{i}', 'skillsTriggered': ['rare-skill']}),
            encoding='utf-8',
        )
    evaluator = SelfEvaluator(repo_path=tmp_path)
    report = evaluator.generate_report()
    assert report.zombie_skills == []


def test_format_report_markdown(tmp_repo):
    ev = SelfEvaluator(repo_path=tmp_repo)
    report = HealthReport(total_sessions=3, skill_stats={}, zombie_skills=[])
    md = ev.format_report(report)
    assert '# nexus Health Report' in md
    assert 'Total sessions: 3' in md


def test_format_report_with_zombie_skills(tmp_repo):
    ev = SelfEvaluator(repo_path=tmp_repo)
    stats = {'learner': SkillStats(trigger_count=20), 'rare-skill': SkillStats(trigger_count=1)}
    report = HealthReport(total_sessions=21, skill_stats=stats, zombie_skills=['rare-skill'])
    md = ev.format_report(report)
    assert '## Zombie Skills' in md
    assert '`rare-skill`' in md


class TestBackwardCompatibility:
    """确保新接口不破坏现有调用"""

    def test_repo_path_init_still_works(self, tmp_path):
        (tmp_path / 'events').mkdir()
        ev = SelfEvaluator(repo_path=tmp_path)
        report = ev.generate_report()
        assert isinstance(report, HealthReport)

    def test_events_init_mode(self):
        events = [
            {'sessionId': 's1', 'skillsTriggered': ['autopilot']},
            {'sessionId': 's2', 'skillsTriggered': ['ralph']},
        ]
        ev = SelfEvaluator(events=events)
        report = ev.generate_report()
        assert report.total_sessions == 2
        assert 'autopilot' in report.skill_stats


class TestEnhancedHealthReport:
    def test_generates_six_dimensions(self):
        events = [
            {
                'sessionId': 's1',
                'skillsTriggered': ['autopilot', 'ralph'],
                'toolCalls': [{'name': 'Read'}, {'name': 'Edit'}],
                'modesUsed': ['ultrawork'],
                'agentsSpawned': 3,
                'agentsCompleted': 3,
                'errors': [],
            },
            {
                'sessionId': 's2',
                'skillsTriggered': ['ultrawork'],
                'toolCalls': [{'name': 'Grep'}],
                'modesUsed': ['ralph'],
                'agentsSpawned': 2,
                'agentsCompleted': 2,
                'errors': [],
            },
        ]
        ev = SelfEvaluator(events=events)
        report = ev.generate_health_report()
        assert isinstance(report, EnhancedHealthReport)
        assert len(report.dimension_scores) == 6
        assert 0.0 <= report.overall_score <= 1.0
        dim_names = {d.name for d in report.dimension_scores}
        assert dim_names == {'skill_health', 'tool_health', 'mode_health',
                             'error_health', 'agent_health', 'evolution_health'}

    def test_perfect_agent_health(self):
        events = [
            {'sessionId': 's1', 'agentsSpawned': 5, 'agentsCompleted': 5},
        ]
        ev = SelfEvaluator(events=events)
        report = ev.generate_health_report()
        agent_dim = next(d for d in report.dimension_scores if d.name == 'agent_health')
        assert agent_dim.score == 1.0

    def test_error_health_degrades_with_errors(self):
        events = [
            {'sessionId': 's1', 'errors': [{'type': 'timeout'}]},
            {'sessionId': 's2', 'errors': []},
            {'sessionId': 's3', 'errors': [{'type': 'crash'}]},
        ]
        ev = SelfEvaluator(events=events)
        report = ev.generate_health_report()
        error_dim = next(d for d in report.dimension_scores if d.name == 'error_health')
        # 2/3 有错误 → error_rate=0.667 → score = max(0, 1 - 0.667*2) = 0
        assert error_dim.score < 0.5

    def test_empty_events_health_report(self):
        ev = SelfEvaluator(events=[])
        report = ev.generate_health_report()
        assert report.overall_score == 0.0
        assert report.total_sessions == 0

    def test_format_health_report(self):
        ev = SelfEvaluator(events=[])
        report = ev.generate_health_report()
        md = ev.format_health_report(report)
        assert '# nexus Enhanced Health Report' in md
        assert 'Overall Score' in md
        assert 'Dimension Scores' in md
