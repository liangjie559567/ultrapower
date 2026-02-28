#!/usr/bin/env node
// OMC SubagentStop Hook
// Fires when a subagent finishes. Logs agent completion for trace/metrics.

import { readStdin } from './lib/stdin.mjs';

async function main() {
  const raw = await readStdin();
  let data = {};
  try { data = JSON.parse(raw); } catch {}

  const { agent_type, agent_id, last_assistant_message, stop_hook_active } = data;

  // Prevent infinite loop: if hook is already active, exit silently
  if (stop_hook_active) process.exit(0);

  console.log(JSON.stringify({ continue: true, suppressOutput: true }));
}

main();
