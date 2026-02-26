import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { NexusConfig } from './types.js';

const DEBUG_ENABLED = process.env.OMC_DEBUG === '1';

export const DEFAULT_NEXUS_CONFIG: NexusConfig = {
  enabled: false,
  gitRemote: '',
  autoApplyThreshold: 80,
  consciousnessInterval: 300,
  consciousnessBudgetPercent: 10,
};

const CONFIG_RELATIVE_PATH = '.omc/nexus/config.json';

export function loadNexusConfig(directory: string): NexusConfig {
  const configPath = join(directory, CONFIG_RELATIVE_PATH);
  if (!existsSync(configPath)) {
    return { ...DEFAULT_NEXUS_CONFIG };
  }
  try {
    const raw = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) {
      return { ...DEFAULT_NEXUS_CONFIG };
    }
    return { ...DEFAULT_NEXUS_CONFIG, ...(parsed as Partial<NexusConfig>) };
  } catch (error) {
    if (DEBUG_ENABLED) {
      console.error('[nexus] Error loading config:', error);
    }
    return { ...DEFAULT_NEXUS_CONFIG };
  }
}

export function isNexusEnabled(directory: string): boolean {
  return loadNexusConfig(directory).enabled;
}
