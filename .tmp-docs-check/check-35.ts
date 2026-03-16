// 修复前
fs.writeFileSync(filePath, JSON.stringify(data));

// 修复后
import { atomicWriteJsonSyncWithRetry } from '../../lib/atomic-write.js';
atomicWriteJsonSyncWithRetry(filePath, data);
