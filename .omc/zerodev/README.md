# ZeroDev - 零代码开发者全流程 AI 辅助系统

**版本**: 1.0.0
**状态**: ✅ 生产就绪

ZeroDev 是一个智能 AI Agent 系统，帮助开发者从需求到代码的全流程自动化。

## 核心功能

### 1. 需求澄清 (requirement-clarifier)

自动识别平台类型、提取需求、多轮对话澄清细节。

**支持平台**:
- Web 应用
- Mobile 应用
- REST API
- Desktop 应用
- Browser Plugin

**核心能力**:
- 平台自动识别（基于关键词 + 项目记忆）
- 需求结构化（功能需求 + 非功能需求）
- 多轮对话（最多 10 轮）
- 项目记忆集成

### 2. 代码生成 (code-generator)

基于模板匹配生成高质量 TypeScript 代码。

**支持模板**:
- JWT 认证 (`auth/jwt-auth.ts.template`)
- REST CRUD (`crud/rest-crud.ts.template`)
- S3 文件上传 (`upload/s3-upload.ts.template`)
- Stripe 支付 (`payment/stripe-payment.ts.template`)
- 邮件通知 (`notification/email-notification.ts.template`)

**核心能力**:
- 智能模板匹配
- 变量替换
- LSP 类型检查（真实编译验证）
- 质量评分（0-100 分）

## 快速开始

### 安装

```bash
npm install @liangjie559567/ultrapower
```

### 基础使用

```typescript
import { detectPlatform, extractRequirements } from 'ultrapower/agents/zerodev/requirement-clarifier';
import { matchTemplate, generateCode, checkQuality } from 'ultrapower/agents/zerodev/code-generator';

// 1. 识别平台
const platform = detectPlatform('我想做一个网站');
console.log(platform); // 'web'

// 2. 提取需求
const requirements = extractRequirements('用户可以添加、编辑、删除待办事项');
console.log(requirements.functional); // ['添加待办事项', '编辑待办事项', '删除待办事项']

// 3. 匹配模板
const template = matchTemplate('JWT 认证');
console.log(template); // 'auth/jwt-auth.ts.template'

// 4. 生成代码
const code = generateCode(template, { className: 'AuthService' });
console.log(code); // TypeScript 代码

// 5. 质量检查
const quality = await checkQuality(code);
console.log(quality.score); // 85
```

## API 参考

详见 [API.md](./API.md)

## 示例

详见 [examples/](./examples/) 目录

## 架构

```
ZeroDev (5-Agent 协作系统)
├── requirement-clarifier    # 需求澄清
│   ├── detectPlatform()     # 平台识别
│   ├── extractRequirements()# 需求提取
│   └── loadProjectMemory()  # 项目记忆
├── tech-selector            # 技术栈选择 (Sprint 1)
│   └── selectTechStack()    # 前端/后端/数据库推荐
├── code-generator           # 代码生成
│   ├── matchTemplate()      # 模板匹配
│   ├── generateCode()       # 代码生成
│   └── checkQuality()       # 质量检查
├── opensource-analyzer      # 开源库分析 (Sprint 1)
│   └── analyzeLibrary()     # 许可证兼容性检查
├── deployment-manager       # 部署配置 (Sprint 1)
│   └── generateDeploymentConfig() # Docker/Serverless 配置
└── state-manager            # 状态管理
    ├── readState()          # 读取状态
    └── writeState()         # 写入状态
```

## 测试

```bash
npm test -- tests/agents/zerodev/
```

**测试覆盖**:
- 79 个测试用例（Sprint 1-3 完成）
- 100% 通过率
- 执行时间: 626ms
- 覆盖类型: 单元测试、集成测试、性能测试、E2E 测试

## 性能

| 指标 | 目标 | 实际 |
|------|------|------|
| 平台识别 | <10s | <10ms |
| 需求提取 | <10s | <10ms |
| 代码生成 | <60s | <10ms |
| 质量检查 | <500ms | <300ms |

## 安全

- ✅ 输入验证（长度限制、特殊字符过滤）
- ✅ DoS 防护（输入大小限制）
- ✅ 原型污染防护（vars 对象深度检查）
- ✅ 注入攻击防护（特殊字符过滤）

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 PR！
