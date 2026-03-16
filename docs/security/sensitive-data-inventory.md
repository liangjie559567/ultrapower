# 敏感数据清单

## 敏感字段白名单

| 字段名 | 类型 | 风险等级 | 加密要求 | 说明 |
|--------|------|----------|----------|------|
| apiKey | string | 高 | 必须 | API 密钥 |
| token | string | 高 | 必须 | 认证令牌 |
| credential | string | 高 | 必须 | 凭证信息 |
| password | string | 高 | 必须 | 密码 |
| secret | string | 高 | 必须 | 密钥 |
| privateKey | string | 高 | 必须 | 私钥 |
| accessToken | string | 高 | 必须 | 访问令牌 |
| refreshToken | string | 高 | 必须 | 刷新令牌 |
| sessionId | string | 中 | 推荐 | 会话标识 |
| authToken | string | 高 | 必须 | 认证令牌 |
| bearerToken | string | 高 | 必须 | Bearer 令牌 |
| clientSecret | string | 高 | 必须 | 客户端密钥 |
| encryptionKey | string | 高 | 必须 | 加密密钥 |
| signingKey | string | 高 | 必须 | 签名密钥 |
| webhookSecret | string | 高 | 必须 | Webhook 密钥 |

## 扫描规则

### 正则模式

```typescript
const SENSITIVE_PATTERNS = {
  apiKey: /(api[_-]?key|apikey)/i,
  token: /(token|bearer)/i,
  credential: /(credential|cred)/i,
  password: /(password|passwd|pwd)/i,
  secret: /(secret|private[_-]?key|privatekey)/i,
  accessToken: /(access[_-]?token|accesstoken)/i,
  refreshToken: /(refresh[_-]?token|refreshtoken)/i,
  authToken: /(auth[_-]?token|authtoken)/i,
  clientSecret: /(client[_-]?secret|clientsecret)/i,
  encryptionKey: /(encryption[_-]?key|encryptionkey)/i,
  signingKey: /(signing[_-]?key|signingkey)/i,
  webhookSecret: /(webhook[_-]?secret|webhooksecret)/i
};
```

### 扫描范围

- 状态文件 (`.omc/state/**/*.json`)
- 配置文件 (`*.json`, `*.yaml`, `*.yml`)
- 环境变量文件 (`.env*`)
- 日志文件 (`*.log`)

### 排除路径

- `node_modules/`
- `dist/`
- `.git/`
- `*.test.ts`
- `*.spec.ts`

## 加密策略

### 算法规范

- **算法**: AES-256-GCM
- **密钥长度**: 256 位
- **IV 长度**: 12 字节
- **认证标签长度**: 16 字节

### 密钥来源

1. **主密钥**: 从环境变量 `OMC_ENCRYPTION_KEY` 读取
2. **备用方案**: 使用 `crypto.scryptSync()` 从用户标识派生
3. **密钥格式**: Base64 编码的 32 字节随机数据

### 加密流程

```typescript
// 1. 生成随机 IV
const iv = crypto.randomBytes(12);

// 2. 创建加密器
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

// 3. 加密数据
const encrypted = Buffer.concat([
  cipher.update(plaintext, 'utf8'),
  cipher.final()
]);

// 4. 获取认证标签
const authTag = cipher.getAuthTag();

// 5. 组合输出: iv + authTag + encrypted
const result = Buffer.concat([iv, authTag, encrypted]).toString('base64');
```

## 密钥管理

### 密钥轮换

- **轮换周期**: 90 天
- **触发条件**:
  - 定期轮换到期
  - 密钥泄露事件
  - 安全审计要求
- **轮换流程**:
  1. 生成新密钥
  2. 使用新密钥重新加密所有敏感数据
  3. 安全销毁旧密钥
  4. 更新环境变量

### 密钥存储

- **生产环境**: 使用密钥管理服务 (KMS)
- **开发环境**: 环境变量 (`.env.local`, 不提交)
- **CI/CD**: 加密的 secrets 存储

### 密钥访问控制

- 仅加密/解密模块可访问密钥
- 密钥不得记录到日志
- 密钥不得通过网络传输（除 KMS）

## 检测与响应

### 自动检测

- **静态扫描**: 构建时扫描代码和配置文件
- **运行时监控**: 检测未加密的敏感数据写入
- **日志审计**: 定期扫描日志文件

### 响应流程

1. **检测到泄露**:
   - 立即停止操作
   - 记录泄露事件
   - 通知管理员

2. **修复措施**:
   - 加密泄露的数据
   - 轮换受影响的密钥
   - 更新访问控制

3. **事后审查**:
   - 分析泄露原因
   - 更新扫描规则
   - 改进防护措施

## 合规要求

- **GDPR**: 个人数据必须加密存储
- **PCI DSS**: 支付相关数据必须加密
- **SOC 2**: 敏感数据访问必须审计
- **HIPAA**: 健康数据必须加密传输和存储

## 审计日志

所有敏感数据操作必须记录：

```typescript
interface SensitiveDataAuditLog {
  timestamp: string;
  operation: 'encrypt' | 'decrypt' | 'access' | 'rotate';
  fieldName: string;
  userId?: string;
  success: boolean;
  errorMessage?: string;
}
```

日志存储位置: `.omc/logs/sensitive-data-audit.log`
