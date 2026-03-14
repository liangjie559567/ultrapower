import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getClaudeConfigDir } from '../utils/paths.js';
import type { WorkerBackend, UnifiedTeamMember } from './types.js';
import { listMcpWorkers } from './team-registration.js';
import { readHeartbeat, isWorkerAlive } from './heartbeat.js';
import { getDefaultCapabilities } from './capabilities.js';
import { UnifiedContextManager } from '../features/unified-context/index.js';

export type { UnifiedTeamMember };

const contextManagers = new Map<string, UnifiedContextManager>();

export function setContextManager(teamName: string, manager: UnifiedContextManager): void {
  contextManagers.set(teamName, manager);
}

export function getContextManager(teamName: string): UnifiedContextManager | null {
  return contextManagers.get(teamName) || null;
}

/**
 * Get all team members from both Claude native teams and MCP workers.
 */
export async function getTeamMembers(
  teamName: string,
  workingDirectory: string
): Promise<UnifiedTeamMember[]> {
  const members: UnifiedTeamMember[] = [];

  // Sync agent contexts to MCP Memory if context manager is available
  const contextManager = contextManagers.get(teamName);
  if (contextManager) {
    try {
      const sharedContext = await contextManager.getSharedContext();
      await Promise.all(
        Object.entries(sharedContext).map(([agentId, context]) =>
          contextManager.setAgentContext(agentId, context)
        )
      );
    } catch { /* graceful degradation */ }
  }

  // 1. Read Claude native members from config.json
  try {
    const configPath = join(getClaudeConfigDir(), 'teams', teamName, 'config.json');
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (Array.isArray(config.members)) {
        for (const member of config.members) {
          // Skip MCP workers (they'll be handled below)
          if (member.backendType === 'tmux') continue;

          members.push({
            name: member.name || 'unknown',
            agentId: member.agentId || '',
            backend: 'claude-native',
            model: member.model || 'unknown',
            capabilities: getDefaultCapabilities('claude-native'),
            joinedAt: member.joinedAt || 0,
            status: 'active', // Claude native members are managed by CC
            currentTaskId: null,
          });
        }
      }
    }
  } catch { /* graceful degradation - config may not exist */ }

  // 2. Read MCP workers from shadow registry + heartbeat
  try {
    const mcpWorkers = listMcpWorkers(teamName, workingDirectory);
    for (const worker of mcpWorkers) {
      const heartbeat = readHeartbeat(workingDirectory, teamName, worker.name);
      const alive = isWorkerAlive(workingDirectory, teamName, worker.name, 60000);

      // Determine status from heartbeat
      let status: UnifiedTeamMember['status'] = 'unknown';
      if (heartbeat) {
        if (heartbeat.status === 'quarantined') status = 'quarantined';
        else if (heartbeat.status === 'executing') status = 'active';
        else if (heartbeat.status === 'ready' || heartbeat.status === 'polling') status = 'idle';
        else status = heartbeat.status as UnifiedTeamMember['status'];
      }
      if (!alive) status = 'dead';

      // Determine backend and default capabilities
      const backend: WorkerBackend = worker.agentType === 'mcp-gemini' ? 'mcp-gemini' : 'mcp-codex';
      const capabilities = getDefaultCapabilities(backend);

      members.push({
        name: worker.name,
        agentId: worker.agentId,
        backend,
        model: worker.model,
        capabilities,
        joinedAt: worker.joinedAt,
        status,
        currentTaskId: heartbeat?.currentTaskId ?? null,
      });
    }
  } catch { /* graceful degradation */ }

  return members;
}
