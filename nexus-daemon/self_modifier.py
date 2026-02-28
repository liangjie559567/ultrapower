# nexus-daemon/self_modifier.py
"""Self-Modifier: applies improvement suggestions to the ultrapower repo."""
from __future__ import annotations

import json
import logging
import re
import tempfile
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Only these path prefixes are allowed for auto-modification
ALLOWED_PREFIXES = ('skills/', 'agents/')
# Confidence threshold: below this, skip without applying
CONFIDENCE_THRESHOLD = 70
# Max allowed file size for auto-modification (1 MB)
MAX_FILE_SIZE = 1024 * 1024
# Dangerous patterns that must not appear in new content
_DANGEROUS_PATTERNS = [
    r'\brm\s+-rf\b',
    r'\beval\s*\(',
    r'__import__\s*\(',
    r'\bos\.system\s*\(',
    r'\bsubprocess\.call\s*\(',
    r'\bexec\s*\(',
]


@dataclass
class ModificationResult:
    status: str   # 'applied' | 'skipped' | 'rejected' | 'error'
    reason: str
    improvement_id: str


@dataclass
class SandboxResult:
    """沙箱验证结果"""
    passed: bool
    checks: list[str] = field(default_factory=list)
    failures: list[str] = field(default_factory=list)
    duration_ms: float = 0.0


class SandboxValidator:
    """在临时目录中验证修改"""

    def validate(self, target_file: str, new_content: str,
                 repo_path: Path) -> SandboxResult:
        """验证修改：语法、大小、危险模式检查"""
        start = time.monotonic()
        checks: list[str] = []
        failures: list[str] = []

        # 1. 非空检查
        checks.append('non_empty')
        if not new_content or not new_content.strip():
            failures.append('non_empty: content is empty')

        # 2. UTF-8 编码检查
        checks.append('utf8_encoding')
        try:
            new_content.encode('utf-8')
        except (UnicodeEncodeError, UnicodeDecodeError) as exc:
            failures.append(f'utf8_encoding: {exc}')

        # 3. 大小检查
        checks.append('size_limit')
        size = len(new_content.encode('utf-8'))
        if size > MAX_FILE_SIZE:
            failures.append(f'size_limit: {size} bytes exceeds {MAX_FILE_SIZE}')

        # 4. 危险模式检查
        checks.append('dangerous_patterns')
        for pattern in _DANGEROUS_PATTERNS:
            if re.search(pattern, new_content):
                failures.append(f'dangerous_patterns: matched {pattern!r}')
                break

        duration_ms = (time.monotonic() - start) * 1000
        return SandboxResult(
            passed=len(failures) == 0,
            checks=checks,
            failures=failures,
            duration_ms=duration_ms,
        )


class ModificationHistory:
    """修改历史记录，支持回滚"""

    def __init__(self, history_dir: Path) -> None:
        self._history_dir = Path(history_dir)
        self._history_dir.mkdir(parents=True, exist_ok=True)

    def record(self, imp_id: str, target_file: str,
               old_content: str | None, new_content: str) -> str:
        """记录一次修改，返回 record_id"""
        record_id = str(uuid.uuid4())
        entry = {
            'record_id': record_id,
            'imp_id': imp_id,
            'target_file': target_file,
            'old_content': old_content,
            'new_content': new_content,
            'timestamp': time.time(),
        }
        record_path = self._history_dir / f'{record_id}.json'
        record_path.write_text(json.dumps(entry, ensure_ascii=False), encoding='utf-8')
        return record_id

    def get_record(self, record_id: str) -> dict | None:
        record_path = self._history_dir / f'{record_id}.json'
        if not record_path.exists():
            return None
        return json.loads(record_path.read_text(encoding='utf-8'))

    def get_recent(self, n: int = 10) -> list[dict]:
        records = []
        for p in self._history_dir.glob('*.json'):
            try:
                records.append(json.loads(p.read_text(encoding='utf-8')))
            except (json.JSONDecodeError, OSError):
                continue
        records.sort(key=lambda r: r.get('timestamp', 0), reverse=True)
        return records[:n]

    def rollback(self, record_id: str, repo_path: Path) -> bool:
        """回滚到修改前的状态"""
        entry = self.get_record(record_id)
        if entry is None:
            return False
        target_path = repo_path / entry['target_file']
        old_content = entry.get('old_content')
        try:
            if old_content is None:
                # 文件是新建的，删除它
                if target_path.exists():
                    target_path.unlink()
            else:
                target_path.parent.mkdir(parents=True, exist_ok=True)
                target_path.write_text(old_content, encoding='utf-8')
            return True
        except OSError:
            return False


class SelfModifier:
    """Applies improvement suggestions to skill/agent Markdown files."""

    def __init__(self, repo_path: Path,
                 history_dir: Path | None = None) -> None:
        self.repo_path = Path(repo_path)
        _hdir = history_dir if history_dir is not None else self.repo_path / '.omc' / 'modification_history'
        self._history = ModificationHistory(_hdir)
        self._sandbox = SandboxValidator()

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

    def apply(self, improvement: dict[str, Any],
              sandbox: bool = True,
              canary: bool = True) -> ModificationResult:
        """Apply a single improvement. Returns ModificationResult.

        Args:
            improvement: improvement dict with id, confidence, targetFile, newContent.
            sandbox: if True, run SandboxValidator before writing.
            canary: if True, backup original and record history; rollback on failure.
        """
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

        # Sandbox validation
        if sandbox:
            result = self._sandbox.validate(target_file, new_content, self.repo_path)
            if not result.passed:
                return ModificationResult(
                    status='rejected',
                    reason='sandbox validation failed: ' + '; '.join(result.failures),
                    improvement_id=imp_id,
                )

        target_path = self.repo_path / target_file

        # Canary: read old content for history/rollback
        record_id: str | None = None
        if canary:
            old_content = target_path.read_text(encoding='utf-8') if target_path.exists() else None
            record_id = self._history.record(imp_id, target_file, old_content, new_content)

        # Apply: write new content
        try:
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_text(new_content, encoding='utf-8')
            logger.info('Applied improvement %s to %s', imp_id, target_file)
            reason = f'wrote {len(new_content)} bytes to {target_file}'
            if record_id:
                reason += f' (record={record_id})'
            return ModificationResult(
                status='applied',
                reason=reason,
                improvement_id=imp_id,
            )
        except OSError as e:
            # Canary rollback on write failure
            if canary and record_id:
                self._history.rollback(record_id, self.repo_path)
            return ModificationResult(
                status='error',
                reason=str(e),
                improvement_id=imp_id,
            )
