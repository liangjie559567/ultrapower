#!/bin/bash
set -e

METRICS_DIR=".omc/metrics"
mkdir -p "$METRICS_DIR"

echo "📊 测量基线指标..."

# 1. 构建时间
echo "⏱️  构建时间..."
BUILD_START=$(date +%s)
npm run build > /dev/null 2>&1
BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))

# 2. 包大小
echo "📦 包大小..."
BUNDLE_SIZE=$(du -sh dist/ | cut -f1)
BUNDLE_BYTES=$(du -sb dist/ | cut -f1)

# 3. 循环依赖
echo "🔄 循环依赖..."
if command -v madge &> /dev/null; then
  CIRCULAR_COUNT=$(madge --circular --json src/ 2>/dev/null | jq 'length' 2>/dev/null || echo 0)
else
  echo "⚠️  madge 未安装，跳过循环依赖检测"
  CIRCULAR_COUNT=0
fi

# 4. 测试覆盖率
echo "🧪 测试覆盖率..."
if [ -f coverage/coverage-summary.json ]; then
  COVERAGE=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
else
  echo "⚠️  运行测试以生成覆盖率..."
  npm test -- --coverage --silent > /dev/null 2>&1 || true
  if [ -f coverage/coverage-summary.json ]; then
    COVERAGE=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
  else
    COVERAGE=0
  fi
fi

# 5. TypeScript 编译时间
echo "⚡ TypeScript 编译..."
TSC_START=$(date +%s)
tsc --noEmit 2>/dev/null || true
TSC_END=$(date +%s)
TSC_TIME=$((TSC_END - TSC_START))

# 6. 依赖分析
echo "📚 依赖分析..."
TOTAL_DEPS=$(jq '.dependencies | length' package.json)
DEV_DEPS=$(jq '.devDependencies | length' package.json)

# 7. Barrel exports 统计
echo "📂 Barrel exports..."
BARREL_COUNT=$(find src -name "index.ts" | wc -l)

# 生成报告
cat > "$METRICS_DIR/baseline.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "metrics": {
    "build_time_seconds": $BUILD_TIME,
    "bundle_size_human": "$BUNDLE_SIZE",
    "bundle_size_bytes": $BUNDLE_BYTES,
    "circular_dependencies": $CIRCULAR_COUNT,
    "test_coverage_percent": $COVERAGE,
    "tsc_time_seconds": $TSC_TIME,
    "total_dependencies": $TOTAL_DEPS,
    "dev_dependencies": $DEV_DEPS,
    "barrel_exports_count": $BARREL_COUNT
  }
}
EOF

echo "✅ 基线指标已保存到 $METRICS_DIR/baseline.json"
cat "$METRICS_DIR/baseline.json" | jq .
