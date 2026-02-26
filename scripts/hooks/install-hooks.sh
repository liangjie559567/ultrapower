#!/usr/bin/env bash
# install-hooks.sh — 安装/卸载 Git hooks 到 .git/hooks/
# 从 Axiom guards/install_hooks.py 移植。
# 用法：
#   ./install-hooks.sh           # 安装
#   ./install-hooks.sh --uninstall  # 卸载

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_SRC="$REPO_ROOT/scripts/hooks"
HOOKS_DEST="$REPO_ROOT/.git/hooks"
BACKUP_SUFFIX=".bak.axiom"
UNINSTALL=false

# 解析参数
for arg in "$@"; do
  case "$arg" in
    --uninstall) UNINSTALL=true ;;
    *) echo "[install-hooks] Unknown argument: $arg"; exit 1 ;;
  esac
done

install_hook() {
  local name="$1"
  local src="$HOOKS_SRC/${name}.sh"
  local dest="$HOOKS_DEST/$name"

  if [ ! -f "$src" ]; then
    echo "[install-hooks] ⚠️  $src not found, skipping"
    return
  fi

  # 备份已有 hook（对齐 Python install_hooks.py 的 .bak.axiom 后缀）
  if [ -f "$dest" ] && [ ! -f "${dest}${BACKUP_SUFFIX}" ]; then
    cp "$dest" "${dest}${BACKUP_SUFFIX}"
    echo "[install-hooks] ↩  Backed up existing $name to ${name}${BACKUP_SUFFIX}"
  fi

  cp "$src" "$dest"
  chmod +x "$dest"
  echo "[install-hooks] ✓ Installed $name"
}

uninstall_hook() {
  local name="$1"
  local dest="$HOOKS_DEST/$name"
  local backup="${dest}${BACKUP_SUFFIX}"

  if [ ! -f "$dest" ]; then
    echo "[install-hooks] ⚠️  $name not installed, skipping"
    return
  fi

  rm "$dest"
  echo "[install-hooks] ✗ Removed $name"

  # 恢复备份（对齐 Python --uninstall 行为）
  if [ -f "$backup" ]; then
    mv "$backup" "$dest"
    echo "[install-hooks] ↩  Restored backup for $name"
  fi
}

if [ "$UNINSTALL" = true ]; then
  echo "[install-hooks] Uninstalling Axiom Git hooks..."
  uninstall_hook "pre-commit"
  uninstall_hook "post-commit"
  echo "[install-hooks] ✓ Uninstall complete"
else
  echo "[install-hooks] Installing Axiom Git hooks..."
  install_hook "pre-commit"
  install_hook "post-commit"
  echo "[install-hooks] ✓ All hooks installed to $HOOKS_DEST"
fi
