import { normalizeHookInput } from './dist/hooks/bridge-normalize.js';

const originalWarn = console.warn;
const calls = [];
console.warn = (...args) => {
  calls.push(args);
  originalWarn(...args);
};

const camelInput = {
  sessionId: 'abc',
  toolName: 'Read',
  directory: '/tmp',
  injected: 'evil',
};

normalizeHookInput(camelInput, 'permission-request');

console.log('\n=== Console.warn calls ===');
calls.forEach((call, i) => {
  console.log(`Call ${i}:`, call);
});
