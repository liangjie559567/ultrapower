import { createStateManager } from '../src/state/index.js';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const testDir = join(process.cwd(), '.benchmark-memory');

async function benchmark() {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }

  const initialMemory = process.memoryUsage();
  const manager = createStateManager({ mode: 'autopilot', directory: testDir });
  const states = [];

  // Create 1000 state objects
  for (let i = 0; i < 1000; i++) {
    await manager.write({ active: true, iteration: i, data: 'x'.repeat(1000) });
    states.push({ iteration: i });
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  const finalMemory = process.memoryUsage();
  const heapDiff = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

  console.log('Memory Leak Detection:');
  console.log(`  Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Difference: ${heapDiff.toFixed(2)}MB`);
  console.log(`  Status: ${heapDiff < 50 ? '✅ PASS' : '❌ FAIL'}`);

  rmSync(testDir, { recursive: true, force: true });
}

benchmark().catch(console.error);
