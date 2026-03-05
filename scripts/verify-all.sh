#!/bin/bash
# verify-all.sh - 完整验证脚本

set -e

echo "=== ultrapower v5.5.14 完整验证 ==="
echo ""

# 1. 版本检查
echo "1. 检查版本..."
VERSION=$(grep '"version"' package.json | head -1 | cut -d'"' -f4)
echo "   package.json: $VERSION"
if [[ "$VERSION" != "5.5.14" ]]; then
  echo "   ❌ 版本不匹配"
  exit 1
fi
echo "   ✓ 版本正确"
echo ""

# 2. 构建验证
echo "2. 验证构建..."
if [[ ! -d "dist" ]]; then
  echo "   ❌ dist/ 目录不存在"
  exit 1
fi
echo "   ✓ dist/ 存在"

if [[ ! -f "dist/index.js" ]]; then
  echo "   ❌ dist/index.js 缺失"
  exit 1
fi
echo "   ✓ dist/index.js 存在"
echo ""

# 3. plugin.json 验证
echo "3. 验证 plugin.json..."
if [[ ! -f ".claude-plugin/plugin.json" ]]; then
  echo "   ❌ plugin.json 缺失"
  exit 1
fi

# 检查是否包含 hooks 或 agents 字段
if grep -q '"hooks"' .claude-plugin/plugin.json; then
  echo "   ❌ plugin.json 包含 hooks 字段（应移除）"
  exit 1
fi

if grep -q '"agents"' .claude-plugin/plugin.json; then
  echo "   ❌ plugin.json 包含 agents 字段（应移除）"
  exit 1
fi
echo "   ✓ plugin.json 格式正确"
echo ""

# 4. 组件数量验证
echo "4. 验证组件数量..."
AGENT_COUNT=$(ls agents/*.md 2>/dev/null | wc -l)
echo "   Agents: $AGENT_COUNT"
if [[ $AGENT_COUNT -lt 50 ]]; then
  echo "   ❌ Agent 数量不足"
  exit 1
fi

SKILL_COUNT=$(ls -d skills/*/ 2>/dev/null | wc -l)
echo "   Skills: $SKILL_COUNT"
if [[ $SKILL_COUNT -lt 70 ]]; then
  echo "   ❌ Skill 数量不足"
  exit 1
fi
echo "   ✓ 组件数量正确"
echo ""

# 5. hooks.json 验证
echo "5. 验证 hooks.json..."
if [[ ! -f "hooks/hooks.json" ]]; then
  echo "   ❌ hooks/hooks.json 缺失"
  exit 1
fi

HOOK_TYPES=$(grep -o '"[A-Z][a-zA-Z]*":' hooks/hooks.json | wc -l)
echo "   Hook 事件类型: $HOOK_TYPES"
if [[ $HOOK_TYPES -lt 10 ]]; then
  echo "   ❌ Hook 类型不足"
  exit 1
fi
echo "   ✓ hooks.json 正确"
echo ""

# 6. templates/hooks/ 验证
echo "6. 验证 templates/hooks/..."
if [[ ! -d "templates/hooks" ]]; then
  echo "   ❌ templates/hooks/ 目录缺失"
  exit 1
fi

HOOK_FILES=$(ls templates/hooks/*.mjs 2>/dev/null | wc -l)
echo "   Hook 文件: $HOOK_FILES"
if [[ $HOOK_FILES -lt 10 ]]; then
  echo "   ❌ Hook 文件不足"
  exit 1
fi
echo "   ✓ templates/hooks/ 完整"
echo ""

# 7. npm pack 验证
echo "7. 验证 npm pack..."
PACK_OUTPUT=$(npm pack --dry-run 2>&1)
TOTAL_FILES=$(echo "$PACK_OUTPUT" | grep "total files:" | grep -o '[0-9]*')
echo "   打包文件数: $TOTAL_FILES"
if [[ $TOTAL_FILES -lt 3000 ]]; then
  echo "   ❌ 打包文件数不足"
  exit 1
fi

echo "$PACK_OUTPUT" | grep -q ".claude-plugin/plugin.json" || { echo "   ❌ plugin.json 未打包"; exit 1; }
echo "$PACK_OUTPUT" | grep -q "templates/hooks" || { echo "   ❌ templates/hooks 未打包"; exit 1; }
echo "$PACK_OUTPUT" | grep -q "hooks/hooks.json" || { echo "   ❌ hooks.json 未打包"; exit 1; }
echo "   ✓ npm pack 正确"
echo ""

echo "=== 所有验证通过 ✓ ==="
echo "可以安全发布 v$VERSION"
