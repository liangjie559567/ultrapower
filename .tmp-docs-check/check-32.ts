const walPath = path.join(this.walDir, `${id}.wal`);
fs.writeFileSync(walPath, JSON.stringify(entry, null, 2));
