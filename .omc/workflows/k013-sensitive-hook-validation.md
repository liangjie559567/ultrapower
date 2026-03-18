# 敏感Hook验证模式

## 背景
敏感hooks（permission-request、setup、session-end）处理关键安全操作。快速路径验证可能遗漏注入攻击。强制完整Zod验证确保数据完整性和安全性。

## 实现步骤

1. **识别敏感hooks**
   ```typescript
   const SENSITIVE_HOOKS = new Set([
     'permission-request',
     'setup',
     'session-end'
   ]);
   ```

2. **实现验证路由**
   ```typescript
   // bridge-normalize.ts
   if (SENSITIVE_HOOKS.has(hookType)) {
     // 强制完整验证，跳过快速路径
     return fullZodValidation(input);
   } else {
     // 非敏感hooks可使用快速路径
     return fastPathValidation(input);
   }
   ```

3. **完整Zod验证**
   - 验证所有必需字段
   - 检查字段类型和格式
   - 拒绝未知字段
   - 记录验证失败原因

4. **审计日志**
   - 记录所有敏感hook调用
   - 保存验证结果
   - 追踪异常请求

## 验证方法

- 运行单元测试验证敏感hooks强制完整验证
- 尝试注入恶意数据，确认被拒绝
- 检查审计日志记录完整
- 性能测试确认验证开销可接受

## 注意事项

- **不要跳过验证**：敏感hooks必须完整验证
- **白名单字段**：只接受已知字段，拒绝未知字段
- **错误消息**：不要泄露内部实现细节
- **定期审计**：检查是否有新的敏感hooks需要添加
