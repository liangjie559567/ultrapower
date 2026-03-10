export function createPerfCommand() {
  return import('./perf.js').then(m => m.perfCommand);
}
