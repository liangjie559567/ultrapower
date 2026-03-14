import { describe, it, expect } from 'vitest';
import { parallelOpportunityDetectorTool } from '../parallel-opportunity-detector';

describe('parallel-opportunity-detector', () => {
  it('detects independent tasks as single phase', async () => {
    const result = await parallelOpportunityDetectorTool.handler({
      tasks: [
        { id: 'task1' },
        { id: 'task2' },
        { id: 'task3' }
      ]
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.totalPhases).toBe(1);
    expect(data.phases[0].parallelTasks).toHaveLength(3);
  });

  it('detects sequential dependencies', async () => {
    const result = await parallelOpportunityDetectorTool.handler({
      tasks: [
        { id: 'task1' },
        { id: 'task2', dependencies: ['task1'] },
        { id: 'task3', dependencies: ['task2'] }
      ]
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.totalPhases).toBe(3);
    expect(data.strategy).toBe('team');
  });

  it('detects mixed parallel and sequential', async () => {
    const result = await parallelOpportunityDetectorTool.handler({
      tasks: [
        { id: 'task1' },
        { id: 'task2' },
        { id: 'task3', dependencies: ['task1', 'task2'] }
      ]
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.totalPhases).toBe(2);
    expect(data.phases[0].parallelTasks).toContain('task1');
    expect(data.phases[0].parallelTasks).toContain('task2');
  });

  it('handles empty task list', async () => {
    const result = await parallelOpportunityDetectorTool.handler({ tasks: [] });
    const data = JSON.parse(result.content[0].text);
    expect(data.totalPhases).toBe(0);
  });
});
