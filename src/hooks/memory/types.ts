/**
 * types.ts — Context Manager 类型定义
 */

export type MemorySection = 'active' | 'decisions' | 'preferences' | 'reflection';

export type TaskStatus = 'IDLE' | 'DRAFTING' | 'CONFIRMING' | 'REVIEWING' | 'DECOMPOSING' | 'IMPLEMENTING' | 'BLOCKED';

export interface ContextStatus {
  activeContext: string;
  lastCheckpoint: string | null;
  sessionId: string;
  taskStatus: TaskStatus;
}

export interface ContextManager {
  read(section: MemorySection): Promise<string>;
  write(section: MemorySection, content: string): Promise<void>;
  merge(section: MemorySection, content: string): Promise<void>;
  clear(section: MemorySection): Promise<void>;
  checkpoint(label: string): Promise<void>;
  restore(label: string): Promise<void>;
  status(): Promise<ContextStatus>;
}
