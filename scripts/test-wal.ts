import { WriteAheadLog } from '../src/features/state-manager/wal';
import * as fs from 'fs';
import * as path from 'path';

const testDir = path.join(process.cwd(), '.test-wal-' + Date.now());

console.log('=== WAL 机制测试 ===\n');

// Test 1: 写入 WAL 条目
console.log('Test 1: 写入 WAL 条目');
const wal = new WriteAheadLog(testDir);
const id1 = wal.writeEntry('session', { active: true, iteration: 1 });
const id2 = wal.writeEntry('team', { phase: 'exec' });
console.log(`✓ 写入 2 个 WAL 条目: ${id1.substring(0, 8)}..., ${id2.substring(0, 8)}...`);

// Test 2: 提交并清理
console.log('\nTest 2: 提交并清理');
wal.commit(id1);
const uncommitted = wal.getUncommitted();
console.log(`✓ 未提交条目数: ${uncommitted.length} (预期: 1)`);

wal.cleanup();
const walDir = path.join(testDir, '.omc', 'state', 'wal');
const filesAfterCleanup = fs.readdirSync(walDir);
console.log(`✓ 清理后 WAL 文件数: ${filesAfterCleanup.length} (预期: 1)`);

// Test 3: 崩溃恢复
console.log('\nTest 3: 崩溃恢复');
const wal2 = new WriteAheadLog(testDir);
const recovered = wal2.recover();
console.log(`✓ 恢复未提交条目数: ${recovered.length} (预期: 1)`);
console.log(`✓ 恢复的数据: ${JSON.stringify(recovered[0].data)}`);

// Test 4: 性能测试
console.log('\nTest 4: 性能测试');
const start = Date.now();
for (let i = 0; i < 100; i++) {
  const id = wal2.writeEntry('test', { index: i });
  wal2.commit(id);
}
const elapsed = Date.now() - start;
const avgTime = elapsed / 100;
console.log(`✓ 100 次写入+提交耗时: ${elapsed}ms`);
console.log(`✓ 平均每次: ${avgTime.toFixed(2)}ms (目标: <5ms)`);

// 清理测试目录
fs.rmSync(testDir, { recursive: true, force: true });
console.log('\n✓ 测试完成，清理测试目录');
