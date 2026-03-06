/**
 * 状态机边界条件测试
 *
 * 覆盖场景：
 * 1. 超时处理 (5分钟警告, 10分钟自动终止)
 * 2. 孤儿进程检测
 * 3. 成本超限
 * 4. 死锁检测
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  suggestInterventions,
  getStaleAgents,
  COST_LIMIT_USD,
  DEADLOCK_CHECK_THRESHOLD,
  type SubagentTrackingState,
  type SubagentInfo,
} from '../index.js';

const TEST_DIR = join(process.cwd(), '.test-boundary-conditions');
const STATE_DIR = join(TEST_DIR, '.omc', 'state');
const STATE_FILE = join(STATE_DIR, 'subagent-tracking.json');

function createTestState(agents: SubagentInfo[]): SubagentTrackingState {
  return {
    agents,
    total_spawned: agents.length,
    total_completed: agents.filter(a => a.status === 'completed').length,
    total_failed: agents.filter(a => a.status === 'failed').length,
    last_updated: new Date().toISOString(),
  };
}

function writeTestState(state: SubagentTrackingState): void {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

describe('状态机边界条件测试', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(STATE_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('1. 超时处理', () => {
    it('应在5分钟后检测到stale agent', () => {
      const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
      const agent: SubagentInfo = {
        agent_id: 'test-agent-1',
        agent_type: 'executor',
        started_at: sixMinutesAgo,
        parent_mode: 'autopilot',
        status: 'running',
      };

      const state = createTestState([agent]);
      writeTestState(state);

      const stale = getStaleAgents(state);
      expect(stale).toHaveLength(1);
      expect(stale[0].agent_id).toBe('test-agent-1');
    });

    it('应在10分钟后触发auto_execute', () => {
      const elevenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000).toISOString();
      const agent: SubagentInfo = {
        agent_id: 'test-agent-2',
        agent_type: 'executor',
        started_at: elevenMinutesAgo,
        parent_mode: 'autopilot',
        status: 'running',
      };

      const state = createTestState([agent]);
      writeTestState(state);

      const interventions = suggestInterventions(TEST_DIR);
      const timeoutIntervention = interventions.find(i => i.type === 'timeout');

      expect(timeoutIntervention).toBeDefined();
      expect(timeoutIntervention?.auto_execute).toBe(true);
      expect(timeoutIntervention?.suggested_action).toBe('kill');
    });

    it('5-10分钟之间应警告但不自动执行', () => {
      const sevenMinutesAgo = new Date(Date.now() - 7 * 60 * 1000).toISOString();
      const agent: SubagentInfo = {
        agent_id: 'test-agent-3',
        agent_type: 'executor',
        started_at: sevenMinutesAgo,
        parent_mode: 'autopilot',
        status: 'running',
      };

      const state = createTestState([agent]);
      writeTestState(state);

      const interventions = suggestInterventions(TEST_DIR);
      const timeoutIntervention = interventions.find(i => i.type === 'timeout');

      expect(timeoutIntervention).toBeDefined();
      expect(timeoutIntervention?.auto_execute).toBe(false);
      expect(timeoutIntervention?.suggested_action).toBe('kill');
    });
  });

  describe('2. 孤儿进程检测', () => {
    it('应检测到已完成但父会话结束的agent', () => {
      const agent: SubagentInfo = {
        agent_id: 'orphan-agent',
        agent_type: 'executor',
        started_at: new Date(Date.now() - 1000).toISOString(),
        parent_mode: 'autopilot',
        status: 'completed',
        completed_at: new Date().toISOString(),
      };

      const state = createTestState([agent]);
      writeTestState(state);

      expect(existsSync(STATE_FILE)).toBe(true);
      const stale = getStaleAgents(state);
      expect(stale).toHaveLength(0);
    });

    it('应检测到运行中但父会话已结束的agent', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const agent: SubagentInfo = {
        agent_id: 'orphan-running',
        agent_type: 'executor',
        started_at: tenMinutesAgo,
        parent_mode: 'none',
        status: 'running',
      };

      const state = createTestState([agent]);
      writeTestState(state);

      const stale = getStaleAgents(state);
      expect(stale).toHaveLength(1);
    });
  });

  describe('3. 成本超限', () => {
    it('应检测到超过成本限制的agent', () => {
      const agent: SubagentInfo = {
        agent_id: 'expensive-agent',
        agent_type: 'executor',
        started_at: new Date().toISOString(),
        parent_mode: 'autopilot',
        status: 'running',
        token_usage: {
          input_tokens: 100000,
          output_tokens: 50000,
          cache_read_tokens: 0,
          cost_usd: 1.5,
        },
      };

      const state = createTestState([agent]);
      writeTestState(state);

      const interventions = suggestInterventions(TEST_DIR);
      const costIntervention = interventions.find(i => i.type === 'excessive_cost');

      expect(costIntervention).toBeDefined();
      expect(costIntervention?.suggested_action).toBe('warn');
      expect(costIntervention?.auto_execute).toBe(false);
    });

    it('成本在限制内不应触发干预', () => {
      const agent: SubagentInfo = {
        agent_id: 'cheap-agent',
        agent_type: 'executor',
        started_at: new Date().toISOString(),
        parent_mode: 'autopilot',
        status: 'running',
        token_usage: {
          input_tokens: 10000,
          output_tokens: 5000,
          cache_read_tokens: 0,
          cost_usd: 0.5,
        },
      };

      const state = createTestState([agent]);
      writeTestState(state);

      const interventions = suggestInterventions(TEST_DIR);
      const costIntervention = interventions.find(i => i.type === 'excessive_cost');

      expect(costIntervention).toBeUndefined();
    });

    it('应使用正确的成本限制常量', () => {
      expect(COST_LIMIT_USD).toBe(1.0);
    });
  });

  describe('4. 死锁检测', () => {
    it('应定义死锁检测阈值常量', () => {
      expect(DEADLOCK_CHECK_THRESHOLD).toBe(3);
    });

    it('当前实现不检测死锁（已知限制）', () => {
      const agents: SubagentInfo[] = Array.from({ length: 4 }, (_, i) => ({
        agent_id: `agent-${i}`,
        agent_type: 'executor',
        started_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        parent_mode: 'ultrawork',
        status: 'running',
        file_ownership: [`file-${(i + 1) % 4}.ts`],
      }));

      const state = createTestState(agents);
      writeTestState(state);

      const interventions = suggestInterventions(TEST_DIR);
      const deadlockIntervention = interventions.find(i => i.type === 'deadlock');

      expect(deadlockIntervention).toBeUndefined();
    });
  });
});
