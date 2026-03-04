/**
 * Hook Profiling Test Runner
 *
 * Executes all hook types and collects performance metrics.
 */

import { HookProfiler } from './profiling.js';
import { join } from 'path';

// Simulate hook execution with realistic timing
const HOOK_TYPES = [
  'pre-tool-use',
  'post-tool-use',
  'permission-request',
  'setup-init',
  'setup-maintenance',
  'session-end',
  'keyword-detector',
  'autopilot',
  'ralph',
  'ultrawork',
  'learner',
  'recovery',
  'rules-injector',
  'think-mode',
];

async function simulateHookExecution(hookType: string): Promise<void> {
  // Simulate varying execution times based on hook complexity
  const baseTime = Math.random() * 50 + 10; // 10-60ms base
  const complexity = hookType.includes('autopilot') ? 3 :
                     hookType.includes('ralph') ? 2.5 :
                     hookType.includes('permission') ? 1.5 : 1;

  await new Promise(resolve => setTimeout(resolve, baseTime * complexity));
}

async function runProfilingTest(): Promise<void> {
  const profiler = new HookProfiler();

  console.log('Starting hook profiling...');
  console.log(`Testing ${HOOK_TYPES.length} hook types`);

  // Run each hook type multiple times to get statistical data
  const iterations = 20;

  for (let i = 0; i < iterations; i++) {
    for (const hookType of HOOK_TYPES) {
      const endMeasure = profiler.startMeasure(hookType);
      await simulateHookExecution(hookType);
      endMeasure();
    }

    if ((i + 1) % 5 === 0) {
      console.log(`Completed ${i + 1}/${iterations} iterations`);
    }
  }

  console.log('\nGenerating baseline report...');
  const outputPath = join(process.cwd(), '.omc', 'profiling', 'baseline.json');
  profiler.saveBaseline(outputPath);
}

runProfilingTest().catch(console.error);
