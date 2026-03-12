import * as fs from 'fs/promises';
import * as path from 'path';
import type { TutorialState } from './types.js';

const STATE_PATH = path.join(process.cwd(), '.omc/onboarding/tutorial-state.json');

export class StateManager {
  static async load(): Promise<TutorialState | null> {
    try {
      const data = await fs.readFile(STATE_PATH, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  static async save(state: TutorialState): Promise<void> {
    await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
    await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2));
  }

  static async update(updates: Partial<TutorialState>): Promise<void> {
    const current = await this.load();
    if (current) {
      await this.save({ ...current, ...updates });
    }
  }
}
