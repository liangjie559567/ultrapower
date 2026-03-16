const baseAdapter = await createWorkerAdapter('auto', cwd);
const cachedAdapter = new CachedWorkerAdapter(baseAdapter, 5000); // 5s TTL
