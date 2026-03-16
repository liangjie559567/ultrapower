// 使用 Redis 缓存用户信息
const user = await cache.get(`user:${id}`);
if (!user) {
  user = await db.getUser(id);
  await cache.set(`user:${id}`, user, 3600); // 1 小时过期
}
