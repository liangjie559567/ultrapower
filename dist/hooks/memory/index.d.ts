/**
 * index.ts — Context Manager 实现
 *
 * 从 Axiom context_manager.py 移植的 TypeScript 版本。
 * 提供 7 个操作：read/write/merge/clear/checkpoint/restore/status
 */
import type { ContextManager, ContextStatus, MemorySection } from './types.js';
export declare class FileContextManager implements ContextManager {
    private readonly baseDir;
    constructor(baseDir?: string);
    private resolvePath;
    read(section: MemorySection): Promise<string>;
    write(section: MemorySection, content: string): Promise<void>;
    merge(section: MemorySection, content: string): Promise<void>;
    clear(section: MemorySection): Promise<void>;
    checkpoint(label: string): Promise<void>;
    restore(label: string): Promise<void>;
    status(): Promise<ContextStatus>;
}
export { CHECKPOINT_DIR, SECTION_FILES } from './constants.js';
export type { ContextManager, ContextStatus, MemorySection } from './types.js';
//# sourceMappingURL=index.d.ts.map