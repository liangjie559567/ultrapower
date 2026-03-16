#!/bin/bash
# Complete upgrade script for ultrapower
# Updates all components: npm package, plugin cache, MCP config, hooks

set -e

echo "🚀 Starting complete ultrapower upgrade..."

# Step 1: Update npm global package
echo "📦 Step 1/5: Updating npm global package..."
npm install -g @liangjie559567/ultrapower@latest

# Step 2: Clear plugin cache
echo "🗑️  Step 2/5: Clearing plugin cache..."
rm -rf ~/.claude/plugins/cache/omc/ultrapower

# Step 3: Run omc setup to sync hooks and CLAUDE.md
echo "⚙️  Step 3/5: Running omc setup..."
omc setup

# Step 4: Clear update check cache
echo "🔄 Step 4/5: Clearing update check cache..."
rm -f ~/.omc/update-check-cache.json

# Step 5: Verify installation
echo "✅ Step 5/5: Verifying installation..."
INSTALLED_VERSION=$(omc --version 2>&1 | grep -oP '\d+\.\d+\.\d+' | head -1)
echo "Installed version: $INSTALLED_VERSION"

echo ""
echo "✨ Upgrade complete!"
echo ""
echo "⚠️  IMPORTANT: Please restart your Claude Code session to load the new plugin version."
echo ""
