import { promises as fs } from 'fs';
import path from 'path';

export class ZeroDevStateManager {
  private stateDir = '.omc/zerodev/state';

  async readState<T>(agentType: string, sessionId: string): Promise<T | null> {
    const filePath = path.join(this.stateDir, `${agentType}-${sessionId}.json`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw new Error(`Failed to read state: ${(error as Error).message}`);
    }
  }

  async writeState<T>(agentType: string, sessionId: string, state: T): Promise<void> {
    await fs.mkdir(this.stateDir, { recursive: true });
    const filePath = path.join(this.stateDir, `${agentType}-${sessionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(state, null, 2));
  }

  async clearState(agentType: string, sessionId: string): Promise<void> {
    const filePath = path.join(this.stateDir, `${agentType}-${sessionId}.json`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new Error(`Failed to clear state: ${(error as Error).message}`);
      }
    }
  }
}
