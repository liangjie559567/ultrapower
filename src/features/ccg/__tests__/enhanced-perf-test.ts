import { performance } from 'perf_hooks';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const TEMP_DIR = join(process.cwd(), '.test-perf-enhanced');
const REPORT_DIR = join(process.cwd(), '.omc', 'axiom');

interface PerfResult {
  scenario: string;
  fileCount: number;
  duration: number;
  throughput: number;
  memoryDelta: number;
}

const results: PerfResult[] = [];

function createProject(dir: string, fileCount: number, complexity: 'simple' | 'complex') {
  mkdirSync(dir, { recursive: true });

  const content = complexity === 'simple'
    ? (i: number) => `export const val${i} = ${i};`
    : (i: number) => `
import { dep${i % 10} } from './dep';
export class Class${i} {
  method() { return ${i}; }
}`;

  for (let i = 0; i < fileCount; i++) {
    const subDir = join(dir, `mod-${Math.floor(i / 20)}`);
    mkdirSync(subDir, { recursive: true });
    writeFileSync(join(subDir, `file-${i}.ts`), content(i));
  }

  writeFileSync(join(dir, 'package.json'), '{"name":"test"}');
}

async function runScenario(name: string, fileCount: number, complexity: 'simple' | 'complex'): Promise<PerfResult> {
  const dir = join(TEMP_DIR, name.replace(/\s+/g, '-'));
  const memBefore = process.memoryUsage().heapUsed;
  const start = performance.now();

  createProject(dir, fileCount, complexity);
  const { readdirSync } = await import('fs');
  const files = readdirSync(dir, { recursive: true });

  const duration = performance.now() - start;
  const memoryDelta = (process.memoryUsage().heapUsed - memBefore) / 1024 / 1024;
  const throughput = fileCount / duration;

  return { scenario: name, fileCount, duration, throughput, memoryDelta };
}

function generateEnhancedReport(results: PerfResult[]): string {
  const avgThroughput = results.reduce((sum, r) => sum + r.throughput, 0) / results.length;
  const maxDuration = Math.max(...results.map(r => r.duration));
  const totalMemory = results.reduce((sum, r) => sum + Math.abs(r.memoryDelta), 0);

  let report = `# CCG Workflow 增强性能测试报告\n\n`;
  report += `**生成时间**: ${new Date().toISOString()}\n\n`;
  report += `## 性能指标\n\n`;
  report += `- 平均吞吐量: ${avgThroughput.toFixed(2)} 文件/ms\n`;
  report += `- 最大执行时间: ${maxDuration.toFixed(2)}ms\n`;
  report += `- 总内存使用: ${totalMemory.toFixed(2)}MB\n\n`;
  report += `## 测试场景\n\n`;

  results.forEach(r => {
    report += `### ${r.scenario}\n`;
    report += `- 文件数: ${r.fileCount}\n`;
    report += `- 执行时间: ${r.duration.toFixed(2)}ms\n`;
    report += `- 吞吐量: ${r.throughput.toFixed(2)} 文件/ms\n`;
    report += `- 内存: ${r.memoryDelta.toFixed(2)}MB\n\n`;
  });

  report += `## 瓶颈分析\n\n`;
  const slowest = results.reduce((a, b) => a.duration > b.duration ? a : b);
  report += `- 最慢场景: ${slowest.scenario} (${slowest.duration.toFixed(2)}ms)\n`;
  report += `- 建议: 对于 ${slowest.fileCount}+ 文件项目，考虑并行处理\n\n`;

  report += `## 优化建议\n\n`;
  report += `1. 实现文件扫描缓存机制\n`;
  report += `2. 对大型项目启用增量处理\n`;
  report += `3. 优化内存使用，避免 GC 压力\n`;

  return report;
}

async function main() {
  mkdirSync(TEMP_DIR, { recursive: true });
  mkdirSync(REPORT_DIR, { recursive: true });

  console.log('[PERF] 开始增强性能测试...\n');

  results.push(await runScenario('小型项目-简单', 50, 'simple'));
  results.push(await runScenario('中型项目-简单', 100, 'simple'));
  results.push(await runScenario('大型项目-简单', 200, 'simple'));
  results.push(await runScenario('中型项目-复杂', 100, 'complex'));

  const report = generateEnhancedReport(results);
  const reportPath = join(REPORT_DIR, 'performance-report.md');
  writeFileSync(reportPath, report);

  console.log(`[PERF] 报告已生成: ${reportPath}`);
  rmSync(TEMP_DIR, { recursive: true, force: true });
}

main().catch(console.error);
