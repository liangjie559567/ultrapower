/**
 * index-manager.ts — 知识索引管理器
 *
 * 从 Axiom index_manager.py 移植。管理 .omc/knowledge/ 目录的索引文件。
 */
import { promises as fs } from 'fs';
import * as path from 'path';
export class KnowledgeIndexManager {
    knowledgeDir;
    indexFile;
    constructor(baseDir) {
        const base = baseDir ?? process.cwd();
        this.knowledgeDir = path.join(base, '.omc', 'knowledge');
        // 与 Python 源码对齐：使用 knowledge_base.md 作为索引文件
        this.indexFile = path.join(base, '.omc', 'axiom', 'evolution', 'knowledge_base.md');
    }
    async rebuildIndex() {
        let files;
        try {
            files = await fs.readdir(this.knowledgeDir);
        }
        catch {
            return [];
        }
        const entries = [];
        for (const file of files.filter(f => /^k-\d+.*\.md$/.test(f) && f !== 'index.md')) {
            const filePath = path.join(this.knowledgeDir, file);
            const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
            const meta = parseFrontmatter(content);
            if (!meta)
                continue;
            entries.push({
                id: meta['id'] ?? file.replace('.md', ''),
                title: meta['title'] ?? '',
                category: meta['category'] ?? 'general',
                confidence: parseFloat(meta['confidence'] ?? '0.7') || 0.7,
                created: meta['created'] ?? '',
                file,
            });
        }
        entries.sort((a, b) => a.id.localeCompare(b.id));
        await this.writeIndex(entries);
        return entries;
    }
    async addToIndex(entry) {
        const entries = await this.loadIndex();
        const existing = entries.findIndex(e => e.id === entry.id);
        if (existing >= 0) {
            entries[existing] = entry;
        }
        else {
            entries.push(entry);
        }
        await this.writeIndex(entries);
    }
    /** 从索引中移除指定条目（对齐 Python remove_from_index） */
    async removeFromIndex(id) {
        const entries = await this.loadIndex();
        const filtered = entries.filter(e => e.id !== id);
        if (filtered.length !== entries.length) {
            await this.writeIndex(filtered);
        }
    }
    /** 更新指定条目的置信度（对齐 Python update_confidence） */
    async updateConfidence(id, newConfidence) {
        const entries = await this.loadIndex();
        const entry = entries.find(e => e.id === id);
        if (entry) {
            entry.confidence = newConfidence;
            await this.writeIndex(entries);
        }
    }
    /**
     * 按关键词过滤知识库条目（对齐 --filter 参数）。
     *
     * 匹配规则：title 或 category 包含关键词（includes，大小写不敏感）。
     * 关键词长度超过 256 字符时抛出 Error。
     */
    async filterByKeyword(keyword) {
        if (keyword.length > 256) {
            throw new Error(`[index-manager] --filter 关键词超过 256 字符限制（当前 ${keyword.length} 字符）`);
        }
        const all = await this.loadIndex();
        const kw = keyword.toLowerCase();
        const entries = all.filter(e => e.title.toLowerCase().includes(kw) || e.category.toLowerCase().includes(kw));
        return { entries, total: all.length };
    }
    /**
     * 按分类精确过滤知识库条目（对齐 --category 参数）。
     *
     * 匹配规则：category 字段精确匹配（大小写不敏感）。
     */
    async filterByCategory(category) {
        const all = await this.loadIndex();
        const cat = category.toLowerCase();
        const entries = all.filter(e => e.category.toLowerCase() === cat);
        return { entries, total: all.length };
    }
    async loadIndex() {
        let text;
        try {
            text = await fs.readFile(this.indexFile, 'utf-8');
        }
        catch {
            return [];
        }
        const entries = [];
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
                if (parts.length >= 6 && parts[1]) {
                    entries.push({
                        id: parts[1] ?? '',
                        title: parts[2] ?? '',
                        category: parts[3] ?? '',
                        confidence: parseFloat(parts[4] ?? '0.7') || 0.7,
                        created: parts[5] ?? '',
                        file: `${parts[1]}.md`,
                    });
                }
            }
            else if (inTable && !line.startsWith('|')) {
                break;
            }
        }
        return entries;
    }
    async writeIndex(entries) {
        await fs.mkdir(path.dirname(this.indexFile), { recursive: true });
        // 分类统计（对齐 Python _generate_index）
        const categoryCount = {};
        for (const e of entries) {
            categoryCount[e.category] = (categoryCount[e.category] ?? 0) + 1;
        }
        const categoryLines = Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, cnt]) => `| ${cat} | ${cnt} |`);
        // 标签云（从 title 提取关键词）
        const wordFreq = {};
        for (const e of entries) {
            for (const word of e.title.toLowerCase().split(/\W+/).filter(w => w.length > 3)) {
                wordFreq[word] = (wordFreq[word] ?? 0) + 1;
            }
        }
        const tagCloud = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([w, c]) => `${w}(${c})`)
            .join(' ');
        const lines = [
            '# Knowledge Base Index',
            '',
            `> Last updated: ${new Date().toISOString().slice(0, 10)} | Total: ${entries.length} entries`,
            '',
            '## Knowledge Index',
            '',
            '| ID | Title | Category | Confidence | Created | Status |',
            '|---|---|---|---|---|---|',
            ...entries.map(e => `| ${e.id} | ${e.title} | ${e.category} | ${e.confidence.toFixed(2)} | ${e.created} | active |`),
            '',
            '## Category Statistics',
            '',
            '| Category | Count |',
            '|---|---|',
            ...categoryLines,
            '',
            '## Tag Cloud',
            '',
            tagCloud || '(empty)',
            '',
            '## Quality Management',
            '',
            `- High confidence (≥0.8): ${entries.filter(e => e.confidence >= 0.8).length}`,
            `- Medium confidence (0.5-0.8): ${entries.filter(e => e.confidence >= 0.5 && e.confidence < 0.8).length}`,
            `- Low confidence (<0.5): ${entries.filter(e => e.confidence < 0.5).length}`,
            '',
        ];
        await fs.writeFile(this.indexFile, lines.join('\n'), 'utf-8');
    }
}
/**
 * 从外部 JSON 文件导入知识条目，以 namespace 隔离追加到索引。
 * 重复 id（同 namespace）跳过。
 */
export async function importKnowledge(filePath, namespace, baseDir) {
    const raw = await fs.readFile(filePath, 'utf-8');
    const units = JSON.parse(raw);
    const manager = new KnowledgeIndexManager(baseDir);
    const existing = await manager.loadIndex();
    const existingIds = new Set(existing.map(e => e.id));
    let imported = 0;
    let skipped = 0;
    for (const u of units) {
        const nsId = `${namespace}::${u.id}`;
        if (existingIds.has(nsId)) {
            skipped++;
            continue;
        }
        await manager.addToIndex({
            id: nsId,
            title: u.title,
            category: u.category ?? 'general',
            confidence: u.confidence ?? 0.7,
            created: u.created ?? new Date().toISOString().slice(0, 10),
            file: `${nsId}.md`,
        });
        imported++;
    }
    return { imported, skipped, namespace };
}
function parseFrontmatter(text) {
    if (!text.startsWith('---\n'))
        return null;
    const end = text.indexOf('\n---\n', 4);
    if (end === -1)
        return null;
    const raw = text.slice(4, end);
    const meta = {};
    for (const line of raw.split('\n')) {
        const idx = line.indexOf(':');
        if (idx === -1)
            continue;
        meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
    return meta;
}
//# sourceMappingURL=index-manager.js.map