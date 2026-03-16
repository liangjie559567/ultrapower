/**
 * 死锁检测性能测试
 */

import { DeadlockDetector } from '../src/team/deadlock-detector.js';
import { DependencyGraph } from '../src/team/dependency-graph.js';

function buildLargeGraph(nodeCount: number, edgesPerNode: number): DependencyGraph {
  const graph = new DependencyGraph();

  for (let i = 0; i < nodeCount; i++) {
    for (let j = 0; j < edgesPerNode; j++) {
      const target = (i + j + 1) % nodeCount;
      if (target !== i) {
        graph.addEdge(`agent-${i}`, `agent-${target}`);
      }
    }
  }

  return graph;
}

function buildGraphWithCycle(nodeCount: number): DependencyGraph {
  const graph = new DependencyGraph();

  // 创建链式依赖
  for (let i = 0; i < nodeCount - 1; i++) {
    graph.addEdge(`agent-${i}`, `agent-${i + 1}`);
  }

  // 添加循环边
  graph.addEdge(`agent-${nodeCount - 1}`, `agent-0`);

  return graph;
}

console.log('=== 死锁检测性能测试 ===\n');

const detector = new DeadlockDetector();

// 测试 1: 100 个 Agent，无循环
const graph100 = buildLargeGraph(100, 3);
const start100 = performance.now();
const result100 = detector.detect(graph100);
const time100 = performance.now() - start100;

console.log(`测试 1: 100 个 Agent (无循环)`);
console.log(`  耗时: ${time100.toFixed(2)}ms`);
console.log(`  结果: ${result100.hasDeadlock ? '检测到死锁' : '无死锁'}`);
console.log(`  状态: ${time100 < 100 ? '✅ PASS' : '❌ FAIL'}\n`);

// 测试 2: 100 个 Agent，有循环
const graphCycle = buildGraphWithCycle(100);
const startCycle = performance.now();
const resultCycle = detector.detect(graphCycle);
const timeCycle = performance.now() - startCycle;

console.log(`测试 2: 100 个 Agent (有循环)`);
console.log(`  耗时: ${timeCycle.toFixed(2)}ms`);
console.log(`  结果: ${resultCycle.hasDeadlock ? '检测到死锁' : '无死锁'}`);
console.log(`  循环长度: ${resultCycle.cycle?.length || 0}`);
console.log(`  状态: ${timeCycle < 100 ? '✅ PASS' : '❌ FAIL'}\n`);

// 测试 3: 500 个 Agent
const graph500 = buildLargeGraph(500, 3);
const start500 = performance.now();
const result500 = detector.detect(graph500);
const time500 = performance.now() - start500;

console.log(`测试 3: 500 个 Agent (无循环)`);
console.log(`  耗时: ${time500.toFixed(2)}ms`);
console.log(`  结果: ${result500.hasDeadlock ? '检测到死锁' : '无死锁'}\n`);

console.log('=== 总结 ===');
console.log(`100 Agent 性能要求: <100ms`);
console.log(`实际性能 (无循环): ${time100.toFixed(2)}ms`);
console.log(`实际性能 (有循环): ${timeCycle.toFixed(2)}ms`);
console.log(`总体评估: ${time100 < 100 && timeCycle < 100 ? '✅ 满足要求' : '❌ 未满足要求'}`);
