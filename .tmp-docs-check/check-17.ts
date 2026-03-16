interface StateAdapter<T> {
  read(sessionId?: string): T | null;
  write(state: T, sessionId?: string): Promise<boolean>;
  writeSync(state: T, sessionId?: string): boolean;
  clear(sessionId?: string): boolean;
  getPath(sessionId?: string): string;
}
