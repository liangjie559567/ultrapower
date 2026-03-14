#!/usr/bin/env node
/**
 * e2e-bridge-cli.mjs
 * E2E 测试 bridge CLI 入口点
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const bridgeJs = join(__dirname, '../dist/hooks/bridge.js');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Test 1: No --hook argument
await test('should exit with error when no --hook argument', async () => {
  const proc = spawn('node', [bridgeJs]);

  let stderr = '';
  proc.stderr.on('data', (data) => { stderr += data.toString(); });

  const exitCode = await new Promise((resolve) => {
    proc.on('close', (code) => resolve(code));
  });

  assert(exitCode === 1, `Expected exit code 1, got ${exitCode}`);
  assert(stderr.includes('Usage:'), `Expected usage message in stderr`);
});

// Test 2: Valid hook with input
await test('should process valid hook input', async () => {
  const proc = spawn('node', [bridgeJs, '--hook=keyword-detector']);

  const input = JSON.stringify({ sessionId: 'e2e-test', directory: process.cwd() });
  proc.stdin.write(input);
  proc.stdin.end();

  let stdout = '';
  proc.stdout.on('data', (data) => { stdout += data.toString(); });

  await new Promise((resolve) => { proc.on('close', resolve); });

  const output = JSON.parse(stdout);
  assert(typeof output.continue === 'boolean', 'Expected continue property');
});

// Test 3: Invalid JSON input
await test('should handle invalid JSON input', async () => {
  const proc = spawn('node', [bridgeJs, '--hook=keyword-detector']);

  proc.stdin.write('invalid json');
  proc.stdin.end();

  let stdout = '';
  let stderr = '';
  proc.stdout.on('data', (data) => { stdout += data.toString(); });
  proc.stderr.on('data', (data) => { stderr += data.toString(); });

  const exitCode = await new Promise((resolve) => {
    proc.on('close', (code) => resolve(code));
  });

  // Bridge may output error JSON or exit with error
  assert(exitCode === 1 || stderr.length > 0 || stdout.includes('error'),
    `Expected error handling, got exit=${exitCode}`);
});

// Test 4: DISABLE_OMC environment variable
await test('should respect DISABLE_OMC env var', async () => {
  const proc = spawn('node', [bridgeJs, '--hook=keyword-detector'], {
    env: { ...process.env, DISABLE_OMC: '1' }
  });

  const input = JSON.stringify({ sessionId: 'e2e-test', directory: process.cwd() });
  proc.stdin.write(input);
  proc.stdin.end();

  let stdout = '';
  proc.stdout.on('data', (data) => { stdout += data.toString(); });

  await new Promise((resolve) => { proc.on('close', resolve); });

  const output = JSON.parse(stdout);
  assert(output.continue === true, 'Expected continue=true when disabled');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
