export interface StateManagerOptions {
  mode: ValidMode;
  directory: string;
  backend?: 'file' | 'sqlite';
  dualWrite?: boolean; // 双写模式：同时写入旧版和新版
}

export class StateManager<T = Record<string, unknown>> {
  read(sessionId?: string): T | null;
  async write(data: T, sessionId?: string): Promise<boolean>;
  writeSync(data: T, sessionId?: string): boolean;
  clear(sessionId?: string): boolean;
  exists(sessionId?: string): boolean;
  getPath(sessionId?: string): string;
  list(): string[];
}
