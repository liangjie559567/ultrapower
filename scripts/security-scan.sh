#!/bin/bash
# T17: 依赖漏洞扫描

set -e

echo "🔍 Security Scan - Dependency Vulnerabilities"
echo "=============================================="

# npm audit
echo ""
echo "📦 Running npm audit..."
npm audit --audit-level=moderate || true

# Check for known vulnerable patterns
echo ""
echo "🔎 Checking for dangerous patterns..."
grep -r "__proto__" src/ && echo "⚠️  Found __proto__ usage" || echo "✅ No __proto__ usage"
grep -r "eval(" src/ && echo "⚠️  Found eval() usage" || echo "✅ No eval() usage"
grep -r "Function(" src/ && echo "⚠️  Found Function() constructor" || echo "✅ No Function() constructor"

echo ""
echo "✅ Security scan complete"
