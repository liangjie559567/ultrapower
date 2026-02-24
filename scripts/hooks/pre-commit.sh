#!/usr/bin/env bash
# pre-commit.sh — Git pre-commit hook
# 从 Axiom guards/pre-commit 移植。执行提交前检查。

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
AXIOM_DIR="$REPO_ROOT/.omc/axiom"

# ── 1. 类型检查 ──────────────────────────────────────────────
if [ -f "$REPO_ROOT/tsconfig.json" ]; then
  echo "[pre-commit] Running tsc --noEmit..."
  cd "$REPO_ROOT"
  if ! npx tsc --noEmit 2>&1; then
    echo "[pre-commit] ❌ TypeScript errors found. Commit aborted."
    exit 1
  fi
  echo "[pre-commit] ✓ TypeScript OK"
fi

# ── 2. 检查 active_context.md 是否存在 ──────────────────────
if [ ! -f "$AXIOM_DIR/active_context.md" ]; then
  echo "[pre-commit] ⚠️  .omc/axiom/active_context.md not found (non-fatal)"
fi

# ── 3. 检查暂存文件中是否有调试残留 ────────────────────────
STAGED=$(git diff --cached --name-only --diff-filter=ACM)
if echo "$STAGED" | xargs grep -l "console\.log\|debugger\|TODO: REMOVE" 2>/dev/null | grep -q .; then
  echo "[pre-commit] ⚠️  Staged files contain debug statements (non-fatal)"
fi

echo "[pre-commit] ✓ Pre-commit checks passed"
exit 0
