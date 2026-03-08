/**
 * confidence.ts — 置信度衰减引擎
 *
 * 从 Axiom confidence.py 移植。管理知识条目的置信度分数生命周期。
 */
import { promises as fs } from 'fs';
import * as path from 'path';
import { defaultAxiomConfig } from '../../config/axiom-config.js';
export class ConfidenceEngine {
    knowledgeDir;
    config;
    static VERIFY_BOOST = 0.1;
    static REFERENCE_BOOST = 0.05;
    static MISLEADING_PENALTY = -0.2;
    static UNUSED_DECAY = -0.1;
    constructor(baseDir, config) {
        const base = baseDir ?? process.cwd();
        this.knowledgeDir = path.join(base, '.omc', 'knowledge');
        this.config = { ...defaultAxiomConfig.evolution, ...config };
    }
    async onVerified(kid) {
        return this.adjust(kid, ConfidenceEngine.VERIFY_BOOST);
    }
    async onReferenced(kid) {
        return this.adjust(kid, ConfidenceEngine.REFERENCE_BOOST);
    }
    async onMisleading(kid) {
        return this.adjust(kid, ConfidenceEngine.MISLEADING_PENALTY);
    }
    async decayUnused(days) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (days ?? this.config.decayDays));
        const decayed = [];
        let files;
        try {
            files = await fs.readdir(this.knowledgeDir);
        }
        catch {
            return [];
        }
        for (const file of files.filter(f => /^k-\d+.*\.md$/.test(f))) {
            const filePath = path.join(this.knowledgeDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const meta = parseFrontmatter(content);
            if (!meta)
                continue;
            const createdStr = meta['created'] ?? '';
            const created = new Date(createdStr);
            if (isNaN(created.getTime()) || created > cutoff)
                continue;
            const oldConf = parseFloat(meta['confidence'] ?? '0.7') || 0.7;
            const newConf = Math.max(0, Math.round((oldConf + ConfidenceEngine.UNUSED_DECAY) * 100) / 100);
            await setConfidence(filePath, content, newConf);
            decayed.push({
                id: meta['id'] ?? file,
                oldConfidence: oldConf,
                newConfidence: newConf,
                deprecated: newConf < this.config.minConfidence,
            });
        }
        return decayed;
    }
    /** 获取置信度低于阈值的条目（对齐 Python get_deprecated） */
    async getDeprecated() {
        let files;
        try {
            files = await fs.readdir(this.knowledgeDir);
        }
        catch {
            return [];
        }
        const deprecated = [];
        for (const file of files.filter(f => /^k-\d+.*\.md$/.test(f))) {
            const filePath = path.join(this.knowledgeDir, file);
            const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
            const meta = parseFrontmatter(content);
            if (!meta)
                continue;
            const conf = parseFloat(meta['confidence'] ?? '0.7') || 0.7;
            if (conf < this.config.minConfidence) {
                deprecated.push({
                    id: meta['id'] ?? file,
                    oldConfidence: conf,
                    newConfidence: conf,
                    deprecated: true,
                });
            }
        }
        return deprecated;
    }
    async getConfidence(kid) {
        const filePath = await findFile(this.knowledgeDir, kid);
        if (!filePath)
            return null;
        const content = await fs.readFile(filePath, 'utf-8');
        const meta = parseFrontmatter(content);
        return meta ? parseFloat(meta['confidence'] ?? '0.7') || 0.7 : null;
    }
    async adjust(kid, delta) {
        const filePath = await findFile(this.knowledgeDir, kid);
        if (!filePath)
            return null;
        const content = await fs.readFile(filePath, 'utf-8');
        const meta = parseFrontmatter(content);
        if (!meta)
            return null;
        const oldConf = parseFloat(meta['confidence'] ?? '0.7') || 0.7;
        const newConf = Math.max(0, Math.min(1, Math.round((oldConf + delta) * 100) / 100));
        await setConfidence(filePath, content, newConf);
        return newConf;
    }
}
// ── Helpers ──
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
async function findFile(dir, kid) {
    try {
        const files = await fs.readdir(dir);
        const match = files.find(f => f.startsWith(`${kid}-`) || f === `${kid}.md`);
        return match ? path.join(dir, match) : null;
    }
    catch {
        return null;
    }
}
async function setConfidence(filePath, content, value) {
    const updated = content.replace(/(confidence:\s*)\S+/, `$1${value}`);
    await fs.writeFile(filePath, updated, 'utf-8');
}
/**
 * Decay confidence of a KnowledgeUnit if last_used is >= decayDays ago.
 * @param unit - The knowledge unit to potentially decay
 * @param decayDays - Days threshold (default 30)
 * @param decayFactor - Multiplier applied when decaying (default 0.9)
 * @param minConfidence - Floor value (default 0.1)
 * @param nowMs - Current time in ms (injectable for testing)
 */
export function decayConfidence(unit, decayDays = 30, decayFactor = 0.9, minConfidence = 0.1, nowMs) {
    const now = nowMs ?? Date.now();
    const lastUsed = new Date(unit.last_used).getTime();
    const daysDiff = (now - lastUsed) / (1000 * 60 * 60 * 24);
    if (daysDiff < decayDays)
        return unit;
    const newConfidence = Math.max(minConfidence, Math.round(unit.confidence * decayFactor * 100) / 100);
    return { ...unit, confidence: newConfidence };
}
//# sourceMappingURL=confidence.js.map