/**
 * Tests for hooks/hooks.json path correctness (issue: stop-continuation.mjs MODULE_NOT_FOUND)
 *
 * hooks/hooks.json uses ${CLAUDE_PLUGIN_ROOT}/templates/hooks/*.mjs
 * The plugin cache must contain templates/hooks/ for these paths to resolve.
 * plugin-setup.mjs must copy templates/hooks/ to the plugin cache on install.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..');

interface HookEntry {
  type: string;
  command: string;
  async?: boolean;
}

interface HookGroup {
  matcher?: string;
  hooks: HookEntry[];
}

interface HooksJson {
  hooks: Record<string, HookGroup[]>;
}

function loadHooksJson(): HooksJson {
  const hooksJsonPath = join(PROJECT_ROOT, 'hooks', 'hooks.json');
  return JSON.parse(readFileSync(hooksJsonPath, 'utf-8'));
}

/**
 * Extract the relative path after ${CLAUDE_PLUGIN_ROOT}/ from a command string.
 * e.g. "node ${CLAUDE_PLUGIN_ROOT}/templates/hooks/foo.mjs" -> "templates/hooks/foo.mjs"
 */
function extractPluginRelativePath(command: string): string | null {
  const match = command.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/(.+\.mjs)/);
  return match ? match[1] : null;
}

describe('hooks/hooks.json path correctness', () => {
  it('all hook commands reference files that exist in the project source', () => {
    const hooksJson = loadHooksJson();
    const missing: string[] = [];

    for (const [event, groups] of Object.entries(hooksJson.hooks)) {
      for (const group of groups) {
        for (const hook of group.hooks) {
          if (hook.type !== 'command') continue;
          const relPath = extractPluginRelativePath(hook.command);
          if (!relPath) continue;

          const fullPath = join(PROJECT_ROOT, relPath);
          if (!existsSync(fullPath)) {
            missing.push(`${event}: ${hook.command} -> ${fullPath} (NOT FOUND)`);
          }
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it('Stop hook command references templates/hooks/stop-continuation.mjs', () => {
    const hooksJson = loadHooksJson();
    const stopGroups = hooksJson.hooks['Stop'] ?? [];

    expect(stopGroups.length).toBeGreaterThan(0);

    for (const group of stopGroups) {
      for (const hook of group.hooks) {
        if (hook.type !== 'command') continue;
        expect(hook.command).toContain('templates/hooks/stop-continuation.mjs');
      }
    }
  });

  it('all hook .mjs files referenced in hooks.json exist under templates/hooks/', () => {
    const hooksJson = loadHooksJson();
    const templatesHooksDir = join(PROJECT_ROOT, 'templates', 'hooks');
    const missing: string[] = [];

    for (const [event, groups] of Object.entries(hooksJson.hooks)) {
      for (const group of groups) {
        for (const hook of group.hooks) {
          if (hook.type !== 'command') continue;
          const relPath = extractPluginRelativePath(hook.command);
          if (!relPath) continue;
          if (!relPath.startsWith('templates/hooks/')) continue;

          const filename = relPath.replace('templates/hooks/', '');
          const fullPath = join(templatesHooksDir, filename);
          if (!existsSync(fullPath)) {
            missing.push(`${event}: ${filename} (NOT FOUND in templates/hooks/)`);
          }
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it('plugin-setup.mjs copies templates/hooks/ to plugin cache', () => {
    // Verify that plugin-setup.mjs contains logic to copy templates/hooks/ to cache
    const setupScript = readFileSync(join(PROJECT_ROOT, 'scripts', 'plugin-setup.mjs'), 'utf-8');
    // Must have cpSync call referencing srcTemplatesHooks (not just a comment)
    expect(setupScript).toMatch(/cpSync\s*\(\s*srcTemplatesHooks/);
  });
});
