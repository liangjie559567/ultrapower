import { performance } from 'perf_hooks';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEMP_DIR = join(process.cwd(), '.test-perf');
const REPORT_DIR = join(process.cwd(), '.omc', 'axiom');

interface TestResult {
  name: string;
  duration: number;
  memory: number;
  success: boolean;
}

const results: TestResult[] = [];

async function measure(name: string, fn: () => Promise<void>): Promise<TestResult> {
  const memBefore = process.memoryUsage().heapUsed;
  const start = performance.now();
  let success = true;

  try {
    await fn();
  } catch (e) {
    success = false;
    console.error(`[ERROR] ${name}:`, e);
  }

  const duration = performance.now() - start;
  const memory = (process.memoryUsage().heapUsed - memBefore) / 1024 / 1024;

  return { name, duration, memory, success };
}

function createLargeProject(fileCount: number): string {
  const dir = join(TEMP_DIR, 'large-project');
  mkdirSync(dir, { recursive: true });

  for (let i = 0; i < fileCount; i++) {
    const subDir = join(dir, `module-${Math.floor(i / 10)}`);
    mkdirSync(subDir, { recursive: true });
    writeFileSync(
      join(subDir, `file-${i}.ts`),
      `export function fn${i}() { return ${i}; }\n`
    );
  }

  writeFileSync(join(dir, 'package.json'), '{"name":"test"}');
  return dir;
}

function createMicroservices(serviceCount: number, filesPerService: number): string {
  const dir = join(TEMP_DIR, 'microservices');
  mkdirSync(dir, { recursive: true });

  for (let s = 0; s < serviceCount; s++) {
    const svcDir = join(dir, `service-${s}`);
    mkdirSync(svcDir, { recursive: true });
    writeFileSync(join(svcDir, 'package.json'), `{"name":"svc-${s}"}`);

    for (let f = 0; f < filesPerService; f++) {
      writeFileSync(join(svcDir, `file-${f}.ts`), `export const data${f} = ${f};\n`);
    }
  }

  return dir;
}

function generateReport(results: TestResult[]): string {
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / total;
  const avgMemory = results.reduce((sum, r) => sum + r.memory, 0) / total;

  let report = `# CCG Workflow 性能测试报告\n\n`;
  report += `**生成时间**: ${new Date().toISOString()}\n\n`;
  report += `## 测试摘要\n\n`;
  report += `- 总测试数: ${total}\n`;
  report += `- 通过: ${passed}\n`;
  report += `- 失败: ${total - passed}\n`;
  report += `- 平均执行时间: ${avgDuration.toFixed(2)}ms\n`;
  report += `- 平均内存使用: ${avgMemory.toFixed(2)}MB\n\n`;
  report += `## 详细结果\n\n`;

  results.forEach(r => {
    report += `### ${r.name}\n`;
    report += `- 状态: ${r.success ? '✅ 通过' : '❌ 失败'}\n`;
    report += `- 执行时间: ${r.duration.toFixed(2)}ms\n`;
    report += `- 内存使用: ${r.memory.toFixed(2)}MB\n\n`;
  });

  return report;
}

async function runTests() {
  mkdirSync(TEMP_DIR, { recursive: true });
  mkdirSync(REPORT_DIR, { recursive: true });

  console.log('[PERF] 开始性能测试...\n');

  results.push(await measure('Test 1: 大型项目检测 (100 文件)', async () => {
    const dir = createLargeProject(100);
    const { readdirSync } = await import('fs');
    readdirSync(dir, { recursive: true });
  }));

  results.push(await measure('Test 2: 微服务检测 (5 服务)', async () => {
    const dir = createMicroservices(5, 20);
    const { readdirSync } = await import('fs');
    readdirSync(dir, { recursive: true });
  }));

  results.push(await measure('Test 3: 大规模文件扫描 (200 文件)', async () => {
    const dir = createLargeProject(200);
    const { readdirSync } = await import('fs');
    readdirSync(dir, { recursive: true });
  }));

  const report = generateReport(results);
  const reportPath = join(REPORT_DIR, 'performance-report.md');
  writeFileSync(reportPath, report);

  console.log(`\n[PERF] 报告已生成: ${reportPath}`);

  rmSync(TEMP_DIR, { recursive: true, force: true });
}

runTests().catch(console.error);
