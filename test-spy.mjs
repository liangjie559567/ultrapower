import { vi } from 'vitest';

// Mock console.warn BEFORE importing the module
const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

// Now import after spy is set up
const { normalizeHookInput } = await import('./dist/hooks/bridge-normalize.js');

const camelInput = {
  sessionId: 'abc',
  toolName: 'Read',
  directory: '/tmp',
  injected: 'evil',
};

normalizeHookInput(camelInput, 'permission-request');

console.log('Spy called:', warnSpy.mock.calls.length, 'times');
console.log('Calls:', warnSpy.mock.calls);

warnSpy.mockRestore();
