// 创建适配器
const adapter = createStateAdapter<RalphLoopState>('ralph', directory);

// 读取状态
const state = adapter.read(sessionId);

// 写入状态
await adapter.write(state, sessionId);

// 清除状态
adapter.clear(sessionId);
