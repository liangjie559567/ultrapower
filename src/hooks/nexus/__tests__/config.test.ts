import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadNexusConfig, DEFAULT_NEXUS_CONFIG } from '../config.js';

describe('loadNexusConfig', () => {
  let tmpDir: string;
  beforeEach(() => {
    tmpDir = join(tmpdir(), `nexus-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });
  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns default config when file does not exist', () => {
    const config = loadNexusConfig(tmpDir);
    expect(config).toEqual(DEFAULT_NEXUS_CONFIG);
  });

  it('loads and merges config from .omc/nexus/config.json', () => {
    const configDir = join(tmpDir, '.omc', 'nexus');
    mkdirSync(configDir, { recursive: true });
    writeFileSync(
      join(configDir, 'config.json'),
      JSON.stringify({ enabled: true, gitRemote: 'git@github.com:user/nexus-daemon.git' })
    );
    const config = loadNexusConfig(tmpDir);
    expect(config.enabled).toBe(true);
    expect(config.gitRemote).toBe('git@github.com:user/nexus-daemon.git');
    expect(config.autoApplyThreshold).toBe(80);
    expect(config.consciousnessInterval).toBe(300);
    expect(config.consciousnessBudgetPercent).toBe(10);
  });

  it('returns default config on malformed JSON', () => {
    const configDir = join(tmpDir, '.omc', 'nexus');
    mkdirSync(configDir, { recursive: true });
    writeFileSync(join(configDir, 'config.json'), 'not json');
    const config = loadNexusConfig(tmpDir);
    expect(config.enabled).toBe(false);
  });
});
