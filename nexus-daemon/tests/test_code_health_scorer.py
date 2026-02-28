from __future__ import annotations

import pytest
from pathlib import Path
from code_health_scorer import CodeHealthScorer, FileHealthScore, ProjectHealthReport


@pytest.fixture
def scorer():
    return CodeHealthScorer()


# ---------------------------------------------------------------------------
# 行计数
# ---------------------------------------------------------------------------

def test_count_lines_empty_file(scorer):
    loc, blank, comments = scorer._count_lines("")
    assert loc == 0
    assert blank == 0
    assert comments == 0


def test_count_lines_pure_comments(scorer):
    content = "# comment one\n# comment two\n# comment three\n"
    loc, blank, comments = scorer._count_lines(content)
    assert loc == 0
    assert comments == 3
    assert blank == 0


def test_count_lines_mixed_content(scorer):
    content = (
        "# header\n"
        "\n"
        "def foo():\n"
        "    pass\n"
        "\n"
        "# trailing\n"
    )
    loc, blank, comments = scorer._count_lines(content)
    assert loc == 2        # def foo(): and pass
    assert blank == 2
    assert comments == 2


# ---------------------------------------------------------------------------
# 定义计数
# ---------------------------------------------------------------------------

def test_count_definitions_functions_and_classes(scorer):
    content = (
        "class Foo:\n"
        "    def method(self): pass\n"
        "\n"
        "def standalone(): pass\n"
        "class Bar: pass\n"
    )
    functions, classes = scorer._count_definitions(content)
    assert functions == 2
    assert classes == 2


def test_count_definitions_nested(scorer):
    content = (
        "class Outer:\n"
        "    class Inner:\n"
        "        def inner_method(self): pass\n"
        "    def outer_method(self): pass\n"
        "def top_level(): pass\n"
    )
    functions, classes = scorer._count_definitions(content)
    assert functions == 3
    assert classes == 2


# ---------------------------------------------------------------------------
# 缩进深度
# ---------------------------------------------------------------------------

def test_max_indent_depth_simple(scorer):
    content = "def foo():\n    pass\n"
    depth = scorer._max_indent_depth(content)
    assert depth == 1


def test_max_indent_depth_deep_nesting(scorer):
    content = (
        "def a():\n"
        "    if True:\n"
        "        for x in y:\n"
        "            while z:\n"
        "                if w:\n"
        "                    pass\n"
    )
    depth = scorer._max_indent_depth(content)
    assert depth == 5


# ---------------------------------------------------------------------------
# score_content
# ---------------------------------------------------------------------------

def test_score_content_simple_healthy_file_gets_high_score(scorer):
    content = (
        "# Simple module\n"
        "\n"
        "def add(a, b):\n"
        "    # add two numbers\n"
        "    return a + b\n"
        "\n"
        "def subtract(a, b):\n"
        "    # subtract\n"
        "    return a - b\n"
    )
    result = scorer.score_content(content)
    assert isinstance(result, FileHealthScore)
    assert result.maintainability_score >= 60.0


def test_score_content_complex_file_gets_lower_score(scorer):
    # 生成超过 500 行、深度嵌套的内容
    lines = ["def func_{}():\n".format(i) for i in range(25)]
    for _ in range(500):
        lines.append("    " * 7 + "x = 1\n")
    content = "".join(lines)
    result = scorer.score_content(content)
    assert result.maintainability_score < 70.0
    assert result.complexity_score < 70.0


def test_score_content_empty_string(scorer):
    result = scorer.score_content("")
    assert result.lines_of_code == 0
    assert result.function_count == 0
    assert result.maintainability_score >= 0.0


def test_score_content_detects_issues(scorer):
    # 超过 max_file_lines=500 的文件
    content = "\n".join(["x = {}".format(i) for i in range(600)])
    result = scorer.score_content(content)
    assert any("too long" in issue.lower() or "LOC" in issue for issue in result.issues)


# ---------------------------------------------------------------------------
# score_file
# ---------------------------------------------------------------------------

def test_score_file_real_file(scorer, tmp_path):
    f = tmp_path / "sample.py"
    f.write_text("def hello():\n    return 'world'\n", encoding='utf-8')
    result = scorer.score_file(f)
    assert result.file_path == str(f)
    assert result.function_count == 1
    assert result.lines_of_code == 2


def test_score_file_nonexistent_raises(scorer, tmp_path):
    with pytest.raises(FileNotFoundError):
        scorer.score_file(tmp_path / "does_not_exist.py")


# ---------------------------------------------------------------------------
# score_directory
# ---------------------------------------------------------------------------

def test_score_directory_multiple_files(scorer, tmp_path):
    (tmp_path / "a.py").write_text("def a(): pass\n", encoding='utf-8')
    (tmp_path / "b.py").write_text("def b(): pass\ndef c(): pass\n", encoding='utf-8')
    report = scorer.score_directory(tmp_path)
    assert isinstance(report, ProjectHealthReport)
    assert len(report.files) == 2
    assert report.total_functions == 3


def test_score_directory_empty(scorer, tmp_path):
    report = scorer.score_directory(tmp_path)
    assert report.total_lines == 0
    assert report.average_maintainability == 0.0
    assert "No Python files found" in report.summary


# ---------------------------------------------------------------------------
# ProjectHealthReport
# ---------------------------------------------------------------------------

def test_worst_files_sorted_ascending(scorer, tmp_path):
    # 创建一个健康文件和一个问题文件
    good = tmp_path / "good.py"
    good.write_text(
        "# Good module\n\ndef simple():\n    return 1\n",
        encoding='utf-8',
    )
    bad_lines = "\n".join(["x = {}".format(i) for i in range(600)])
    bad = tmp_path / "bad.py"
    bad.write_text(bad_lines, encoding='utf-8')

    report = scorer.score_directory(tmp_path)
    assert len(report.worst_files) >= 1
    # worst_files 按分数升序排列（最差在前）
    scores = [s for _, s in report.worst_files]
    assert scores == sorted(scores)


def test_average_maintainability_calculation(scorer, tmp_path):
    (tmp_path / "a.py").write_text("def a(): pass\n", encoding='utf-8')
    (tmp_path / "b.py").write_text("def b(): pass\n", encoding='utf-8')
    report = scorer.score_directory(tmp_path)
    expected = sum(f.maintainability_score for f in report.files) / len(report.files)
    assert abs(report.average_maintainability - expected) < 0.01


def test_summary_contains_file_count_and_loc(scorer, tmp_path):
    (tmp_path / "x.py").write_text("a = 1\nb = 2\n", encoding='utf-8')
    report = scorer.score_directory(tmp_path)
    assert "1 file" in report.summary
    assert "LOC" in report.summary
