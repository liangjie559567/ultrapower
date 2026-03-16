import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface MetricsData {
  sessions: Array<{ timestamp: string }>;
  skills: Array<{ timestamp: string; type: string; target: string; success?: boolean; duration?: number }>;
  agents: Array<{ timestamp: string; type: string; target: string; success?: boolean; duration?: number }>;
}

export class MetricsStorage {
  private static getPath(cwd: string): string {
    const dir = join(cwd, '.omc', 'metrics');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return join(dir, 'usage.json');
  }

  static save(data: MetricsData, cwd: string): void {
    writeFileSync(this.getPath(cwd), JSON.stringify(data, null, 2));
  }

  static load(cwd: string): MetricsData {
    const path = this.getPath(cwd);
    if (!existsSync(path)) return { sessions: [], skills: [], agents: [] };
    return JSON.parse(readFileSync(path, 'utf-8')) as MetricsData;
  }
}
