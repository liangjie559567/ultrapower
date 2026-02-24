#!/usr/bin/env bash
# post-commit.sh — Git post-commit hook
# 从 Axiom guards/post-commit 移植。提交后更新 Axiom 状态。

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
AXIOM_DIR="$REPO_ROOT/.omc/axiom"
ACTIVE_CONTEXT="$AXIOM_DIR/active_context.md"

COMMIT_SHA=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%s)
COMMIT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ── 更新 active_context.md 中的最后提交信息 ─────────────────
if [ -f "$ACTIVE_CONTEXT" ]; then
  # 替换或追加 Last Commit 行
  if grep -q "^Last Commit:" "$ACTIVE_CONTEXT"; then
    sed -i "s|^Last Commit:.*|Last Commit: $COMMIT_SHA — $COMMIT_MSG ($COMMIT_DATE)|" "$ACTIVE_CONTEXT"
  else
    echo "" >> "$ACTIVE_CONTEXT"
    echo "Last Commit: $COMMIT_SHA — $COMMIT_MSG ($COMMIT_DATE)" >> "$ACTIVE_CONTEXT"
  fi
fi

echo "[post-commit] ✓ Axiom context updated (commit: $COMMIT_SHA)"
exit 0
