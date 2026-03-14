import { describe, it, expect, vi } from 'vitest';
import { readRalphStateForHud, readUltraworkStateForHud, readAutopilotStateForHud } from '../../hud/omc-state.js';
import { existsSync, readFileSync, statSync } from 'fs';

vi.mock('fs');

describe('OMC State Readers', () => {
  const dir = '/test';

  describe('readRalphStateForHud', () => {
    it('returns null when file not found', () => {
      vi.mocked(existsSync).mockReturnValue(false);
      expect(readRalphStateForHud(dir)).toBeNull();
    });

    it('reads active ralph state', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue('{"active":true,"iteration":3}');
      vi.mocked(statSync).mockReturnValue({ mtimeMs: Date.now() } as any);

      const result = readRalphStateForHud(dir);
      expect(result).toMatchObject({ active: true, iteration: 3 });
    });
  });

  describe('readUltraworkStateForHud', () => {
    it('returns null when not active', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue('{"active":false}');
      vi.mocked(statSync).mockReturnValue({ mtimeMs: Date.now() } as any);

      expect(readUltraworkStateForHud(dir)).toBeNull();
    });
  });

  describe('readAutopilotStateForHud', () => {
    it('returns null when inactive', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue('{"active":false}');
      vi.mocked(statSync).mockReturnValue({ mtimeMs: Date.now() } as any);

      expect(readAutopilotStateForHud(dir)).toBeNull();
    });
  });
});
