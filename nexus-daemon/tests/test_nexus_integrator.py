"""Tests for nexus_integrator.py — NexusIntegrator and IntegrationResult."""
from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from nexus_integrator import NexusIntegrator, IntegrationResult


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def _sample_events(n: int = 5) -> list[dict]:
    """Generate simple synthetic events."""
    events = []
    for i in range(n):
        events.append({
            "sessionId": f"test-{i}",
            "timestamp": f"2026-01-01T10:{i:02d}:00Z",
            "agentsSpawned": i + 1,
            "agentTypes": ["coder"],
            "skillsUsed": ["refactor"],
            "toolCalls": 10,
            "toolsUsed": ["read_file"],
            "durationMs": 5000,
            "mode": "manual",
            "tokensIn": 1000,
            "tokensOut": 500,
        })
    return events


# ---------------------------------------------------------------------------
# IntegrationResult tests
# ---------------------------------------------------------------------------

class TestIntegrationResult:
    def test_success_when_no_errors(self):
        r = IntegrationResult(
            timestamp="2026-01-01T00:00:00Z",
            events_processed=5,
            patterns_found=2,
            health_score=0.85,
            anomaly_count=0,
            recommendation_count=3,
            bottleneck_count=1,
            reflection_score=0.7,
            knowledge_nodes=10,
            knowledge_edges=15,
            dashboard_score=80.0,
            dashboard_status="healthy",
            errors=[],
        )
        assert r.success is True

    def test_failure_when_errors_present(self):
        r = IntegrationResult(
            timestamp="2026-01-01T00:00:00Z",
            events_processed=0,
            patterns_found=0,
            health_score=0.0,
            anomaly_count=0,
            recommendation_count=0,
            bottleneck_count=0,
            reflection_score=None,
            knowledge_nodes=0,
            knowledge_edges=0,
            dashboard_score=50.0,
            dashboard_status="unknown",
            errors=["something broke"],
        )
        assert r.success is False

    def test_to_dict_roundtrip(self):
        r = IntegrationResult(
            timestamp="2026-01-01T00:00:00Z",
            events_processed=3,
            patterns_found=1,
            health_score=0.9,
            anomaly_count=2,
            recommendation_count=4,
            bottleneck_count=0,
            reflection_score=0.65,
            knowledge_nodes=5,
            knowledge_edges=8,
            dashboard_score=75.0,
            dashboard_status="warning",
            errors=["minor issue"],
        )
        d = r.to_dict()
        assert d["timestamp"] == "2026-01-01T00:00:00Z"
        assert d["events_processed"] == 3
        assert d["errors"] == ["minor issue"]
        # Verify JSON-serializable
        json.dumps(d)


# ---------------------------------------------------------------------------
# NexusIntegrator — run_cycle tests
# ---------------------------------------------------------------------------

class TestNexusIntegratorRunCycle:
    def test_run_cycle_returns_integration_result(self):
        integrator = NexusIntegrator()
        result = integrator.run_cycle(_sample_events(5))
        assert isinstance(result, IntegrationResult)
        assert result.events_processed == 5

    def test_run_cycle_completes_with_fault_isolation(self):
        integrator = NexusIntegrator()
        result = integrator.run_cycle(_sample_events(3))
        # Cycle completes even if some subsystems encounter format mismatches
        assert isinstance(result, IntegrationResult)
        assert result.events_processed == 3
        # Errors are captured, not raised
        for err in result.errors:
            assert isinstance(err, str)

    def test_run_cycle_empty_events(self):
        integrator = NexusIntegrator()
        result = integrator.run_cycle([])
        assert isinstance(result, IntegrationResult)
        assert result.events_processed == 0

    def test_run_cycle_populates_all_fields(self):
        integrator = NexusIntegrator()
        result = integrator.run_cycle(_sample_events(5))
        assert result.timestamp is not None
        assert isinstance(result.patterns_found, int)
        assert isinstance(result.health_score, float)
        assert isinstance(result.anomaly_count, int)
        assert isinstance(result.recommendation_count, int)
        assert isinstance(result.bottleneck_count, int)
        assert isinstance(result.knowledge_nodes, int)
        assert isinstance(result.knowledge_edges, int)
        assert isinstance(result.dashboard_score, float)
        assert isinstance(result.dashboard_status, str)


# ---------------------------------------------------------------------------
# Fault isolation — individual step failures don't block others
# ---------------------------------------------------------------------------

class TestFaultIsolation:
    def test_pattern_failure_does_not_block_cycle(self):
        """Simulate evolution_engine import failure — cycle still completes."""
        import importlib
        import nexus_integrator as ni

        # Temporarily make evolution_engine un-importable
        original_import = __builtins__.__import__ if hasattr(__builtins__, '__import__') else __import__

        def mock_import(name, *args, **kwargs):
            if name == "evolution_engine":
                raise ImportError("mocked failure")
            return original_import(name, *args, **kwargs)

        with patch("builtins.__import__", side_effect=mock_import):
            integrator = NexusIntegrator()
            result = integrator.run_cycle(_sample_events(3))
            assert isinstance(result, IntegrationResult)
            assert result.events_processed == 3
            assert any("pattern_detection" in e for e in result.errors)

    def test_health_failure_records_error(self):
        """Simulate self_evaluator import failure."""
        original_import = __import__

        def mock_import(name, *args, **kwargs):
            if name == "self_evaluator":
                raise ImportError("mocked failure")
            return original_import(name, *args, **kwargs)

        with patch("builtins.__import__", side_effect=mock_import):
            integrator = NexusIntegrator()
            result = integrator.run_cycle(_sample_events(2))
            assert isinstance(result, IntegrationResult)
            assert result.health_score == 0.0
            assert any("health_evaluation" in e for e in result.errors)

    def test_multiple_failures_still_complete(self):
        """Multiple subsystem failures don't prevent cycle completion."""
        original_import = __import__
        blocked = {"anomaly_detector", "bottleneck_analyzer"}

        def mock_import(name, *args, **kwargs):
            if name in blocked:
                raise ImportError(f"mocked {name}")
            return original_import(name, *args, **kwargs)

        with patch("builtins.__import__", side_effect=mock_import):
            integrator = NexusIntegrator()
            result = integrator.run_cycle(_sample_events(2))
            assert isinstance(result, IntegrationResult)
            assert result.events_processed == 2
            assert any("anomaly_detection" in e for e in result.errors)
            assert any("bottleneck_analysis" in e for e in result.errors)


# ---------------------------------------------------------------------------
# Persistence
# ---------------------------------------------------------------------------

class TestPersistence:
    def test_save_result_creates_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            integrator = NexusIntegrator(repo_path=repo)
            result = integrator.run_cycle(_sample_events(3))
            # Check that a JSON file was created
            out_dir = repo / "evolution"
            files = list(out_dir.glob("integration-*.json"))
            assert len(files) == 1
            data = json.loads(files[0].read_text(encoding="utf-8"))
            assert data["events_processed"] == 3

    def test_no_save_without_repo_path(self):
        integrator = NexusIntegrator()  # no repo_path
        result = integrator.run_cycle(_sample_events(2))
        # Should not raise, just skip saving
        assert result.events_processed == 2


# ---------------------------------------------------------------------------
# verify_subsystems
# ---------------------------------------------------------------------------

class TestVerifySubsystems:
    def test_returns_dict_of_bools(self):
        results = NexusIntegrator.verify_subsystems()
        assert isinstance(results, dict)
        assert len(results) > 0
        for name, ok in results.items():
            assert isinstance(name, str)
            assert isinstance(ok, bool)

    def test_all_known_subsystems_present(self):
        results = NexusIntegrator.verify_subsystems()
        expected = {
            "evolution_engine", "self_evaluator", "anomaly_detector",
            "recommendation_engine", "bottleneck_analyzer", "reflexion",
            "knowledge_graph", "experience_sharing", "prompt_optimizer",
            "memory_model", "code_health_scorer", "evolution_dashboard",
            "module_registry", "self_modifier", "daemon",
        }
        assert set(results.keys()) == expected

    def test_all_subsystems_importable(self):
        results = NexusIntegrator.verify_subsystems()
        failed = [name for name, ok in results.items() if not ok]
        assert failed == [], f"Failed to import: {failed}"
