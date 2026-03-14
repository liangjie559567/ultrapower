import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export class MetricsStorage {
  private static getPath(cwd: string): string {
    const dir = join(cwd, '.omc', 'metrics');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return join(dir, 'usage.json');
  }

  static save(data: any, cwd: string): void {
    writeFileSync(this.getPath(cwd), JSON.stringify(data, null, 2));
  }

  static load(cwd: string): any {
    const path = this.getPath(cwd);
    if (!existsSync(path)) return { sessions: [], skills: [], agents: [] };
    return JSON.parse(readFileSync(path, 'utf-8'));
  }
}
