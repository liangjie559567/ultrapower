import { promises as fs } from 'fs';
import { join } from 'path';
const VERSION_PATTERN = /^(.+)-v(\d+)\.(\d+)(?:\.(\d+))?\.md$/;
export async function parseVersion(filename, filePath) {
    const match = filename.match(VERSION_PATTERN);
    if (!match)
        return null;
    const [, _name, major, minor, patch = '0'] = match;
    let createdAt = new Date().toISOString();
    if (filePath) {
        try {
            const stat = await fs.stat(filePath);
            createdAt = stat.birthtime.toISOString();
        }
        catch {
            // Fall back to current time
        }
    }
    return {
        filename,
        version: `${major}.${minor}.${patch}`,
        major: parseInt(major, 10),
        minor: parseInt(minor, 10),
        patch: parseInt(patch, 10),
        createdAt,
    };
}
export async function getLatestVersion(dir, baseName) {
    try {
        const files = await fs.readdir(dir);
        const versions = [];
        for (const file of files) {
            const filePath = join(dir, file);
            const info = await parseVersion(file, filePath);
            if (info && file.startsWith(baseName)) {
                versions.push(info);
            }
        }
        if (versions.length === 0)
            return null;
        return versions.sort((a, b) => {
            if (a.major !== b.major)
                return b.major - a.major;
            if (a.minor !== b.minor)
                return b.minor - a.minor;
            return b.patch - a.patch;
        })[0];
    }
    catch (err) {
        throw new Error(`Failed to get latest version: ${err instanceof Error ? err.message : String(err)}`);
    }
}
//# sourceMappingURL=versioning.js.map