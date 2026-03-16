const meta: LockMeta = { pid: process.pid, timestamp: Date.now() };
fs.writeFileSync(lockFile, JSON.stringify(meta), 'utf8');
