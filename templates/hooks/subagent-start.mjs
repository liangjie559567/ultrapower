#!/usr/bin/env node
// OMC SubagentStart Hook
// Fires when a subagent is about to start. Can inject context or block.

import { readStdin } from './lib/stdin.mjs';

async function main() {
  const raw = await readStdin();
  let data = {};
  try { data = JSON.parse(raw); } catch {}

  const { agent_type, agent_id } = data;

  console.log(JSON.stringify({ continue: true, suppressOutput: true }));
}

main();
