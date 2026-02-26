import { describe, it, expect } from 'vitest';
import { renderCallCounts } from '../../hud/elements/call-counts.js';
import { DEFAULT_HUD_CONFIG, PRESET_CONFIGS } from '../../hud/types.js';

const isWin = process.platform === 'win32';
const T = isWin ? 'T:' : '🔧';
const A = isWin ? 'A:' : '🤖';
const S = isWin ? 'S:' : '⚡';

describe('renderCallCounts', () => {
  describe('basic rendering', () => {
    it('renders all three counts when all are non-zero', () => {
      const result = renderCallCounts(42, 7, 3);
      expect(result).not.toBeNull();
      expect(result).toContain(`${T}42`);
      expect(result).toContain(`${A}7`);
      expect(result).toContain(`${S}3`);
    });

    it('returns null when all counts are zero', () => {
      const result = renderCallCounts(0, 0, 0);
      expect(result).toBeNull();
    });

    it('renders only tool count when only tools are non-zero', () => {
      const result = renderCallCounts(10, 0, 0);
      expect(result).toBe(`${T}10`);
    });

    it('renders only agent count when only agents are non-zero', () => {
      const result = renderCallCounts(0, 5, 0);
      expect(result).toBe(`${A}5`);
    });

    it('renders only skill count when only skills are non-zero', () => {
      const result = renderCallCounts(0, 0, 2);
      expect(result).toBe(`${S}2`);
    });
  });

  describe('partial counts', () => {
    it('omits zero tool count', () => {
      const result = renderCallCounts(0, 3, 1);
      expect(result).not.toContain(T);
      expect(result).toContain(`${A}3`);
      expect(result).toContain(`${S}1`);
    });

    it('omits zero agent count', () => {
      const result = renderCallCounts(15, 0, 2);
      expect(result).toContain(`${T}15`);
      expect(result).not.toContain(A);
      expect(result).toContain(`${S}2`);
    });

    it('omits zero skill count', () => {
      const result = renderCallCounts(8, 4, 0);
      expect(result).toContain(`${T}8`);
      expect(result).toContain(`${A}4`);
      expect(result).not.toContain(S);
    });
  });

  describe('output format', () => {
    it('separates parts with a space', () => {
      const result = renderCallCounts(5, 2, 1);
      expect(result).toBe(`${T}5 ${A}2 ${S}1`);
    });

    it('handles large numbers', () => {
      const result = renderCallCounts(1000, 99, 50);
      expect(result).toContain(`${T}1000`);
      expect(result).toContain(`${A}99`);
      expect(result).toContain(`${S}50`);
    });
  });
});

describe('showCallCounts config option', () => {
  it('DEFAULT_HUD_CONFIG has showCallCounts enabled', () => {
    expect(DEFAULT_HUD_CONFIG.elements.showCallCounts).toBe(true);
  });

  it('minimal preset disables showCallCounts', () => {
    expect(PRESET_CONFIGS.minimal.showCallCounts).toBe(false);
  });

  it('focused preset enables showCallCounts', () => {
    expect(PRESET_CONFIGS.focused.showCallCounts).toBe(true);
  });

  it('full preset enables showCallCounts', () => {
    expect(PRESET_CONFIGS.full.showCallCounts).toBe(true);
  });

  it('dense preset enables showCallCounts', () => {
    expect(PRESET_CONFIGS.dense.showCallCounts).toBe(true);
  });

  it('analytics preset enables showCallCounts', () => {
    expect(PRESET_CONFIGS.analytics.showCallCounts).toBe(true);
  });

  it('opencode preset enables showCallCounts', () => {
    expect(PRESET_CONFIGS.opencode.showCallCounts).toBe(true);
  });
});
