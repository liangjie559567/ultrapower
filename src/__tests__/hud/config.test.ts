import { describe, it, expect } from 'vitest';
import { DEFAULT_HUD_CONFIG, PRESET_CONFIGS } from '../../hud/types.js';

describe('HUD Config', () => {
  it('has valid default config', () => {
    expect(DEFAULT_HUD_CONFIG.preset).toBe('focused');
    expect(DEFAULT_HUD_CONFIG.elements.maxOutputLines).toBe(4);
    expect(DEFAULT_HUD_CONFIG.thresholds.contextWarning).toBe(70);
  });

  it('minimal preset has correct values', () => {
    expect(PRESET_CONFIGS.minimal.maxOutputLines).toBe(2);
  });

  it('full preset has correct values', () => {
    expect(PRESET_CONFIGS.full.maxOutputLines).toBe(12);
  });

  it('analytics preset shows cost and cache', () => {
    expect(PRESET_CONFIGS.analytics.showCost).toBe(true);
    expect(PRESET_CONFIGS.analytics.showCache).toBe(true);
  });
});
