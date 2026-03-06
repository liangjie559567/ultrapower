#!/usr/bin/env node
import { execSync } from 'child_process';

const v8 = await import('v8');
const stats = v8.getHeapStatistics();

console.log('=== Memory Usage ===');
console.log(`Heap Used: ${Math.round(stats.used_heap_size / 1024 / 1024)} MB`);
console.log(`Heap Total: ${Math.round(stats.total_heap_size / 1024 / 1024)} MB`);
console.log(`RSS: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`);
console.log(`Heap Usage: ${Math.round((stats.used_heap_size / stats.total_heap_size) * 100)}%`);
