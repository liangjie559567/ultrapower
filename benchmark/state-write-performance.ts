import { createStateManager } from '../src/state/index.js';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const testDir = join(process.cwd(), '.benchmark-state');

async function benchmark() {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }

  const manager = createStateManager({ mode: 'autopilot', directory: testDir });
  const iterations = 1000;
  const durations: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await manager.write({ active: true, iteration: i });
    durations.push(Date.now() - start);
  }

  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const max = Math.max(...durations);
  const p95 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];

  console.log(`State Write Performance (${iterations} iterations):`);
  console.log(`  Average: ${avg.toFixed(2)}ms`);
  console.log(`  Max: ${max}ms`);
  console.log(`  P95: ${p95}ms`);
  console.log(`  Target: <10ms`);
  console.log(`  Status: ${avg < 10 ? '✅ PASS' : '❌ FAIL'}`);

  rmSync(testDir, { recursive: true, force: true });
}

benchmark().catch(console.error);
