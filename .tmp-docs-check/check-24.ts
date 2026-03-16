import { atomicWriteJsonSync } from './atomic-write.js';

// 原子写入，避免部分写入
atomicWriteJsonSync(statePath, state);
