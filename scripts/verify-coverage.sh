#!/bin/bash
# verify-coverage.sh - 本地验证 CI 覆盖率流程

set -e

echo "=== Step 1: Build ==="
npm run build

echo -e "\n=== Step 2: Unit tests ==="
npm test -- --coverage --run

echo -e "\n=== Step 3: E2E tests ==="
npm run test:e2e

echo -e "\n=== Step 4: Check bridge.ts coverage ==="
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
const bridge = Object.keys(data).find(k => k.includes('hooks') && k.includes('bridge.ts') && !k.includes('normalize'));
const cov = data[bridge];
console.log('bridge.ts coverage:');
console.log('  Lines:', cov.lines.pct + '%', '(' + cov.lines.covered + '/' + cov.lines.total + ')');
console.log('  Statements:', cov.statements.pct + '%');
console.log('  Branches:', cov.branches.pct + '%');
if (cov.lines.pct >= 75) {
  console.log('✓ Coverage meets 75% threshold');
} else {
  console.log('✗ Coverage below 75% threshold');
  process.exit(1);
}
"

echo -e "\n=== Verification complete ==="
