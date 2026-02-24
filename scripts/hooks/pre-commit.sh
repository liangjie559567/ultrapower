#!/usr/bin/env bash
# pre-commit.sh — Git pre-commit hook
# 从 Axiom guards/pre-commit 移植。执行提交前检查。

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
AXIOM_DIR="$REPO_ROOT/.omc/axiom"
ACTIVE_CONTEXT="$AXIOM_DIR/active_context.md"

# ── 1. 检查 merge conflict 标记（阻塞，对齐 Python 源码）────
STAGED=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)
if [ -n "$STAGED" ]; then
  CONFLICT_FILES=$(echo "$STAGED" | xargs grep -l "^<<<<<<< \|^=======$\|^>>>>>>> " 2>/dev/null || true)
  if [ -n "$CONFLICT_FILES" ]; then
    echo "[pre-commit] ❌ Merge conflict markers found in staged files:"
    echo "$CONFLICT_FILES"
    echo "[pre-commit] Resolve conflicts before committing."
    exit 1
  fi
fi

# ── 2. 检查 active_context.md 是否在本次提交中被更新（警告，对齐 Python 源码）──
if [ -f "$ACTIVE_CONTEXT" ]; then
  if ! echo "$STAGED" | grep -q "\.omc/axiom/active_context\.md"; then
    echo "[pre-commit] ⚠️  active_context.md was not updated in this commit (non-fatal)"
  fi
else
  echo "[pre-commit] ⚠️  .omc/axiom/active_context.md not found (non-fatal)"
fi

# ── 3. 类型检查 ──────────────────────────────────────────────
if [ -f "$REPO_ROOT/tsconfig.json" ]; then
  echo "[pre-commit] Running tsc --noEmit..."
  cd "$REPO_ROOT"
  if ! npx tsc --noEmit 2>&1; then
    echo "[pre-commit] ❌ TypeScript errors found. Commit aborted."
    exit 1
  fi
  echo "[pre-commit] ✓ TypeScript OK"
fi

# ── 4. 检查暂存文件中是否有调试残留 ────────────────────────
if [ -n "$STAGED" ]; then
  if echo "$STAGED" | xargs grep -l "console\.log\|debugger\|TODO: REMOVE" 2>/dev/null | grep -q .; then
    echo "[pre-commit] ⚠️  Staged files contain debug statements (non-fatal)"
  fi
fi

echo "[pre-commit] ✓ Pre-commit checks passed"
exit 0
