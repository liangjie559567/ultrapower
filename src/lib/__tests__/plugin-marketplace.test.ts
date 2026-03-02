import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { countThirdPartyPlugins, isMarketplaceEnabled } from '../plugin-marketplace.js';

function tmpDir(): string {
  const d = join(tmpdir(), `omc-mkt-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(d, { recursive: true });
  return d;
}

describe('plugin-marketplace', () => {
  let base: string;

  beforeEach(() => { base = tmpDir(); });
  afterEach(() => {
    delete process.env['OMC_REGISTRY_PATH'];
    rmSync(base, { recursive: true, force: true });
  });

  function writeRegistry(plugins: Record<string, unknown>) {
    const path = join(base, 'installed_plugins.json');
    writeFileSync(path, JSON.stringify({ version: 2, plugins }));
    process.env['OMC_REGISTRY_PATH'] = path;
  }

  it('returns 0 when registry file does not exist', () => {
    process.env['OMC_REGISTRY_PATH'] = join(base, 'nonexistent.json');
    expect(countThirdPartyPlugins()).toBe(0);
  });

  it('returns 0 when registry has malformed JSON', () => {
    const path = join(base, 'bad.json');
    writeFileSync(path, 'not-json');
    process.env['OMC_REGISTRY_PATH'] = path;
    expect(countThirdPartyPlugins()).toBe(0);
  });

  it('returns 0 when registry missing plugins field', () => {
    const path = join(base, 'bad.json');
    writeFileSync(path, JSON.stringify({ version: 2 }));
    process.env['OMC_REGISTRY_PATH'] = path;
    expect(countThirdPartyPlugins()).toBe(0);
  });

  it('excludes ultrapower@ entries', () => {
    writeRegistry({ 'ultrapower@5.0.0': [], 'myplugin@1.0.0': [] });
    expect(countThirdPartyPlugins()).toBe(1);
  });

  it('isMarketplaceEnabled returns false below threshold', () => {
    writeRegistry({ 'a@1': [], 'b@1': [], 'c@1': [] });
    expect(isMarketplaceEnabled()).toBe(false);
  });

  it('isMarketplaceEnabled returns true at threshold', () => {
    writeRegistry({ 'a@1': [], 'b@1': [], 'c@1': [], 'd@1': [], 'e@1': [] });
    expect(isMarketplaceEnabled()).toBe(true);
  });
});
