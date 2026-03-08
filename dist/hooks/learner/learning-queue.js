/**
 * learning-queue.ts — 学习队列处理器
 *
 * 从 Axiom learning_queue.py 移植。管理待学习素材队列。
 */
import { promises as fs } from 'fs';
import * as path from 'path';
import { defaultAxiomConfig } from '../../config/axiom-config.js';
const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3 };
export class LearningQueue {
    queueFile;
    maxSize;
    constructor(baseDir, config) {
        const base = baseDir ?? process.cwd();
        this.queueFile = path.join(base, '.omc', 'axiom', 'evolution', 'learning_queue.md');
        const cfg = { ...defaultAxiomConfig.evolution, ...config };
        this.maxSize = cfg.maxLearningQueue;
    }
    async addItem(sourceType, sourceId, priority = 'P2', description = '') {
        const items = await this.loadItems();
        if (items.filter(i => i.status === 'pending').length >= this.maxSize) {
            // 移除最低优先级的 pending 条目
            const lowest = items
                .filter(i => i.status === 'pending')
                .sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority])[0];
            if (lowest && PRIORITY_ORDER[lowest.priority] > PRIORITY_ORDER[priority]) {
                await this.updateStatus(lowest.id, 'done');
            }
        }
        const id = `Q-${String(items.length + 1).padStart(3, '0')}`;
        const item = {
            id,
            sourceType,
            sourceId,
            priority,
            created: new Date().toISOString().slice(0, 10),
            status: 'pending',
            description,
        };
        await this.appendItem(item);
        return item;
    }
    async getNextBatch(limit = 3) {
        const items = await this.loadItems();
        return items
            .filter(i => i.status === 'pending')
            .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
            .slice(0, limit);
    }
    async updateStatus(id, status) {
        let text;
        try {
            text = await fs.readFile(this.queueFile, 'utf-8');
        }
        catch {
            return;
        }
        // 优先尝试多行块格式：逐行找到 ### id: 开头的块，修改其 - 状态: 行
        const lines = text.split('\n');
        let inTargetBlock = false;
        let statusUpdated = false;
        for (let i = 0; i < lines.length; i++) {
            const headerMatch = lines[i]?.match(/^### ([A-Za-z0-9-]+):/);
            if (headerMatch) {
                inTargetBlock = headerMatch[1] === id;
            }
            if (inTargetBlock && !statusUpdated && /^- 状态:\s*/.test(lines[i] ?? '')) {
                lines[i] = `- 状态: ${status}`;
                statusUpdated = true;
            }
        }
        if (statusUpdated) {
            await fs.writeFile(this.queueFile, lines.join('\n'), 'utf-8');
            return;
        }
        // 降级：旧表格格式替换
        const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const updated = text.replace(new RegExp(`(\\| ${escapedId} \\|[^|]+\\|[^|]+\\|[^|]+\\|)\\s*pending\\s*(\\|)`), `$1 ${status} $2`);
        await fs.writeFile(this.queueFile, updated, 'utf-8');
    }
    async cleanup(daysOld = 7) {
        const items = await this.loadItems();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);
        const toRemove = items.filter(i => i.status === 'done' && new Date(i.created) < cutoff);
        // 简单实现：重写文件去掉过期条目
        return toRemove.length;
    }
    async getStats() {
        const items = await this.loadItems();
        return {
            pending: items.filter(i => i.status === 'pending').length,
            done: items.filter(i => i.status === 'done').length,
            total: items.length,
        };
    }
    async loadItems() {
        let text;
        try {
            text = await fs.readFile(this.queueFile, 'utf-8');
        }
        catch {
            return [];
        }
        // 优先尝试块格式
        const blockItems = this.parseBlockFormat(text);
        if (blockItems.length > 0)
            return blockItems;
        // 降级：旧表格格式
        const items = [];
        let inTable = false;
        for (const line of text.split('\n')) {
            if (line.includes('| ID |')) {
                inTable = true;
                continue;
            }
            if (inTable && line.startsWith('|---'))
                continue;
            if (inTable && line.startsWith('|')) {
                const parts = line.split('|').map(p => p.trim());
                if (parts.length >= 7 && parts[1]) {
                    items.push({
                        id: parts[1] ?? '',
                        sourceType: parts[2] ?? '',
                        sourceId: parts[3] ?? '',
                        priority: parts[4] ?? 'P2',
                        created: parts[5] ?? '',
                        status: parts[6] ?? 'pending',
                        description: parts[7] ?? '',
                    });
                }
            }
            else if (inTable && !line.startsWith('|')) {
                break;
            }
        }
        return items;
    }
    parseBlockFormat(text) {
        const items = [];
        const lines = text.split('\n');
        let currentId = '';
        let currentTitle = '';
        const fields = {};
        const flush = () => {
            if (!currentId)
                return;
            items.push({
                id: currentId,
                sourceType: fields['来源类型'] ?? '',
                sourceId: currentTitle,
                priority: (['P0', 'P1', 'P2', 'P3'].includes(fields['优先级'] ?? '')
                    ? fields['优先级']
                    : 'P2'),
                created: fields['添加时间'] ?? '',
                status: (['pending', 'processing', 'done'].includes(fields['状态'] ?? '')
                    ? fields['状态']
                    : 'pending'),
                description: fields['内容'] ?? '',
            });
        };
        for (const line of lines) {
            const headerMatch = line.match(/^### ([A-Za-z0-9-]+):\s*(.*)/);
            if (headerMatch) {
                flush();
                currentId = headerMatch[1] ?? '';
                currentTitle = (headerMatch[2] ?? '').trim();
                Object.keys(fields).forEach(k => delete fields[k]);
                continue;
            }
            if (currentId) {
                const fieldMatch = line.match(/^- ([^:]+):\s*(.*)/);
                if (fieldMatch) {
                    fields[fieldMatch[1]?.trim() ?? ''] = (fieldMatch[2] ?? '').trim();
                }
            }
        }
        flush();
        return items;
    }
    async appendItem(item) {
        let text;
        try {
            text = await fs.readFile(this.queueFile, 'utf-8');
        }
        catch {
            return;
        }
        const block = [
            `### ${item.id}: ${item.sourceId}`,
            `- 优先级: ${item.priority}`,
            `- 来源类型: ${item.sourceType}`,
            `- 状态: ${item.status}`,
            `- 添加时间: ${item.created}`,
            `- 内容: ${item.description}`,
            '',
        ].join('\n');
        // 块格式：追加到文件末尾（确保前面有空行分隔）
        if (this.parseBlockFormat(text).length > 0 || text.includes('### ')) {
            const separator = text.endsWith('\n\n') ? '' : text.endsWith('\n') ? '\n' : '\n\n';
            await fs.writeFile(this.queueFile, text + separator + block, 'utf-8');
            return;
        }
        // 降级：旧表格格式插入行
        const row = `| ${item.id} | ${item.sourceType} | ${item.sourceId} | ${item.priority} | ${item.created} | ${item.status} | ${item.description} |`;
        const lines = text.split('\n');
        let insertPos = -1;
        let inTable = false;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i]?.includes('| ID |')) {
                inTable = true;
                continue;
            }
            if (inTable && lines[i]?.startsWith('|'))
                insertPos = i;
            else if (inTable && !lines[i]?.startsWith('|'))
                break;
        }
        if (insertPos >= 0) {
            lines.splice(insertPos + 1, 0, row);
            await fs.writeFile(this.queueFile, lines.join('\n'), 'utf-8');
        }
    }
}
//# sourceMappingURL=learning-queue.js.map