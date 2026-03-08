# CCG Workflow 最佳实践

## 需求阶段最佳实践

### 1. 编写清晰的需求

**好的需求**:
```markdown
## 功能：用户认证

### 描述
用户可以通过邮箱和密码登录系统。

### 验收标准
- 用户输入正确的邮箱和密码后，系统返回有效的 JWT Token
- 用户输入错误的密码后，系统返回 401 错误
- 用户输入不存在的邮箱后，系统返回 401 错误
- 登录响应时间 < 500ms

### 非功能需求
- 支持 1000 并发用户
- 密码使用 bcrypt 加密
- Token 有效期 24 小时
```

**不好的需求**:
```markdown
## 功能：用户认证

### 描述
实现用户登录功能。

### 验收标准
- 能登录
- 安全
```

### 2. 包含竞品对比

在需求文档中添加竞品分析，帮助 Claude 理解市场需求：

```markdown
## 竞品对比

### 竞品 A：Firebase Auth
- 优势：支持多种认证方式、自动扩展
- 不足：成本高、定制性差

### 竞品 B：Auth0
- 优势：功能完整、安全性高
- 不足：学习曲线陡、配置复杂

### 我们的差异化
- 轻量级：无需外部依赖
- 高性能：响应时间 < 100ms
- 易集成：简单的 API 设计
```

### 3. 明确约束条件

```markdown
## 约束条件

### 技术栈
- 后端：Node.js 18+
- 数据库：PostgreSQL 13+
- 缓存：Redis 6+

### 时间限制
- 需求阶段：1 天
- 开发阶段：3 天
- 测试阶段：1 天

### 资源限制
- 最多 2 个开发者
- 服务器：2 核 4GB 内存
```

---

## 开发阶段最佳实践

### 1. 定期检查生成的代码

**每个周期完成后**:

```bash
# 查看代码变更
git diff HEAD~1

# 运行编译检查
npm run build

# 运行测试
npm test

# 检查代码风格
npm run lint
```

### 2. 保持代码风格一致

在技术设计文档中明确代码风格要求：

```markdown
## 代码风格

### 命名规范
- 函数名：camelCase
- 类名：PascalCase
- 常量：UPPER_SNAKE_CASE

### 文件组织
- 每个模块一个目录
- 相关文件放在同一目录
- 导出统一通过 index.ts

### 注释规范
- 函数必须有 JSDoc 注释
- 复杂逻辑必须有行注释
- TODO 注释必须标注优先级
```

### 3. 及时反馈问题

如果发现代码问题，立即反馈给 Claude：

```markdown
## 问题反馈

### 问题 1：缺少错误处理
- 位置：src/auth/login.ts:45
- 描述：未处理数据库连接失败的情况
- 建议：添加 try-catch 块

### 问题 2：性能问题
- 位置：src/user/query.ts:20
- 描述：每次查询都执行 N+1 查询
- 建议：使用 JOIN 优化查询
```

---

## 优化循环最佳实践

### 1. 区分阻断项和优化项

**阻断项**（必须修复）:
- 功能不完整
- 安全漏洞
- 性能严重不足
- 编译错误

**优化项**（建议修复）:
- 代码可读性
- 性能微调
- 文档完善
- 测试覆盖率提升

### 2. 优化清单示例

```markdown
# 优化清单 - 第 1 轮

## 🔴 阻断项（必须修复）

### 1. 缺少错误处理
- 文件：src/auth/login.ts
- 问题：未处理数据库错误
- 修复方案：添加 try-catch 块
- 优先级：P0

### 2. SQL 注入漏洞
- 文件：src/user/query.ts
- 问题：直接拼接 SQL 字符串
- 修复方案：使用参数化查询
- 优先级：P0

## 🟡 优化项（建议修复）

### 1. 添加请求日志
- 文件：src/middleware/logger.ts
- 建议：记录所有 API 请求
- 优先级：P2

### 2. 优化数据库索引
- 文件：src/db/schema.ts
- 建议：为常用查询字段添加索引
- 优先级：P2
```

### 3. 控制优化轮数

- 第 1 轮：修复所有阻断项
- 第 2 轮：修复遗漏的阻断项 + 部分优化项
- 第 3 轮：修复剩余优化项
- 第 4-5 轮：微调和完善

如果达到 5 轮仍未收敛，停止优化，进入测试阶段。

---

## 测试循环最佳实践

### 1. 编写完整的测试清单

```markdown
# 测试清单

## 单元测试

### 认证模块
- [ ] validateEmail() - 有效邮箱
- [ ] validateEmail() - 无效邮箱
- [ ] hashPassword() - 密码加密
- [ ] comparePassword() - 密码验证

### 用户模块
- [ ] createUser() - 成功创建
- [ ] createUser() - 邮箱已存在
- [ ] getUser() - 用户存在
- [ ] getUser() - 用户不存在

## 集成测试

### 登录流程
- [ ] 正常登录 - 返回 Token
- [ ] 密码错误 - 返回 401
- [ ] 用户不存在 - 返回 401
- [ ] 账户被锁定 - 返回 403

### 注册流程
- [ ] 成功注册 - 返回用户信息
- [ ] 邮箱已存在 - 返回 409
- [ ] 邮箱格式错误 - 返回 400
- [ ] 验证邮件发送 - 成功

## 性能测试

- [ ] 登录响应时间 < 500ms
- [ ] 注册响应时间 < 1000ms
- [ ] 吞吐量 > 1000 req/s
- [ ] 内存占用 < 100MB

## 安全测试

- [ ] SQL 注入防护
- [ ] XSS 防护
- [ ] CSRF 防护
- [ ] 密码强度验证
```

### 2. 测试失败处理

当测试失败时：

```markdown
## 测试失败报告

### 失败的测试
- 测试名称：validateEmail() - 无效邮箱
- 预期结果：返回 false
- 实际结果：返回 true
- 失败原因：正则表达式不完整

### 修复方案
- 文件：src/validators/email.ts
- 修改：更新正则表达式
- 验证：重新运行测试

### 修复后结果
- 测试通过：✅
```

### 3. 测试覆盖率目标

- 单元测试：> 80%
- 集成测试：> 60%
- 关键路径：100%

---

## 微服务项目最佳实践

### 1. 服务划分

```markdown
## 服务架构

### 认证服务
- 职责：用户认证、Token 管理
- 依赖：无
- API：POST /auth/login, POST /auth/register

### 用户服务
- 职责：用户信息管理
- 依赖：认证服务
- API：GET /users/:id, PUT /users/:id

### 订单服务
- 职责：订单管理
- 依赖：用户服务
- API：POST /orders, GET /orders/:id
```

### 2. 依赖管理

```markdown
## 依赖关系

认证服务
  ↓
用户服务
  ↓
订单服务

## 开发顺序
1. 认证服务（无依赖）
2. 用户服务（依赖认证服务）
3. 订单服务（依赖用户服务）
```

### 3. 跨服务测试

```bash
# 启动所有服务
docker-compose up

# 运行集成测试
npm run test:integration

# 测试服务间通信
curl http://localhost:3001/auth/login
curl http://localhost:3002/users/1
curl http://localhost:3003/orders/1
```

---

## 文档维护最佳实践

### 1. 及时更新文档

- 每个功能完成后，更新功能流程文档
- 每个优化完成后，更新优化清单
- 每个测试完成后，更新测试清单

### 2. 保持文档同步

```bash
# 检查文档是否最新
git diff .omc/ccg/

# 提交文档变更
git add .omc/ccg/
git commit -m "docs: update feature-flow after optimization"
```

### 3. 文档版本管理

```markdown
---
version: 1.0
created: 2026-03-08
updated: 2026-03-08
status: completed
---

## 变更历史

### v1.0 (2026-03-08)
- 初始版本
- 完成所有功能
- 通过所有测试
```

---

## 常见陷阱

### ❌ 不要

1. **跳过需求阶段** - 直接开发会导致功能不符合预期
2. **忽视优化清单** - 阻断项必须修复
3. **跳过测试** - 测试是质量保证
4. **不更新文档** - 文档是知识传递的重要方式
5. **一次性开发大功能** - 应该分周期开发

### ✅ 应该

1. **充分准备需求** - 花时间理解需求
2. **定期检查代码** - 每个周期检查一次
3. **及时反馈问题** - 发现问题立即反馈
4. **完整的测试** - 单元 + 集成 + 性能测试
5. **保持文档最新** - 文档是代码的补充

---

## 性能优化建议

### 1. 数据库优化

```sql
-- 添加索引
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_order_user_id ON orders(user_id);

-- 使用 EXPLAIN 分析查询
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
```

### 2. 缓存策略

```typescript
// 使用 Redis 缓存用户信息
const user = await cache.get(`user:${id}`);
if (!user) {
  user = await db.getUser(id);
  await cache.set(`user:${id}`, user, 3600); // 1 小时过期
}
```

### 3. 异步处理

```typescript
// 发送邮件异步处理
queue.add('send-email', {
  to: user.email,
  subject: 'Welcome',
  body: 'Welcome to our service'
});
```

---

## 安全最佳实践

### 1. 密码安全

```typescript
// 使用 bcrypt 加密密码
const hashedPassword = await bcrypt.hash(password, 10);

// 验证密码
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 2. Token 安全

```typescript
// 使用 JWT 生成 Token
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// 验证 Token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### 3. 输入验证

```typescript
// 验证邮箱格式
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  throw new Error('Invalid email format');
}

// 验证密码强度
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
if (!passwordRegex.test(password)) {
  throw new Error('Password must contain uppercase, lowercase, and number');
}
```

---

## 总结

遵循这些最佳实践，可以确保：

- ✅ 需求清晰，减少返工
- ✅ 代码质量高，易于维护
- ✅ 测试完整，问题及早发现
- ✅ 文档完善，知识易于传递
- ✅ 性能优异，用户体验好
- ✅ 安全可靠，数据得到保护
