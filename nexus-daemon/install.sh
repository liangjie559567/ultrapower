#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Error: this script must be run as root." >&2
  exit 1
fi

INSTALL_DIR=/opt/nexus-daemon
SERVICE_FILE=/etc/systemd/system/nexus-daemon.service

echo "Installing nexus-daemon..."

# Create user
id nexus &>/dev/null || useradd -r -s /bin/false nexus

# Copy files
mkdir -p "$INSTALL_DIR"
cp daemon.py evolution_engine.py consciousness_loop.py self_evaluator.py self_modifier.py telegram_bot.py requirements.txt nexus-daemon.service "$INSTALL_DIR/"
chown -R nexus:nexus "$INSTALL_DIR"

# Create virtualenv and install deps
[[ -f requirements.txt ]] || { echo "Error: requirements.txt not found" >&2; exit 1; }
python3 -m venv "$INSTALL_DIR/venv"
"$INSTALL_DIR/venv/bin/pip" install -r "$INSTALL_DIR/requirements.txt"

# Install systemd service
cp nexus-daemon.service "$SERVICE_FILE"
systemctl daemon-reload
systemctl enable nexus-daemon
systemctl start nexus-daemon
sleep 2
systemctl is-active --quiet nexus-daemon || { echo "Warning: service may have failed to start. Check: journalctl -u nexus-daemon" >&2; }

echo "nexus-daemon installed and started."
echo "Check status: systemctl status nexus-daemon"
