import { describe, it, expect } from 'vitest';
import { DeadlockDetector, DependencyGraph } from './deadlock-detector.js';

describe('DeadlockDetector', () => {
  it('detects simple cycle: A → B → A', () => {
    const graph = new DependencyGraph();
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'A');

    const detector = new DeadlockDetector();
    const result = detector.detect(graph);

    expect(result.hasDeadlock).toBe(true);
    expect(result.cycle).toEqual(['A', 'B']);
  });

  it('detects complex cycle: A → B → C → A', () => {
    const graph = new DependencyGraph();
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');
    graph.addEdge('C', 'A');

    const detector = new DeadlockDetector();
    const result = detector.detect(graph);

    expect(result.hasDeadlock).toBe(true);
    expect(result.cycle).toEqual(['A', 'B', 'C']);
  });

  it('detects self-loop: A → A', () => {
    const graph = new DependencyGraph();
    graph.addEdge('A', 'A');

    const detector = new DeadlockDetector();
    const result = detector.detect(graph);

    expect(result.hasDeadlock).toBe(true);
    expect(result.cycle).toEqual(['A']);
  });

  it('no deadlock in linear chain: A → B → C', () => {
    const graph = new DependencyGraph();
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');

    const detector = new DeadlockDetector();
    const result = detector.detect(graph);

    expect(result.hasDeadlock).toBe(false);
    expect(result.cycle).toBeUndefined();
  });

  it('no deadlock in empty graph', () => {
    const graph = new DependencyGraph();

    const detector = new DeadlockDetector();
    const result = detector.detect(graph);

    expect(result.hasDeadlock).toBe(false);
  });
});
