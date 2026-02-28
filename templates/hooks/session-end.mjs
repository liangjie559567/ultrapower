#!/usr/bin/env node
// OMC SessionEnd Hook
// Fires when a session ends. Cleans up transient state.

import { readStdin } from './lib/stdin.mjs';

async function main() {
  const raw = await readStdin();
  let data = {};
  try { data = JSON.parse(raw); } catch {}

  // session_id and directory available in data
  console.log(JSON.stringify({ continue: true, suppressOutput: true }));
}

main();
