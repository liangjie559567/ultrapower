from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class FileHealthScore:
    """单个文件的健康评分"""
    file_path: str
    lines_of_code: int
    blank_lines: int
    comment_lines: int
    function_count: int
    class_count: int
    max_indent_depth: int
    avg_line_length: float
    long_lines: int
    complexity_score: float
    maintainability_score: float
    issues: list[str] = field(default_factory=list)


@dataclass
class ProjectHealthReport:
    """项目级健康报告"""
    files: list[FileHealthScore]
    total_lines: int
    total_functions: int
    total_classes: int
    average_maintainability: float
    worst_files: list[tuple[str, float]]
    summary: str


class CodeHealthScorer:
    """代码健康评分器"""

    def __init__(self, thresholds: dict | None = None):
        self._thresholds = thresholds or {
            'max_file_lines': 500,
            'max_function_count': 20,
            'max_indent_depth': 6,
            'max_line_length': 120,
            'min_maintainability': 40.0,
        }

    def score_file(self, file_path: Path) -> FileHealthScore:
        """评估单个 Python 文件"""
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        content = file_path.read_text(encoding='utf-8', errors='replace')
        return self.score_content(content, str(file_path))

    def score_content(self, content: str, file_path: str = "<string>") -> FileHealthScore:
        """评估字符串内容（用于测试）"""
        loc, blank, comments = self._count_lines(content)
        functions, classes = self._count_definitions(content)
        max_depth = self._max_indent_depth(content)

        lines = content.splitlines()
        non_empty = [ln for ln in lines if ln.strip()]
        avg_len = sum(len(ln) for ln in non_empty) / len(non_empty) if non_empty else 0.0
        long_lines = sum(1 for ln in lines if len(ln) > self._thresholds['max_line_length'])

        total = loc + blank + comments
        comment_ratio = comments / total if total > 0 else 0.0

        complexity = self._compute_complexity(loc, functions, max_depth)
        maintainability = self._compute_maintainability(loc, comment_ratio, complexity, avg_len)

        score = FileHealthScore(
            file_path=file_path,
            lines_of_code=loc,
            blank_lines=blank,
            comment_lines=comments,
            function_count=functions,
            class_count=classes,
            max_indent_depth=max_depth,
            avg_line_length=round(avg_len, 2),
            long_lines=long_lines,
            complexity_score=round(complexity, 2),
            maintainability_score=round(maintainability, 2),
            issues=[],
        )
        score.issues = self._detect_issues(score)
        return score

    def score_directory(self, directory: Path, pattern: str = "*.py") -> ProjectHealthReport:
        """评估整个目录"""
        directory = Path(directory)
        py_files = list(directory.rglob(pattern))
        scores: list[FileHealthScore] = []
        for f in py_files:
            try:
                scores.append(self.score_file(f))
            except Exception:
                pass

        total_lines = sum(s.lines_of_code for s in scores)
        total_functions = sum(s.function_count for s in scores)
        total_classes = sum(s.class_count for s in scores)
        avg_maint = (
            sum(s.maintainability_score for s in scores) / len(scores)
            if scores else 0.0
        )

        sorted_by_score = sorted(scores, key=lambda s: s.maintainability_score)
        worst_files = [(s.file_path, s.maintainability_score) for s in sorted_by_score[:5]]

        if not scores:
            summary = "No Python files found."
        else:
            summary = (
                f"Analyzed {len(scores)} file(s). "
                f"Average maintainability: {avg_maint:.1f}/100. "
                f"Total LOC: {total_lines}."
            )

        return ProjectHealthReport(
            files=scores,
            total_lines=total_lines,
            total_functions=total_functions,
            total_classes=total_classes,
            average_maintainability=round(avg_maint, 2),
            worst_files=worst_files,
            summary=summary,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _count_lines(self, content: str) -> tuple[int, int, int]:
        """返回 (code_lines, blank_lines, comment_lines)"""
        loc = blank = comments = 0
        for line in content.splitlines():
            stripped = line.strip()
            if not stripped:
                blank += 1
            elif stripped.startswith('#'):
                comments += 1
            else:
                loc += 1
        return loc, blank, comments

    def _count_definitions(self, content: str) -> tuple[int, int]:
        """返回 (function_count, class_count)"""
        functions = len(re.findall(r'^\s*(?:async\s+)?def\s+\w+', content, re.MULTILINE))
        classes = len(re.findall(r'^\s*class\s+\w+', content, re.MULTILINE))
        return functions, classes

    def _max_indent_depth(self, content: str) -> int:
        """计算最大缩进深度（以 4 空格为一级）"""
        max_depth = 0
        for line in content.splitlines():
            if not line.strip():
                continue
            spaces = len(line) - len(line.lstrip(' '))
            depth = spaces // 4
            if depth > max_depth:
                max_depth = depth
        return max_depth

    def _compute_complexity(self, loc: int, functions: int, max_depth: int) -> float:
        """计算复杂度评分 0-100（100=最简单）"""
        score = 100.0

        # 行数惩罚
        if loc > 500:
            score -= 20
        elif loc > 300:
            score -= 10

        # 缩进深度惩罚
        if max_depth > 6:
            score -= 20
        elif max_depth > 4:
            score -= 10

        # 函数密度惩罚
        if functions > 20:
            score -= 15
        elif functions > 10:
            score -= 5

        return max(0.0, score)

    def _compute_maintainability(
        self,
        loc: int,
        comment_ratio: float,
        complexity: float,
        avg_line_len: float,
    ) -> float:
        """计算可维护性评分 0-100"""
        # 复杂度分量 (40%)
        complexity_component = complexity * 0.4

        # 注释比分量 (20%)：10-30% 最优
        if 0.10 <= comment_ratio <= 0.30:
            comment_score = 100.0
        elif comment_ratio < 0.10:
            comment_score = comment_ratio / 0.10 * 100.0
        else:
            comment_score = max(0.0, 100.0 - (comment_ratio - 0.30) / 0.70 * 100.0)
        comment_component = comment_score * 0.2

        # 行长度分量 (20%)：平均行长 < 80 最优
        if avg_line_len <= 80:
            line_len_score = 100.0
        else:
            line_len_score = max(0.0, 100.0 - (avg_line_len - 80) / 80 * 100.0)
        line_len_component = line_len_score * 0.2

        # 文件大小分量 (20%)：< 200 行最优
        if loc <= 200:
            size_score = 100.0
        elif loc <= 500:
            size_score = 100.0 - (loc - 200) / 300 * 60.0
        else:
            size_score = max(0.0, 40.0 - (loc - 500) / 500 * 40.0)
        size_component = size_score * 0.2

        total = complexity_component + comment_component + line_len_component + size_component
        return max(0.0, min(100.0, total))

    def _detect_issues(self, score: FileHealthScore) -> list[str]:
        """检测代码问题"""
        issues: list[str] = []
        t = self._thresholds

        if score.lines_of_code > t['max_file_lines']:
            issues.append(
                f"File too long: {score.lines_of_code} LOC (max {t['max_file_lines']})"
            )
        if score.function_count > t['max_function_count']:
            issues.append(
                f"Too many functions: {score.function_count} (max {t['max_function_count']})"
            )
        if score.max_indent_depth > t['max_indent_depth']:
            issues.append(
                f"Deep nesting: indent depth {score.max_indent_depth} (max {t['max_indent_depth']})"
            )
        if score.long_lines > 0:
            issues.append(
                f"{score.long_lines} line(s) exceed {t['max_line_length']} characters"
            )
        if score.maintainability_score < t['min_maintainability']:
            issues.append(
                f"Low maintainability: {score.maintainability_score:.1f} "
                f"(min {t['min_maintainability']})"
            )
        return issues
