# 安全规则

## 强制安全检查

任何提交前：
- [ ] 无硬编码密钥（API keys、密码、token）
- [ ] 所有用户输入已验证
- [ ] SQL 注入防护（参数化查询）
- [ ] XSS 防护（HTML 已净化）
- [ ] CSRF 保护已启用
- [ ] 身份验证/授权已验证
- [ ] 所有端点有速率限制
- [ ] 错误信息不泄露敏感数据

## 密钥管理

```typescript
// 绝不：硬编码密钥
const apiKey = "sk-proj-xxxxx"

// 始终：环境变量
const apiKey = process.env.API_KEY
if (!apiKey) throw new Error('API_KEY not configured')
```

## 安全响应协议

发现安全问题时：
1. 立即停止
2. 使用 `security-reviewer` agent
3. 继续前修复关键问题
4. 轮换任何已暴露的密钥
5. 检查整个代码库是否有类似问题

## [自定义] 项目特定安全

在此添加项目特定的安全要求：
- 身份验证方法
- 授权规则
- 数据加密要求
- 合规要求（GDPR、HIPAA 等）
