#!/usr/bin/env node
// OMC PreCompact Hook
// Fires before context compaction. Saves Axiom state to prevent context loss.

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { readStdin } from './lib/stdin.mjs';

async function main() {
  const raw = await readStdin();
  let data = {};
  try { data = JSON.parse(raw); } catch {}

  const cwd = data.cwd || process.cwd();
  const VALID_TRIGGERS = new Set(['auto', 'manual']);
  const trigger = VALID_TRIGGERS.has(data.trigger) ? data.trigger : 'auto';
  const axiomDir = join(cwd, '.omc', 'axiom');

  // If Axiom is active, append a compact notice to active_context.md
  const activeContextPath = join(axiomDir, 'active_context.md');
  if (existsSync(activeContextPath)) {
    try {
      const content = readFileSync(activeContextPath, 'utf-8');
      const notice = `\n\n<!-- PreCompact: context compacted (${trigger}) at ${new Date().toISOString()} -->`;
      if (!content.includes('<!-- PreCompact:')) {
        writeFileSync(activeContextPath, content + notice, 'utf-8');
      }
    } catch {}
  }

  console.log(JSON.stringify({ continue: true, suppressOutput: true }));
}

main();
