import { promises as fs } from 'fs';
import { join } from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
const ARCHIVE_RULES = [
    { pattern: /.*-verification-report\.md$/, maxAgeDays: 7, targetDir: 'reports' },
    { pattern: /^review-.*-v\d+\.md$/, maxAgeDays: 14, targetDir: 'reviews' },
];
export async function archiveOldDocuments(sourceDir, archiveBaseDir, maxCount = 30) {
    const archived = [];
    const errors = [];
    try {
        const files = await fs.readdir(sourceDir);
        const stats = await Promise.all(files.map(async (f) => ({
            name: f,
            path: join(sourceDir, f),
            stat: await fs.stat(join(sourceDir, f)).catch(() => null),
        })));
        const docs = stats.filter((s) => s.stat?.isFile() && s.name.endsWith('.md'));
        if (docs.length <= maxCount)
            return { archived, errors };
        const sorted = docs.sort((a, b) => (a.stat.mtime.getTime() - b.stat.mtime.getTime()));
        const toArchive = sorted.slice(0, docs.length - maxCount);
        for (const doc of toArchive) {
            try {
                const rule = ARCHIVE_RULES.find((r) => r.pattern.test(doc.name));
                const targetDir = rule ? join(archiveBaseDir, rule.targetDir) : archiveBaseDir;
                await fs.mkdir(targetDir, { recursive: true });
                const gzPath = join(targetDir, `${doc.name}.gz`);
                await pipeline(createReadStream(doc.path), createGzip(), createWriteStream(gzPath));
                await fs.stat(gzPath);
                await fs.unlink(doc.path);
                archived.push(doc.name);
            }
            catch (err) {
                errors.push(`${doc.name}: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
    }
    catch (err) {
        errors.push(`Archive failed: ${err}`);
    }
    return { archived, errors };
}
export async function archiveByAge(sourceDir, archiveBaseDir) {
    const archived = [];
    const errors = [];
    const now = Date.now();
    try {
        const files = await fs.readdir(sourceDir);
        for (const file of files) {
            const filePath = join(sourceDir, file);
            const stat = await fs.stat(filePath).catch(() => null);
            if (!stat?.isFile() || !file.endsWith('.md'))
                continue;
            const rule = ARCHIVE_RULES.find((r) => r.pattern.test(file));
            if (!rule)
                continue;
            const ageDays = (now - stat.mtime.getTime()) / (1000 * 60 * 60 * 24);
            if (ageDays < rule.maxAgeDays)
                continue;
            try {
                const targetDir = join(archiveBaseDir, rule.targetDir);
                await fs.mkdir(targetDir, { recursive: true });
                const gzPath = join(targetDir, `${file}.gz`);
                await pipeline(createReadStream(filePath), createGzip(), createWriteStream(gzPath));
                await fs.stat(gzPath);
                await fs.unlink(filePath);
                archived.push(file);
            }
            catch (err) {
                errors.push(`${file}: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
    }
    catch (err) {
        errors.push(`Age-based archive failed: ${err}`);
    }
    return { archived, errors };
}
//# sourceMappingURL=archiver.js.map