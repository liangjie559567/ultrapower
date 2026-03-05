import { spawn } from 'child_process';

const tasks = [
  ['node', ['scripts/build-skill-bridge.mjs']],
  ['node', ['scripts/build-mcp-server.mjs']],
  ['node', ['scripts/build-codex-server.mjs']],
  ['node', ['scripts/build-gemini-server.mjs']],
  ['node', ['scripts/build-bridge-entry.mjs']]
];

const processes = tasks.map(([cmd, args]) => spawn(cmd, args, { stdio: 'inherit' }));

Promise.all(processes.map(p => new Promise((resolve, reject) => {
  p.on('exit', code => code === 0 ? resolve() : reject(new Error(`Exit ${code}`)));
}))).then(() => process.exit(0)).catch(() => process.exit(1));
