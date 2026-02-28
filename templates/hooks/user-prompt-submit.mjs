#!/usr/bin/env node
// OMC UserPromptSubmit Hook
// Fires before user prompt is submitted. Used for keyword detection.

import { readStdin } from './lib/stdin.mjs';

async function main() {
  const raw = await readStdin();
  let data = {};
  try { data = JSON.parse(raw); } catch {}

  // prompt available in data.prompt
  console.log(JSON.stringify({ continue: true, suppressOutput: true }));
}

main();
