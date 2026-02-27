// scripts/release-local.mjs
// 用法:
//   node scripts/release-local.mjs
//   node scripts/release-local.mjs --dry-run
//   node scripts/release-local.mjs --start-from=publish
//   npm run release:local
//   npm run release:dry-run

import { runReleasePipeline } from './release-steps.mjs';

export function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const startFromArg = argv.find(a => a.startsWith('--start-from='));
  const startFrom = startFromArg ? startFromArg.split('=')[1] : 'validate';
  const skipTests = argv.includes('--skip-tests');
  return { dryRun, startFrom, skipTests };
}

// 仅在直接执行时运行（非 import）
if (process.argv[1] && process.argv[1].endsWith('release-local.mjs')) {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Running release pipeline (dryRun=${args.dryRun}, startFrom=${args.startFrom})`);
  runReleasePipeline(args).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
