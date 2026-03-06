#!/usr/bin/env node
/**
 * Memory stress test - simulates real-world usage
 */

import { lspClientManager } from '../dist/tools/lsp/client.js';
import { MCPClient } from '../dist/mcp/client/MCPClient.js';

async function stressTest() {
  console.log('=== Memory Stress Test ===\n');

  const before = process.memoryUsage();
  console.log('Before:');
  console.log(`  RSS: ${Math.round(before.rss / 1024 / 1024)} MB`);
  console.log(`  Heap: ${Math.round(before.heapUsed / 1024 / 1024)} MB\n`);

  // Simulate heavy usage
  const clients = [];
  for (let i = 0; i < 10; i++) {
    const client = new MCPClient();
    clients.push(client);
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  const after = process.memoryUsage();
  console.log('After (10 MCP clients):');
  console.log(`  RSS: ${Math.round(after.rss / 1024 / 1024)} MB`);
  console.log(`  Heap: ${Math.round(after.heapUsed / 1024 / 1024)} MB\n`);

  const increase = Math.round((after.rss - before.rss) / 1024 / 1024);
  console.log(`Memory increase: ${increase} MB`);
  console.log(`Per client: ${(increase / 10).toFixed(2)} MB`);
}

stressTest().catch(console.error);
