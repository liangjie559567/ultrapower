// scripts/release-steps.mjs
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertVersionsSync } from './bump-version.mjs';

function getVersion() {
  const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
  return pkg.version;
}

function run(cmd, dryRun = false) {
  if (dryRun) {
    console.log(`[dry-run] ${cmd}`);
    return '';
  }
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf-8' });
}

export async function preflight(opts = {}) {
  try {
    assertVersionsSync();
    return { success: true };
  } catch (err) {
    return { success: false, output: err.message };
  }
}

export async function validateBuild(opts = {}) {
  const { skipTests = false, dryRun = false } = opts;
  try {
    run('tsc --noEmit', dryRun);
    run('npm run build', dryRun);
    if (!skipTests) run('npm run test:run', dryRun);
    return { success: true, output: 'Build validation passed' };
  } catch (err) {
    return { success: false, output: err.message };
  }
}

export async function publishNpm(opts = {}) {
  const { dryRun = false, tag = 'latest' } = opts;
  const version = getVersion();
  try {
    run(`npm publish --access public --tag ${tag}`, dryRun);
    return { success: true, version };
  } catch (err) {
    return { success: false, version, output: err.message };
  }
}

export async function createGithubRelease(opts = {}) {
  const { version, notes = '', dryRun = false } = opts;
  const v = version || getVersion();
  try {
    const notesFlag = notes ? `--notes "${notes}"` : '--generate-notes';
    run(`gh release create v${v} ${notesFlag}`, dryRun);
    return { success: true, url: `https://github.com/liangjie559567/ultrapower/releases/tag/v${v}` };
  } catch (err) {
    return { success: false, url: '', output: err.message };
  }
}

export async function syncMarketplace(opts = {}) {
  const { dryRun = false } = opts;
  const version = getVersion();
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`syncMarketplace: invalid version format: ${version}`);
  }
  const marketplacePath = resolve('.claude-plugin/marketplace.json');
  const market = JSON.parse(readFileSync(marketplacePath, 'utf-8'));

  let changed = false;
  for (const p of market.plugins ?? []) {
    if (p.version !== version) { p.version = version; changed = true; }
    if (p.source?.version !== version) { p.source.version = version; changed = true; }
  }

  if (!changed) {
    console.log('syncMarketplace: versions already in sync');
    return { success: true };
  }

  writeFileSync(marketplacePath, JSON.stringify(market, null, 2) + '\n');
  const branchName = `chore/sync-marketplace-v${version}`;
  run(`git checkout -b ${branchName}`, dryRun);
  run(`git add .claude-plugin/marketplace.json`, dryRun);
  run(`git commit -m "chore: sync marketplace.json to v${version}"`, dryRun);
  run(`git push origin ${branchName}`, dryRun);
  run(`gh pr create --base dev --title "chore: sync marketplace.json to v${version}" --body "Automated: sync marketplace.json to v${version}"`, dryRun);

  console.log(`syncMarketplace: updated to v${version} and created PR`);
  return { success: true };
}

export async function runReleasePipeline(opts = {}) {
  const { dryRun = false, skipTests = false, startFrom = 'preflight', version } = opts;
  const steps = ['preflight', 'validate', 'publish', 'release', 'sync'];
  const startIdx = steps.indexOf(startFrom);

  if (startIdx === -1) {
    console.error(`Unknown startFrom: ${startFrom}. Valid: ${steps.join(', ')}`);
    process.exit(1);
  }

  const v = version || getVersion();
  const run5 = async (label, fn, fnOpts) => {
    console.log(label);
    const r = await fn(fnOpts);
    if (!r.success) { console.error(`${label} failed: ${r.output}`); process.exit(1); }
  };

  if (startIdx <= 0) await run5('Step 1/5: preflight...', preflight, { dryRun });
  if (startIdx <= 1) await run5('Step 2/5: validateBuild...', validateBuild, { skipTests, dryRun });
  if (startIdx <= 2) await run5('Step 3/5: publishNpm...', publishNpm, { dryRun });
  if (startIdx <= 3) await run5('Step 4/5: createGithubRelease...', createGithubRelease, { version: v, dryRun });
  if (startIdx <= 4) await run5('Step 5/5: syncMarketplace...', syncMarketplace, { dryRun });

  console.log('Release pipeline completed successfully.');
  return { success: true };
}

// CLI entry point (for direct GitHub Actions invocation)
const cliStep = process.argv[2];
if (cliStep && ['preflight', 'validate', 'publish', 'release', 'sync'].includes(cliStep)) {
  const dryRun = process.argv.includes('--dry-run');
  const version = process.env.GITHUB_REF_NAME?.replace(/^v/, '') || undefined;
  const stepMap = { preflight, validate: validateBuild, publish: publishNpm, release: createGithubRelease, sync: syncMarketplace };
  stepMap[cliStep]({ dryRun, version }).then(r => {
    if (!r.success) { console.error(`Step ${cliStep} failed`); process.exit(1); }
  });
}
