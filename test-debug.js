import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const testDir = join(tmpdir(), 'storage-test-debug');
const MESSAGE_STORAGE = join(testDir, 'claude-code', 'storage', 'message');
const sessionID = 'test-session-123';

// 清理
if (existsSync(testDir)) {
  rmSync(testDir, { recursive: true, force: true });
}

// 创建目录结构（模拟 beforeEach）
mkdirSync(MESSAGE_STORAGE, { recursive: true });
mkdirSync(join(MESSAGE_STORAGE, sessionID), { recursive: true });

// 写入消息文件（模拟测试）
writeFileSync(join(MESSAGE_STORAGE, sessionID, 'msg_001.json'), JSON.stringify({
  id: 'msg_001',
  role: 'assistant',
  time: { created: 1000 },
}));

console.log('Message file exists:', existsSync(join(MESSAGE_STORAGE, sessionID, 'msg_001.json')));

// 清理
rmSync(testDir, { recursive: true, force: true });
