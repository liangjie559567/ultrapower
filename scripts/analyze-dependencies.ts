/**
 * Hook Dependency Analysis Runner
 */

import { DependencyAnalyzer } from '../src/hooks/dependency-analyzer.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

async function runAnalysis(): Promise<void> {
  console.log('Starting Hook dependency analysis...');

  const analyzer = new DependencyAnalyzer();
  const graph = analyzer.analyze();

  console.log(`\nAnalyzed ${graph.nodes.length} hook types`);
  console.log(`Found ${graph.edges.length} dependencies`);
  console.log(`Identified ${graph.parallelGroups.length} parallel groups`);
  console.log(`Identified ${graph.serialChains.length} serial chains`);

  const outputDir = join(process.cwd(), '.omc');
  mkdirSync(outputDir, { recursive: true });

  const outputPath = join(outputDir, 'hooks-dependency-graph.json');
  writeFileSync(outputPath, JSON.stringify(graph, null, 2), 'utf8');

  console.log(`\nDependency graph saved to ${outputPath}`);

  console.log('\n=== Parallel Groups (can run concurrently) ===');
  graph.parallelGroups.forEach((group, i) => {
    console.log(`Group ${i + 1}: ${group.join(', ')}`);
  });

  console.log('\n=== Serial Chains (must run sequentially) ===');
  graph.serialChains.forEach((chain, i) => {
    console.log(`Chain ${i + 1}: ${chain.join(' -> ')}`);
  });

  console.log('\n=== Critical Dependencies ===');
  const criticalEdges = graph.edges.filter(e =>
    e.reason.startsWith('write-write') || e.reason.includes('state')
  );
  criticalEdges.forEach(e => {
    console.log(`${e.from} -> ${e.to}: ${e.reason}`);
  });
}

runAnalysis().catch(console.error);
