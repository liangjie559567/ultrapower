# 实现任务模板

委派代码实现、重构或修改任务时使用此模板。

---

## 任务

[需要实现的内容的清晰、具体描述]

示例：
- 为支付处理服务添加错误处理
- 重构 UserController 以使用依赖注入
- 为博客文章 API 端点实现分页
- 为配置模块添加 TypeScript 类型定义

---

## 预期结果

[编排者期望收到的内容]

示例：
- 带测试的可工作实现
- 遵循项目模式的重构代码
- 带适当错误处理的更新文件
- 新功能的文档
- 所做更改的摘要

---

## 背景

[指导实现的背景信息]

示例：
- 此项目使用带 TypeScript 的 Express.js
- 遵循 `src/repositories` 中现有的 repository 模式
- 错误处理应使用自定义 `AppError` 类
- 所有公共 API 应有 JSDoc 注释
- 团队偏好函数式编程风格而非类

---

## 必须做

- 遵循现有代码模式和规范
- 添加适当的错误处理
- 为所有新代码包含 TypeScript 类型
- 为修改的功能编写或更新测试
- 确保向后兼容性
- 运行 linter 并修复所有警告
- [添加任务特定要求]

---

## 不得做

- 不得修改无关文件
- 未经批准不得引入破坏性更改
- 不得跳过类型定义
- 不得提交注释掉的代码
- 不得删除现有测试
- [添加任务特定约束]

---

## 所需技能

- TypeScript/JavaScript 熟练度
- 理解项目架构
- 遵循现有模式的能力
- 测试驱动开发思维
- [添加任务特定技能]

---

## 所需工具

- Read 用于检查现有代码
- Edit 用于进行更改
- Write 用于创建新文件
- Bash 用于运行测试和构建
- [添加任务特定工具]

---

## 使用示例

```typescript
import { createDelegationPrompt } from '@/features/model-routing/prompts';

const prompt = createDelegationPrompt('MEDIUM', 'Add rate limiting middleware', {
  deliverables: 'Rate limiting middleware integrated into Express app with tests',
  successCriteria: 'All tests pass, rate limits enforced correctly, no breaking changes',
  context: `
    Express.js API using TypeScript
    Existing middleware in src/middleware/
    Using express-rate-limit library (already installed)
    Apply rate limits: 100 requests per 15 minutes per IP
  `,
  mustDo: [
    'Create middleware in src/middleware/rate-limit.ts',
    'Apply to all API routes in src/routes/index.ts',
    'Add configuration options via environment variables',
    'Write unit tests in src/middleware/__tests__/rate-limit.test.ts',
    'Add JSDoc documentation',
    'Update README with rate limit information'
  ],
  mustNotDo: [
    'Do not modify existing route handlers',
    'Do not hard-code rate limit values',
    'Do not break existing tests',
    'Do not add dependencies without checking'
  ],
  requiredSkills: [
    'Express.js middleware patterns',
    'TypeScript type definitions',
    'Jest testing framework',
    'Environment variable configuration'
  ],
  requiredTools: [
    'Read to examine existing middleware',
    'Edit to modify route configuration',
    'Write to create new middleware file',
    'Bash to run tests (npm test)'
  ]
});
```

---

## 验证检查清单

标记任务完成前，请确认：

- [ ] 代码编译无 TypeScript 错误
- [ ] 所有测试通过（包括现有测试）
- [ ] Linter 通过无警告
- [ ] 代码遵循项目规范
- [ ] 所有新代码有适当的类型
- [ ] 公共 API 有文档
- [ ] 无 console.log 或调试代码残留
- [ ] 已审查 git diff 确认无意外更改
