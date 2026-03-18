import { promises as fs } from 'fs';
import path from 'path';
export class ZeroDevStateManager {
    stateDir = '.omc/zerodev/state';
    async readState(agentType, sessionId) {
        const filePath = path.join(this.stateDir, `${agentType}-${sessionId}.json`);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw new Error(`Failed to read state: ${error.message}`);
        }
    }
    async writeState(agentType, sessionId, state) {
        await fs.mkdir(this.stateDir, { recursive: true });
        const filePath = path.join(this.stateDir, `${agentType}-${sessionId}.json`);
        await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    }
    async clearState(agentType, sessionId) {
        const filePath = path.join(this.stateDir, `${agentType}-${sessionId}.json`);
        try {
            await fs.unlink(filePath);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw new Error(`Failed to clear state: ${error.message}`);
            }
        }
    }
}
//# sourceMappingURL=state-manager.js.map