#!/usr/bin/env node
// OMC TeammateIdle Hook
// Fires when a team teammate is about to go idle.
// Exit code 2 + stderr message forces teammate to continue working.

// Allow idle by default - enforcement is opt-in via user config
async function main() {
  process.exit(0);
}

main();
