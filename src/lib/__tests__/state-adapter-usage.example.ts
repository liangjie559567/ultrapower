/**
 * StateAdapter 使用示例
 *
 * 展示如何使用统一的 StateAdapter 抽象层
 */

import { createStateAdapter } from '../state-adapter.js';

// 定义状态类型
interface MyState {
  active: boolean;
  iteration: number;
  data?: string;
}

// 创建适配器
const adapter = createStateAdapter<MyState>('ralph', process.cwd());

// 写入状态（异步，带文件锁）
await adapter.write({ active: true, iteration: 1 });

// 读取状态
const state = adapter.read();
console.log(state); // { active: true, iteration: 1 }

// 会话隔离
await adapter.write({ active: true, iteration: 2 }, 'session-123');
const sessionState = adapter.read('session-123');

// 列出所有会话
const sessions = adapter.list();
console.log(sessions); // ['session-123', ...]

// 清除状态
adapter.clear('session-123');

// 同步写入（无文件锁，更快但不安全）
adapter.writeSync({ active: false, iteration: 0 });
