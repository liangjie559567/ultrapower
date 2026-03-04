import { describe, it, expect } from 'vitest';
import { DependencyGraph } from '../dependency-graph.js';

describe('DependencyGraph', () => {
  it('添加节点', () => {
    const graph = new DependencyGraph();
    graph.addNode('A');
    expect(graph.getNodes()).toContain('A');
  });

  it('添加依赖边', () => {
    const graph = new DependencyGraph();
    graph.addEdge('A', 'B');
    expect(graph.getDependencies('A')).toEqual(['B']);
  });

  it('获取空依赖', () => {
    const graph = new DependencyGraph();
    graph.addNode('A');
    expect(graph.getDependencies('A')).toEqual([]);
  });

  it('多个依赖', () => {
    const graph = new DependencyGraph();
    graph.addEdge('A', 'B');
    graph.addEdge('A', 'C');
    const deps = graph.getDependencies('A');
    expect(deps).toHaveLength(2);
    expect(deps).toContain('B');
    expect(deps).toContain('C');
  });
});
