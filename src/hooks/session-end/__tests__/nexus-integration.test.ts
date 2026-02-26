import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('processSessionEnd nexus integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-int-'));
    // Create nexus config with nexus enabled but no gitRemote
    const nexusDir = path.join(tmpDir, '.omc', 'nexus');
    fs.mkdirSync(nexusDir, { recursive: true });
    fs.writeFileSync(
      path.join(nexusDir, 'config.json'),
      JSON.stringify({ nexus: { enabled: true } }),
      'utf-8'
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('processSessionEnd completes without throwing when nexus enabled', async () => {
    const { processSessionEnd } = await import('../index.js');
    const result = await processSessionEnd({
      session_id: 'test-nexus-int-001',
      transcript_path: '',
      cwd: tmpDir,
      permission_mode: 'default',
      hook_event_name: 'SessionEnd',
      reason: 'other',
    });
    expect(result.continue).toBe(true);
  });
});
