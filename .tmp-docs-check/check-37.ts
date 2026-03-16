writeSync(data: T, sessionId?: string): boolean {
  return this.adapter.writeSync(data, sessionId);
}
