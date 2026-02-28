#!/usr/bin/env node
// OMC PermissionRequest Hook
// Fires when Claude requests permission to use a tool.

import { readStdin } from './lib/stdin.mjs';

async function main() {
  const raw = await readStdin();
  let data = {};
  try { data = JSON.parse(raw); } catch {}

  // tool_name and tool_input available in data
  console.log(JSON.stringify({ continue: true, suppressOutput: true }));
}

main();
