# ZeroDev API 参考

## requirement-clarifier

### detectPlatform()

识别用户需求的目标平台。

**签名**:
```typescript
function detectPlatform(
  requirement: string,
  projectMemory?: { techStack?: string[] }
): 'web' | 'mobile' | 'api' | 'desktop' | 'plugin'
```

**参数**:
- `requirement`: 用户需求描述（≤1000 字符）
- `projectMemory`: 可选的项目记忆对象

**返回**: 平台类型

**示例**:
```typescript
detectPlatform('我想做一个网站'); // 'web'
detectPlatform('做个应用', { techStack: ['React Native'] }); // 'mobile'
```

**异常**:
- `InputError`: 输入为空或 null
- `ValidationError`: 输入超过 1000 字符

---

### extractRequirements()

从需求描述中提取结构化需求。

**签名**:
```typescript
function extractRequirements(requirement: string): {
  functional: string[];
  nonFunctional: string[];
}
```

**参数**:
- `requirement`: 需求描述（≤5000 字符）

**返回**: 包含功能需求和非功能需求的对象

**示例**:
```typescript
const reqs = extractRequirements('用户可以添加、编辑待办事项，响应时间 <2s');
// {
//   functional: ['添加待办事项', '编辑待办事项'],
//   nonFunctional: ['响应时间 <2s']
// }
```

**异常**:
- `InputError`: 输入为空或 null
- `ValidationError`: 输入超过 5000 字符

---

## code-generator

### matchTemplate()

根据需求匹配最合适的代码模板。

**签名**:
```typescript
function matchTemplate(requirement: string): string
```

**参数**:
- `requirement`: 需求描述（≤500 字符）

**返回**: 模板路径

**示例**:
```typescript
matchTemplate('JWT 认证'); // 'auth/jwt-auth.ts.template'
matchTemplate('文件上传'); // 'upload/s3-upload.ts.template'
```

**异常**:
- `InputError`: 输入为空
- `ValidationError`: 输入超过 500 字符
- `Error`: 未找到匹配模板

---

### generateCode()

基于模板生成代码。

**签名**:
```typescript
function generateCode(
  template: string,
  vars: Record<string, string>
): string
```

**参数**:
- `template`: 模板路径
- `vars`: 变量对象（必须包含 `className`，总大小 <10KB）

**返回**: 生成的 TypeScript 代码

**示例**:
```typescript
const code = generateCode('auth/jwt-auth.ts.template', {
  className: 'AuthService',
  secretKey: 'my-secret'
});
```

**异常**:
- `InputError`: template 为空或 vars 缺少 className
- `ValidationError`: className 格式无效或 vars 过大

---

### checkQuality()

检查代码质量（使用 LSP 真实类型检查）。

**签名**:
```typescript
async function checkQuality(code: string): Promise<{
  score: number;
  errors: string[];
  warnings: string[];
}>
```

**参数**:
- `code`: 待检查的代码

**返回**: 质量报告对象
- `score`: 质量分数（0-100）
- `errors`: 错误列表
- `warnings`: 警告列表

**示例**:
```typescript
const result = await checkQuality('export class Test {}');
// { score: 100, errors: [], warnings: [] }
```

**降级策略**: LSP 不可用时自动回退到启发式检查

---

## state-manager

### readState()

读取 Agent 状态。

**签名**:
```typescript
async function readState<T>(
  agentType: string,
  sessionId: string
): Promise<T | null>
```

---

### writeState()

写入 Agent 状态。

**签名**:
```typescript
async function writeState<T>(
  agentType: string,
  sessionId: string,
  state: T
): Promise<void>
```

---

## 错误类型

### ValidationError

输入验证失败（格式、长度、大小限制）。

### InputError

输入内容不合法（空值、null、undefined）。
