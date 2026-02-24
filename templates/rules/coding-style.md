# 编码风格规则

## 不可变性（关键）

始终创建新对象，绝不修改：

```javascript
// 错误：修改
function updateUser(user, name) {
  user.name = name  // 修改！
  return user
}

// 正确：不可变性
function updateUser(user, name) {
  return { ...user, name }
}
```

## 文件组织

多个小文件 > 少数大文件：
- 高内聚，低耦合
- 典型 200-400 行，最多 800 行
- 从大型组件中提取工具函数
- 按功能/领域组织，而非按类型

## 错误处理

始终全面处理错误：

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('User-friendly error message')
}
```

## 输入验证

始终验证用户输入：

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

const validated = schema.parse(input)
```

## 代码质量清单

标记工作完成前：
- [ ] 代码可读且命名良好
- [ ] 函数小巧（<50 行）
- [ ] 文件聚焦（<800 行）
- [ ] 无深层嵌套（>4 层）
- [ ] 适当的错误处理
- [ ] 无 console.log 语句
- [ ] 无硬编码值
- [ ] 使用不可变模式

## [自定义] 项目特定风格

在此添加项目特定的编码风格规则：
- 命名约定
- 文件结构要求
- 框架特定模式
