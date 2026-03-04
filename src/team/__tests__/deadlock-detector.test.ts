import { describe, it, expect } from 'vitest';
import { DeadlockDetector } from '../deadlock-detector.js';
import { DependencyGraph } from '../dependency-graph.js';

describe('DeadlockDetector', () => {
  it('无循环图', () => {
    const graph = new DependencyGraph();
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');

    const detector = new DeadlockDetector();
    const result = detector.detect(graph);

    expect(result.hasDeadlock).toBe(false);
    expect(result.cycle).toBeUndefined();
  });

  it('简单循环 A→B→A', () => {
    const graph = new DependencyGraph();
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'A');

    const detector = new DeadlockDetector();
    const result = detector.detect(graph);

    expect(result.hasDeadlock).toBe(true);
    expect(result.cycle).toEqual(['A', 'B']);
  });

  it('复杂循环 A→B→C→A', () => {
    const graph = new DependencyGraph();
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');
    graph.addEdge('C', 'A');

    const detector = new DeadlockDetector();
    const result = detector.detect(graph);

    expect(result.hasDeadlock).toBe(true);
    expect(result.cycle).toHaveLength(3);
  });

  it('自循环 A→A', () => {
    const graph = new DependencyGraph();
    graph.addEdge('A', 'A');

    const detector = new DeadlockDetector();
    const result = detector.detect(graph);

    expect(result.hasDeadlock).toBe(true);
    expect(result.cycle).toEqual(['A']);
  });

  it('多个独立子图无循环', () => {
    const graph = new DependencyGraph();
    graph.addEdge('A', 'B');
    graph.addEdge('C', 'D');

    const detector = new DeadlockDetector();
    const result = detector.detect(graph);

    expect(result.hasDeadlock).toBe(false);
  });
});
