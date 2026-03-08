/**
 * harvester.ts — 知识收割器
 *
 * 从 Axiom harvester.py 移植。从对话历史和代码变更中提取可复用知识。
 */
import { promises as fs } from 'fs';
import * as path from 'path';
export class KnowledgeHarvester {
    knowledgeDir;
    constructor(baseDir) {
        const base = baseDir ?? process.cwd();
        this.knowledgeDir = path.join(base, '.omc', 'knowledge');
    }
    async nextId() {
        let files;
        try {
            files = await fs.readdir(this.knowledgeDir);
        }
        catch {
            return 'k-001';
        }
        let max = 0;
        for (const f of files) {
            const m = f.match(/^k-(\d+)/);
            if (m)
                max = Math.max(max, parseInt(m[1], 10));
        }
        return `k-${String(max + 1).padStart(3, '0')}`;
    }
    async harvest(sourceType, title, summary, options = {}) {
        const id = await this.nextId();
        const entry = {
            id,
            title,
            category: options.category ?? 'pattern',
            tags: options.tags ?? [],
            confidence: options.confidence ?? 0.7,
            summary,
            details: options.details ?? '',
            codeExample: options.codeExample ?? '',
            related: options.related ?? [],
            references: [sourceType],
            created: new Date().toISOString().slice(0, 10),
        };
        await this.saveEntry(entry);
        return entry;
    }
    async harvestFromErrorFix(errorType, rootCause, solution, tags) {
        return this.harvest('error_fix', `Fix: ${errorType}`, `Root cause: ${rootCause}`, {
            category: 'debugging',
            tags: tags ?? [errorType.toLowerCase().replace(/\s+/g, '-')],
            details: `## Root Cause\n${rootCause}\n\n## Solution\n${solution}`,
            confidence: 0.8,
        });
    }
    async listEntries() {
        let files;
        try {
            files = await fs.readdir(this.knowledgeDir);
        }
        catch {
            return [];
        }
        const entries = [];
        for (const f of files.filter(f => /^k-\d+.*\.md$/.test(f)).sort()) {
            const content = await fs.readFile(path.join(this.knowledgeDir, f), 'utf-8');
            const meta = parseFrontmatter(content);
            if (meta)
                entries.push(meta);
        }
        return entries;
    }
    async search(query) {
        const all = await this.listEntries();
        const q = query.toLowerCase();
        return all.filter(e => {
            const title = (e['title'] ?? '').toLowerCase();
            const tags = (e['tags'] ?? '').toLowerCase();
            const category = (e['category'] ?? '').toLowerCase();
            return title.includes(q) || tags.includes(q) || category.includes(q);
        });
    }
    async saveEntry(entry) {
        await fs.mkdir(this.knowledgeDir, { recursive: true });
        const slug = entry.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').slice(0, 60);
        const filename = `${entry.id}-${slug}.md`;
        const content = entryToMarkdown(entry);
        await fs.writeFile(path.join(this.knowledgeDir, filename), content, 'utf-8');
    }
}
function parseFrontmatter(text) {
    if (!text.startsWith('---\n'))
        return null;
    const end = text.indexOf('\n---\n', 4);
    if (end === -1)
        return null;
    const meta = {};
    for (const line of text.slice(4, end).split('\n')) {
        const idx = line.indexOf(':');
        if (idx === -1)
            continue;
        meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
    return meta;
}
function entryToMarkdown(e) {
    return [
        '---',
        `id: ${e.id}`,
        `title: ${e.title}`,
        `category: ${e.category}`,
        `tags: [${e.tags.join(', ')}]`,
        `created: ${e.created}`,
        `confidence: ${e.confidence}`,
        `references: [${e.references.join(', ')}]`,
        '---',
        '',
        '## Summary',
        e.summary,
        '',
        '## Details',
        e.details,
        ...(e.codeExample ? ['', '## Code Example', '```', e.codeExample, '```'] : []),
        ...(e.related.length ? ['', '## Related Knowledge', ...e.related.map(r => `- ${r}`)] : []),
        '',
    ].join('\n');
}
//# sourceMappingURL=harvester.js.map