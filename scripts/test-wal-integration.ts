import { writeState, readState, cleanupWAL, StateLocation } from '../src/features/state-manager/index';
import * as fs from 'fs';
import * as path from 'path';

const testDir = path.join(process.cwd(), '.test-wal-integration-' + Date.now());
fs.mkdirSync(testDir, { recursive: true });
process.chdir(testDir);

console.log('=== WAL 集成测试 ===\n');

// Test 1: 正常写入流程
console.log('Test 1: 正常写入流程');
const result1 = writeState('ralph', { active: true, iteration: 1 }, StateLocation.LOCAL);
console.log(`✓ 写入状态: ${result1.success}`);

const read1 = readState('ralph', StateLocation.LOCAL);
console.log(`✓ 读取状态: ${JSON.stringify(read1.data)}`);

// Test 2: WAL 清理
console.log('\nTest 2: WAL 清理');
cleanupWAL();
const walDir = path.join(testDir, '.omc', 'state', 'wal');
const walFiles = fs.existsSync(walDir) ? fs.readdirSync(walDir).filter(f => f.endsWith('.wal')) : [];
console.log(`✓ 清理后 WAL 文件数: ${walFiles.length} (预期: 0)`);

// 清理
process.chdir('..');
fs.rmSync(testDir, { recursive: true, force: true });
console.log('\n✓ 集成测试完成');
