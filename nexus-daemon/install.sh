#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR=/opt/nexus-daemon
SERVICE_FILE=/etc/systemd/system/nexus-daemon.service

echo "Installing nexus-daemon..."

# Create user
id nexus &>/dev/null || useradd -r -s /bin/false nexus

# Copy files
mkdir -p "$INSTALL_DIR"
cp -r . "$INSTALL_DIR/"
chown -R nexus:nexus "$INSTALL_DIR"

# Create virtualenv and install deps
python3 -m venv "$INSTALL_DIR/venv"
"$INSTALL_DIR/venv/bin/pip" install -r "$INSTALL_DIR/requirements.txt"

# Install systemd service
cp nexus-daemon.service "$SERVICE_FILE"
systemctl daemon-reload
systemctl enable nexus-daemon
systemctl start nexus-daemon

echo "nexus-daemon installed and started."
echo "Check status: systemctl status nexus-daemon"
