#!/bin/bash
# 安装流程验证脚本

set -e

echo "=== ultrapower 安装流程验证 ==="
echo ""

# 1. 检查包信息
echo "1. 检查包配置..."
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")
echo "   包名: $PACKAGE_NAME"
echo "   版本: $PACKAGE_VERSION"

if [ "$PACKAGE_NAME" != "@liangjie559567/ultrapower" ]; then
    echo "   ❌ 错误: 包名不正确"
    exit 1
fi
echo "   ✅ 包名正确"
echo ""

# 2. 检查文档中的安装命令
echo "2. 检查文档中的安装命令..."

# 检查错误的 npm 命令
WRONG_NPM=$(grep -r "npm install -g ultrapower[^@]" --include="*.md" docs/ 2>/dev/null | grep -v "INSTALL_FIX" | wc -l)
if [ "$WRONG_NPM" -gt 0 ]; then
    echo "   ❌ 发现 $WRONG_NPM 处错误的 npm 命令"
    grep -rn "npm install -g ultrapower[^@]" --include="*.md" docs/ 2>/dev/null | grep -v "INSTALL_FIX"
    exit 1
fi
echo "   ✅ npm 命令正确"

# 检查错误的插件命令
WRONG_PLUGIN=$(grep -r "/plugin install ultrapower[^@]" --include="*.md" docs/ 2>/dev/null | grep -v "INSTALL_FIX" | wc -l)
if [ "$WRONG_PLUGIN" -gt 0 ]; then
    echo "   ❌ 发现 $WRONG_PLUGIN 处错误的插件命令"
    grep -rn "/plugin install ultrapower[^@]" --include="*.md" docs/ 2>/dev/null | grep -v "INSTALL_FIX"
    exit 1
fi
echo "   ✅ 插件命令正确"
echo ""

# 3. 检查关键文件
echo "3. 检查关键文件..."
FILES=(
    "README.md"
    "docs/INSTALL.md"
    ".claude-plugin/plugin.json"
    ".claude-plugin/marketplace.json"
)

for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "   ❌ 缺少文件: $file"
        exit 1
    fi
done
echo "   ✅ 所有关键文件存在"
echo ""

# 4. 验证插件配置
echo "4. 验证插件配置..."
PLUGIN_NAME=$(node -p "require('./.claude-plugin/plugin.json').name")
PLUGIN_VERSION=$(node -p "require('./.claude-plugin/plugin.json').version")

if [ "$PLUGIN_NAME" != "ultrapower" ]; then
    echo "   ❌ 插件名称错误: $PLUGIN_NAME"
    exit 1
fi

if [ "$PLUGIN_VERSION" != "$PACKAGE_VERSION" ]; then
    echo "   ❌ 版本不一致: plugin.json=$PLUGIN_VERSION, package.json=$PACKAGE_VERSION"
    exit 1
fi
echo "   ✅ 插件配置正确"
echo ""

echo "=== ✅ 所有验证通过 ==="
echo ""
echo "用户可以使用以下方式安装："
echo ""
echo "方式一（推荐）："
echo "  /plugin marketplace add https://github.com/liangjie559567/ultrapower"
echo "  /plugin install omc@ultrapower"
echo ""
echo "方式二："
echo "  npm install -g @liangjie559567/ultrapower"
