"""Anomaly detection using Strategy pattern.

P0 implements ZScoreDetector only. IQR and EWMA detectors are planned for P2.
"""
from __future__ import annotations

import math
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class AnomalyRecord:
    """A single detected anomaly."""

    index: int
    value: float
    score: float  # deviation score (e.g. z-score)
    detector: str  # which detector flagged it
    severity: str  # 'low', 'medium', 'high'
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class AnomalyDetector(ABC):
    """Abstract base for anomaly detection strategies."""

    @abstractmethod
    def detect(self, values: list[float]) -> list[AnomalyRecord]:
        """Analyze values and return detected anomalies."""
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable detector name."""
        ...


class ZScoreDetector(AnomalyDetector):
    """Detect anomalies using Z-score (standard deviations from mean).

    Good for catching sudden spikes when data is roughly normal.
    """

    def __init__(self, threshold: float = 2.0):
        if threshold <= 0:
            raise ValueError("threshold must be positive")
        self.threshold = threshold

    @property
    def name(self) -> str:
        return "zscore"

    def detect(self, values: list[float]) -> list[AnomalyRecord]:
        """Analyze values and return anomalies whose z-score >= threshold."""
        if len(values) < 3:
            return []

        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        std = math.sqrt(variance)

        if std == 0:
            return []

        anomalies = []
        for i, v in enumerate(values):
            z = abs(v - mean) / std
            if z >= self.threshold:
                if z >= self.threshold * 1.5:
                    severity = "high"
                elif z >= self.threshold * 1.2:
                    severity = "medium"
                else:
                    severity = "low"
                anomalies.append(
                    AnomalyRecord(
                        index=i,
                        value=v,
                        score=round(z, 3),
                        detector=self.name,
                        severity=severity,
                    )
                )
        return anomalies


class CompositeDetector(AnomalyDetector):
    """Combines multiple detectors. An anomaly flagged by any detector is included.

    Deduplicates by index — if multiple detectors flag the same index,
    keeps the one with the highest score.
    """

    def __init__(self, detectors: list[AnomalyDetector]):
        if not detectors:
            raise ValueError("At least one detector is required")
        self._detectors = detectors

    @property
    def name(self) -> str:
        return "composite(" + ",".join(d.name for d in self._detectors) + ")"

    def detect(self, values: list[float]) -> list[AnomalyRecord]:
        """Run all child detectors and return deduplicated anomalies sorted by index."""
        best_by_index: dict[int, AnomalyRecord] = {}
        for detector in self._detectors:
            for anomaly in detector.detect(values):
                existing = best_by_index.get(anomaly.index)
                if existing is None or anomaly.score > existing.score:
                    best_by_index[anomaly.index] = anomaly
        return sorted(best_by_index.values(), key=lambda a: a.index)


def detect_anomalies_in_events(
    events: list[dict[str, Any]],
    metric: str = "agentsSpawned",
    detector: AnomalyDetector | None = None,
) -> list[AnomalyRecord]:
    """Convenience function: extract a numeric metric from events and detect anomalies.

    Args:
        events: List of event dicts
        metric: Key to extract numeric values from
        detector: Detector to use (defaults to ZScoreDetector)

    Returns:
        List of detected anomalies
    """
    if detector is None:
        detector = ZScoreDetector()

    values: list[float] = []
    for e in events:
        v = e.get(metric)
        if isinstance(v, (int, float)):
            values.append(float(v))

    return detector.detect(values)
