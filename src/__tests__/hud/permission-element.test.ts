import { describe, it, expect } from 'vitest';
import { renderPermission } from '../../hud/elements/permission.js';

describe('Permission Element', () => {
  it('renders pending permission', () => {
    const result = renderPermission({ toolName: 'Edit', targetSummary: 'file.ts' });
    expect(result).toContain('APPROVE');
  });

  it('returns null when no permission', () => {
    expect(renderPermission(null)).toBeNull();
  });
});
