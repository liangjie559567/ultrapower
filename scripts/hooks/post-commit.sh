#!/usr/bin/env bash
# post-commit.sh — Git post-commit hook
# 从 Axiom guards/post-commit 移植。提交后更新 Axiom 状态并创建 checkpoint tag。

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
AXIOM_DIR="$REPO_ROOT/.omc/axiom"
ACTIVE_CONTEXT="$AXIOM_DIR/active_context.md"

COMMIT_SHA=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%s)
COMMIT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ── 更新 active_context.md 中的最后提交信息 ─────────────────
if [ -f "$ACTIVE_CONTEXT" ]; then
  if grep -q "^Last Commit:" "$ACTIVE_CONTEXT"; then
    sed -i "s|^Last Commit:.*|Last Commit: $COMMIT_SHA — $COMMIT_MSG ($COMMIT_DATE)|" "$ACTIVE_CONTEXT"
  else
    echo "" >> "$ACTIVE_CONTEXT"
    echo "Last Commit: $COMMIT_SHA — $COMMIT_MSG ($COMMIT_DATE)" >> "$ACTIVE_CONTEXT"
  fi
fi

# ── 创建 checkpoint tag（对齐 Python post-commit：距上次 tag > 30 分钟时触发）──
CHECKPOINT_INTERVAL=1800  # 30 分钟（秒）
NOW=$(date +%s)

# 获取最近一个 checkpoint tag 的时间
LAST_TAG=$(git tag --list "checkpoint-*" --sort=-version:refname | head -1)
if [ -n "$LAST_TAG" ]; then
  LAST_TAG_DATE=$(git log -1 --format="%ct" "$LAST_TAG" 2>/dev/null || echo 0)
else
  LAST_TAG_DATE=0
fi

ELAPSED=$(( NOW - LAST_TAG_DATE ))
if [ "$ELAPSED" -ge "$CHECKPOINT_INTERVAL" ]; then
  TAG_NAME="checkpoint-$(date -u +"%Y%m%d-%H%M%S")"
  git tag "$TAG_NAME" 2>/dev/null && \
    echo "[post-commit] ✓ Checkpoint tag created: $TAG_NAME" || \
    echo "[post-commit] ⚠️  Failed to create checkpoint tag (non-fatal)"
fi

echo "[post-commit] ✓ Axiom context updated (commit: $COMMIT_SHA)"
exit 0
