#!/usr/bin/env node
// OMC TaskCompleted Hook
// Fires when a task is marked complete.

import { readStdin } from './lib/stdin.mjs';

async function main() {
  const raw = await readStdin();
  let data = {};
  try { data = JSON.parse(raw); } catch {}

  // task_id and result available in data
  console.log(JSON.stringify({ continue: true, suppressOutput: true }));
}

main();
