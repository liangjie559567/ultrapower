# nexus-daemon/self_modifier.py
"""Self-Modifier: applies improvement suggestions to the ultrapower repo."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Only these path prefixes are allowed for auto-modification
ALLOWED_PREFIXES = ('skills/', 'agents/')
# Confidence threshold: below this, skip without applying
CONFIDENCE_THRESHOLD = 70


@dataclass
class ModificationResult:
    status: str   # 'applied' | 'skipped' | 'rejected' | 'error'
    reason: str
    improvement_id: str


class SelfModifier:
    """Applies improvement suggestions to skill/agent Markdown files."""

    def __init__(self, repo_path: Path) -> None:
        self.repo_path = Path(repo_path)

    def _validate_target(self, target_file: str) -> str | None:
        """Return error message if target_file is invalid, else None."""
        # Reject path traversal
        try:
            resolved = (self.repo_path / target_file).resolve()
            resolved.relative_to(self.repo_path.resolve())
        except ValueError:
            return 'path traversal detected'

        # Only allow skills/ and agents/ directories
        if not any(target_file.startswith(p) for p in ALLOWED_PREFIXES):
            return f'target outside allowed prefixes {ALLOWED_PREFIXES}'

        # Only allow Markdown files
        if not target_file.endswith('.md'):
            return 'only .md files are allowed for auto-modification'

        return None

    def apply(self, improvement: dict[str, Any]) -> ModificationResult:
        """Apply a single improvement. Returns ModificationResult."""
        imp_id = improvement.get('id', 'unknown')
        confidence = improvement.get('confidence', 0)
        target_file = improvement.get('targetFile', '')
        new_content = improvement.get('newContent')

        # Confidence gate
        if confidence < CONFIDENCE_THRESHOLD:
            return ModificationResult(
                status='skipped',
                reason='confidence below threshold',
                improvement_id=imp_id,
            )

        # newContent check before path validation
        if new_content is None:
            return ModificationResult(
                status='error',
                reason='newContent field missing',
                improvement_id=imp_id,
            )

        # Path validation
        error = self._validate_target(target_file)
        if error:
            return ModificationResult(
                status='rejected',
                reason=error,
                improvement_id=imp_id,
            )

        # Apply: write new content
        target_path = self.repo_path / target_file

        try:
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_text(new_content, encoding='utf-8')
            logger.info('Applied improvement %s to %s', imp_id, target_file)
            return ModificationResult(
                status='applied',
                reason=f'wrote {len(new_content)} bytes to {target_file}',
                improvement_id=imp_id,
            )
        except OSError as e:
            return ModificationResult(
                status='error',
                reason=str(e),
                improvement_id=imp_id,
            )
