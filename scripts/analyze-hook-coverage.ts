import * as fs from 'fs';
import * as path from 'path';

const hooksDir = path.join(process.cwd(), 'src', 'hooks');

interface HookInfo {
  name: string;
  hasTests: boolean;
  testCount: number;
  hasIndex: boolean;
}

const hooks: HookInfo[] = [];

// 扫描所有 hook 目录
const dirs = fs.readdirSync(hooksDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== '__tests__');

for (const dir of dirs) {
  const hookPath = path.join(hooksDir, dir.name);
  const testPath = path.join(hookPath, '__tests__');
  const indexPath = path.join(hookPath, 'index.ts');

  let testCount = 0;
  if (fs.existsSync(testPath)) {
    const testFiles = fs.readdirSync(testPath).filter(f => f.endsWith('.test.ts'));
    testCount = testFiles.length;
  }

  hooks.push({
    name: dir.name,
    hasTests: fs.existsSync(testPath),
    testCount,
    hasIndex: fs.existsSync(indexPath),
  });
}

// 统计
const withTests = hooks.filter(h => h.hasTests);
const withoutTests = hooks.filter(h => !h.hasTests);
const totalTests = hooks.reduce((sum, h) => sum + h.testCount, 0);

console.log('=== Hook 测试覆盖分析 ===\n');
console.log(`总 Hook 数: ${hooks.length}`);
console.log(`有测试的 Hook: ${withTests.length} (${(withTests.length / hooks.length * 100).toFixed(1)}%)`);
console.log(`无测试的 Hook: ${withoutTests.length}`);
console.log(`总测试文件数: ${totalTests}\n`);

console.log('无测试的 Hook:');
withoutTests.forEach(h => console.log(`  - ${h.name}`));

console.log('\n测试文件数 < 3 的 Hook:');
withTests.filter(h => h.testCount < 3).forEach(h =>
  console.log(`  - ${h.name} (${h.testCount} 个测试)`)
);
