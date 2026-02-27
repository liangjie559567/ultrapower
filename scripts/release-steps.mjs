// scripts/release-steps.mjs
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
  const { version, dryRun = false } = opts;
  const v = version || getVersion();
  try {
    run(`git add .claude-plugin/marketplace.json`, dryRun);
    run(`git commit -m "chore: sync marketplace version to v${v}" --allow-empty`, dryRun);
    run(`git push origin HEAD`, dryRun);
    return { success: true };
  } catch (err) {
    return { success: false, output: err.message };
  }
}

export async function runReleasePipeline(opts = {}) {
  const { dryRun = false, skipTests = false, startFrom = 'validate', version } = opts;
  const steps = ['validate', 'publish', 'release', 'sync'];
  const startIdx = steps.indexOf(startFrom);

  if (startIdx === -1) {
    console.error(`Unknown startFrom: ${startFrom}. Valid: ${steps.join(', ')}`);
    process.exit(1);
  }

  const v = version || getVersion();

  if (startIdx <= 0) {
    console.log('Step 1/4: validateBuild...');
    const r = await validateBuild({ skipTests, dryRun });
    if (!r.success) { console.error(`validateBuild failed: ${r.output}`); process.exit(1); }
  }

  if (startIdx <= 1) {
    console.log('Step 2/4: publishNpm...');
    const r = await publishNpm({ dryRun });
    if (!r.success) { console.error(`publishNpm failed: ${r.output}`); process.exit(1); }
  }

  if (startIdx <= 2) {
    console.log('Step 3/4: createGithubRelease...');
    const r = await createGithubRelease({ version: v, dryRun });
    if (!r.success) { console.error(`createGithubRelease failed: ${r.output}`); process.exit(1); }
  }

  if (startIdx <= 3) {
    console.log('Step 4/4: syncMarketplace...');
    const r = await syncMarketplace({ version: v, dryRun });
    if (!r.success) { console.error(`syncMarketplace failed: ${r.output}`); process.exit(1); }
  }

  console.log('Release pipeline completed successfully.');
  return { success: true };
}

// CLI entry point (for direct GitHub Actions invocation)
const cliStep = process.argv[2];
if (cliStep && ['validate', 'publish', 'release', 'sync'].includes(cliStep)) {
  const dryRun = process.argv.includes('--dry-run');
  const version = process.env.GITHUB_REF_NAME?.replace(/^v/, '') || undefined;
  const stepMap = {
    validate: validateBuild,
    publish: publishNpm,
    release: createGithubRelease,
    sync: syncMarketplace,
  };
  stepMap[cliStep]({ dryRun, version }).then(r => {
    if (!r.success) { console.error(`Step ${cliStep} failed`); process.exit(1); }
  });
}
