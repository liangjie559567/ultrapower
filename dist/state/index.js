/**
 * 统一状态管理层 - StateManager
 *
 * 提供统一接口，支持文件系统和 SQLite 后端，支持双写模式渐进迁移
 */
import { FileStateAdapter } from '../lib/state-adapter.js';
export class StateManager {
    adapter;
    options;
    constructor(options) {
        this.options = options;
        // 当前仅支持文件后端，SQLite 后端预留
        this.adapter = new FileStateAdapter(options.mode, options.directory);
    }
    read(sessionId) {
        return this.adapter.read(sessionId);
    }
    async write(data, sessionId) {
        return this.adapter.write(data, sessionId);
    }
    writeSync(data, sessionId) {
        return this.adapter.writeSync(data, sessionId);
    }
    clear(sessionId) {
        return this.adapter.clear(sessionId);
    }
    exists(sessionId) {
        return this.adapter.exists(sessionId);
    }
    getPath(sessionId) {
        return this.adapter.getPath(sessionId);
    }
    list() {
        return this.adapter.list();
    }
}
export function createStateManager(options) {
    return new StateManager(options);
}
//# sourceMappingURL=index.js.map