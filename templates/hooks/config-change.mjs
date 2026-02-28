#!/usr/bin/env node
// OMC ConfigChange Hook
// Fires when Claude Code configuration changes.

import { readStdin } from './lib/stdin.mjs';

async function main() {
  const raw = await readStdin();
  let data = {};
  try { data = JSON.parse(raw); } catch {}

  // key and value available in data
  console.log(JSON.stringify({ continue: true, suppressOutput: true }));
}

main();
