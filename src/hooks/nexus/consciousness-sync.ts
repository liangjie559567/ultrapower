import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { isNexusEnabled, loadNexusConfig } from './config.js';
import { getEventsDir } from './data-collector.js';

export interface SyncResult {
  success: boolean;
  error?: string;
  filesCommitted?: number;
}

export function buildGitCommitMessage(sessionId: string, fileCount: number): string {
  const safeId = sessionId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 8);
  return `nexus: sync ${fileCount} event(s) from session ${safeId}`;
}

function git(args: string[], cwd: string): { ok: boolean; stdout: string; stderr: string } {
  const result = spawnSync('git', args, { cwd, encoding: 'utf-8' });
  return {
    ok: result.status === 0,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

export async function syncToRemote(directory: string, sessionId: string): Promise<SyncResult> {
  try {
    if (!isNexusEnabled(directory)) {
      return { success: false, error: 'nexus disabled' };
    }

    const config = loadNexusConfig(directory);
    if (!config.gitRemote) {
      return { success: false, error: 'gitRemote not configured' };
    }

    const eventsDir = getEventsDir(directory);
    if (!existsSync(eventsDir)) {
      return { success: true, filesCommitted: 0 };
    }

    git(['add', join('.omc', 'nexus', 'events')], directory);

    const statusResult = git(['status', '--porcelain'], directory);
    const nexusLines = statusResult.stdout
      .split('\n')
      .filter(l => l.includes('.omc/nexus/events'));

    if (nexusLines.length === 0) {
      return { success: true, filesCommitted: 0 };
    }

    const msg = buildGitCommitMessage(sessionId, nexusLines.length);
    const commitResult = git(['commit', '-m', msg], directory);
    if (!commitResult.ok) {
      return { success: false, error: commitResult.stderr };
    }

    const pushResult = git(['push', 'origin', 'HEAD'], directory);
    if (!pushResult.ok) {
      return { success: false, error: pushResult.stderr };
    }

    return { success: true, filesCommitted: nexusLines.length };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}
