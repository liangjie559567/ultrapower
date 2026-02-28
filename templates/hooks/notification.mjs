#!/usr/bin/env node
// OMC Notification Hook
// Fires on system notifications. Logs for trace/metrics.

import { readStdin } from './lib/stdin.mjs';

async function main() {
  const raw = await readStdin();
  let data = {};
  try { data = JSON.parse(raw); } catch {}

  console.log(JSON.stringify({ continue: true, suppressOutput: true }));
}

main();
