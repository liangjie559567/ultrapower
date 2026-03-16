// 使用 JWT 生成 Token
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// 验证 Token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
