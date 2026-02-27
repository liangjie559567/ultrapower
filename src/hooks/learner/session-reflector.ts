/**
 * session-reflector.ts — 会话结束自动反思触发器
 *
 * 在会话结束时自动触发 Axiom 反思流程，将 modesUsed 入队学习队列。
 */

import * as path from 'path';
import { isAxiomEnabled } from '../axiom-boot/storage.js';
import { EvolutionOrchestrator } from './orchestrator.js';
import { LearningQueue } from './learning-queue.js';

export interface SessionReflectInput {
  sessionId: string;
  directory: string;
  durationMs?: number;
  agentsSpawned?: number;
  agentsCompleted?: number;
  modesUsed?: string[];
  reason?: string;
}

export interface SessionReflectResult {
  reflected: boolean;
  reportPath?: string;
  queuedItems: number;
  error?: string;
}

export async function reflectOnSessionEnd(
  input: SessionReflectInput
): Promise<SessionReflectResult> {
  const work = async (): Promise<SessionReflectResult> => {
    try {
      if (!isAxiomEnabled(input.directory)) {
        return { reflected: false, queuedItems: 0 };
      }

      // Guard: skip empty sessions with no substantive activity
      const hasAgents = (input.agentsSpawned ?? 0) > 0;
      const hasModes = (input.modesUsed?.length ?? 0) > 0;
      const hasSignificantDuration = (input.durationMs ?? 0) >= 60000;
      if (!hasAgents && !hasModes && !hasSignificantDuration) {
        return { reflected: false, queuedItems: 0 };
      }

      const sessionName = `auto-${input.sessionId.slice(0, 8)}`;
      const durationMin = input.durationMs != null ? Math.round(input.durationMs / 60000) : 0;

      const orchestrator = new EvolutionOrchestrator(input.directory);
      await orchestrator.reflect({
        sessionName,
        durationMin,
        tasksCompleted: input.agentsCompleted,
        tasksTotal: input.agentsSpawned,
      });

      const reportPath = path.join(input.directory, '.omc', 'axiom', 'reflection_log.md');

      let queuedItems = 0;
      if (input.modesUsed && input.modesUsed.length > 0) {
        const learningQueue = new LearningQueue(input.directory);
        for (const mode of input.modesUsed) {
          await learningQueue.addItem(
            'session_mode',
            mode,
            'P3',
            `mode used in session ${sessionName}`
          );
          queuedItems++;
        }
      }

      return { reflected: true, reportPath, queuedItems };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { reflected: false, queuedItems: 0, error: msg };
    }
  };

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<SessionReflectResult>(resolve => {
    timeoutHandle = setTimeout(() => resolve({ reflected: false, queuedItems: 0, error: 'timeout' }), 3000);
  });

  try {
    return await Promise.race([work(), timeout]);
  } finally {
    clearTimeout(timeoutHandle);
  }
}
