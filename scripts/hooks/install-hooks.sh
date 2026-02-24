#!/usr/bin/env bash
# install-hooks.sh — 安装 Git hooks 到 .git/hooks/
# 从 Axiom guards/install_hooks.py 移植。

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_SRC="$REPO_ROOT/scripts/hooks"
HOOKS_DEST="$REPO_ROOT/.git/hooks"

install_hook() {
  local name="$1"
  local src="$HOOKS_SRC/${name}.sh"
  local dest="$HOOKS_DEST/$name"

  if [ ! -f "$src" ]; then
    echo "[install-hooks] ⚠️  $src not found, skipping"
    return
  fi

  cp "$src" "$dest"
  chmod +x "$dest"
  echo "[install-hooks] ✓ Installed $name"
}

echo "[install-hooks] Installing Axiom Git hooks..."
install_hook "pre-commit"
install_hook "post-commit"
echo "[install-hooks] ✓ All hooks installed to $HOOKS_DEST"
