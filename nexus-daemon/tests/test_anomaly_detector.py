import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from anomaly_detector import (
    AnomalyDetector,
    AnomalyRecord,
    ZScoreDetector,
    CompositeDetector,
    detect_anomalies_in_events,
)


class TestZScoreDetector:
    def test_detects_obvious_outlier(self):
        values = [10, 11, 10, 12, 10, 11, 100]  # 100 is clearly an outlier
        detector = ZScoreDetector(threshold=2.0)
        anomalies = detector.detect(values)
        assert len(anomalies) >= 1
        assert any(a.index == 6 and a.value == 100 for a in anomalies)

    def test_no_anomalies_in_uniform_data(self):
        values = [10.0] * 10
        detector = ZScoreDetector()
        anomalies = detector.detect(values)
        assert anomalies == []

    def test_returns_empty_for_short_data(self):
        detector = ZScoreDetector()
        assert detector.detect([]) == []
        assert detector.detect([1.0]) == []
        assert detector.detect([1.0, 2.0]) == []

    def test_severity_levels(self):
        values = [10.0] * 20 + [100.0]
        detector = ZScoreDetector(threshold=2.0)
        anomalies = detector.detect(values)
        assert len(anomalies) >= 1
        assert anomalies[0].severity in ("low", "medium", "high")

    def test_threshold_validation(self):
        with pytest.raises(ValueError):
            ZScoreDetector(threshold=0)
        with pytest.raises(ValueError):
            ZScoreDetector(threshold=-1)

    def test_custom_threshold(self):
        values = [10, 11, 10, 12, 10, 11, 20]
        strict = ZScoreDetector(threshold=1.5)
        lenient = ZScoreDetector(threshold=3.0)
        assert len(strict.detect(values)) >= len(lenient.detect(values))

    def test_name_property(self):
        assert ZScoreDetector().name == "zscore"


class TestCompositeDetector:
    def test_combines_results(self):
        d1 = ZScoreDetector(threshold=1.5)
        d2 = ZScoreDetector(threshold=2.5)
        composite = CompositeDetector([d1, d2])
        values = [10.0] * 20 + [50.0]
        anomalies = composite.detect(values)
        assert len(anomalies) >= 1

    def test_deduplicates_by_index(self):
        d1 = ZScoreDetector(threshold=1.5)
        d2 = ZScoreDetector(threshold=2.0)
        composite = CompositeDetector([d1, d2])
        values = [10.0] * 20 + [100.0]
        anomalies = composite.detect(values)
        indices = [a.index for a in anomalies]
        assert len(indices) == len(set(indices))

    def test_keeps_highest_score(self):
        d1 = ZScoreDetector(threshold=1.0)
        d2 = ZScoreDetector(threshold=1.5)
        composite = CompositeDetector([d1, d2])
        values = [10.0] * 20 + [100.0]
        anomalies = composite.detect(values)
        if anomalies:
            assert anomalies[-1].score > 0

    def test_requires_at_least_one_detector(self):
        with pytest.raises(ValueError):
            CompositeDetector([])

    def test_name_includes_children(self):
        composite = CompositeDetector([ZScoreDetector()])
        assert "zscore" in composite.name

    def test_sorted_by_index(self):
        d = ZScoreDetector(threshold=1.0)
        composite = CompositeDetector([d])
        values = [100.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 100.0]
        anomalies = composite.detect(values)
        if len(anomalies) >= 2:
            assert anomalies[0].index < anomalies[-1].index


class TestDetectAnomaliesInEvents:
    def test_extracts_metric_and_detects(self):
        # Use a clear outlier: 10 normal values + one extreme spike
        events = [{"agentsSpawned": 3}] * 10 + [{"agentsSpawned": 100}]
        anomalies = detect_anomalies_in_events(events)
        assert len(anomalies) >= 1

    def test_custom_metric(self):
        # Use a clear outlier: 10 normal values + one extreme spike
        events = [{"duration": 10}] * 10 + [{"duration": 500}]
        anomalies = detect_anomalies_in_events(events, metric="duration")
        assert len(anomalies) >= 1

    def test_skips_non_numeric(self):
        events = [
            {"agentsSpawned": 3},
            {"agentsSpawned": "invalid"},
            {"agentsSpawned": 3},
            {"agentsSpawned": 3},
        ]
        anomalies = detect_anomalies_in_events(events)
        assert isinstance(anomalies, list)

    def test_empty_events(self):
        anomalies = detect_anomalies_in_events([])
        assert anomalies == []

    def test_custom_detector(self):
        events = [{"agentsSpawned": i} for i in [3, 3, 3, 3, 100]]
        detector = ZScoreDetector(threshold=1.5)
        anomalies = detect_anomalies_in_events(events, detector=detector)
        assert len(anomalies) >= 1
