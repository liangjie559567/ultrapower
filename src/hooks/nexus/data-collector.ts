import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { isNexusEnabled } from './config.js';
import type { SessionEvent } from './types.js';

const EVENTS_SUBDIR = '.omc/nexus/events';

export function getEventsDir(directory: string): string {
  return join(directory, EVENTS_SUBDIR);
}

export async function collectSessionEvent(
  directory: string,
  event: SessionEvent
): Promise<void> {
  try {
    if (!isNexusEnabled(directory)) return;

    const eventsDir = getEventsDir(directory);
    mkdirSync(eventsDir, { recursive: true });

    const timestamp = Date.now();
    const filename = `${event.sessionId}-${timestamp}.json`;
    const filePath = join(eventsDir, filename);

    writeFileSync(filePath, JSON.stringify(event, null, 2), 'utf-8');
  } catch {
    // Silent failure — must never break main flow
  }
}
