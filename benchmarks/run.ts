#!/usr/bin/env node
/**
 * Run MCP benchmarks and generate report
 */

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function runBenchmark(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('tsx', [script], { stdio: 'pipe' });
    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    proc.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    proc.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`Benchmark failed with code ${code}`));
    });
  });
}

async function main() {
  console.log('Running MCP Performance Benchmarks...\n');

  const benchmarks = [
    'benchmarks/mcp-tools.bench.ts'
  ];

  const results = [];

  for (const bench of benchmarks) {
    console.log(`\n=== Running ${bench} ===\n`);
    try {
      const output = await runBenchmark(bench);
      results.push({ benchmark: bench, output, success: true });
    } catch (error) {
      results.push({ benchmark: bench, error: error.message, success: false });
    }
  }

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    benchmarks: results
  };

  const reportPath = join('benchmarks', 'report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n\nReport saved to ${reportPath}`);
}

main().catch(console.error);
