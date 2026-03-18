# K012: 快速验证策略检查清单

## 目的
修复前先验证现状，避免重复工作、误判和不必要的修改。

## 强制执行点
所有 BUG 修复、功能增强、重构任务开始前必须执行此检查清单。

## 检查清单

### 1. 检查现有实现 ✓
```bash
# 搜索相关函数/模块
grep -r "functionName" src/

# 检查是否已有类似实现
grep -r "similar pattern" src/
```

**验证点**:
- [ ] 功能是否已存在？
- [ ] 是否有类似实现可复用？
- [ ] 当前实现的设计模式是什么？

### 2. 检查现有测试 ✓
```bash
# 搜索相关测试
grep -r "functionName" tests/ **/*.test.ts

# 检查测试覆盖率
npm test -- --coverage --testPathPattern="relevant"
```

**验证点**:
- [ ] 是否已有测试覆盖？
- [ ] 测试是否通过？
- [ ] 测试是否充分？

### 3. 运行相关测试 ✓
```bash
# 运行特定测试文件
npm test -- path/to/test.test.ts

# 运行相关测试套件
npm test -- --testNamePattern="pattern"
```

**验证点**:
- [ ] 当前测试状态如何？
- [ ] 是否存在已知失败？
- [ ] 失败原因是什么？

### 4. 检查文档和注释 ✓
```bash
# 检查相关文档
find docs/ -name "*.md" -exec grep -l "topic" {} \;

# 检查代码注释
grep -B 5 -A 10 "functionName" src/
```

**验证点**:
- [ ] 是否有设计文档？
- [ ] 是否有已知限制？
- [ ] 是否有历史背景？

## 决策树

```
开始修复任务
    ↓
执行检查清单 (1-4)
    ↓
功能已存在？
    ├─ 是 → 停止，避免重复工作
    └─ 否 → 继续
         ↓
    测试已覆盖？
         ├─ 是 → 检查测试是否通过
         │        ├─ 通过 → 可能是误报，重新评估
         │        └─ 失败 → 分析失败原因
         └─ 否 → 继续修复，添加测试
```

## 反模式（禁止）

❌ **直接开始编码**
```typescript
// 错误：未检查现有实现就开始写
function newFeature() { ... }
```

❌ **假设测试不存在**
```bash
# 错误：未搜索就认为没有测试
npm test -- new-test.test.ts  # 可能已存在！
```

❌ **忽略失败测试**
```bash
# 错误：看到失败就认为需要修复
# 可能是环境问题或已知问题
```

## 正确模式

✅ **先验证再行动**
```bash
# 1. 搜索现有实现
grep -r "featureName" src/

# 2. 搜索现有测试
grep -r "featureName" tests/

# 3. 运行测试查看状态
npm test -- --testPathPattern="feature"

# 4. 基于验证结果决定行动
```

## 时间投入
- 检查清单执行: 2-5 分钟
- 避免的浪费时间: 30-120 分钟（重复工作、误判修复）
- ROI: 10-40x

## 集成到工作流

### Git Hook (可选)
```bash
# .git/hooks/pre-commit
echo "⚠️  记得执行 K012 快速验证检查清单"
```

### IDE 提醒
在 `.vscode/settings.json` 添加：
```json
{
  "todo-tree.general.tags": ["K012"],
  "todo-tree.highlights.defaultHighlight": {
    "foreground": "yellow"
  }
}
```

## 成功指标
- 减少重复实现: 目标 0 次/月
- 减少误判修复: 目标 0 次/月
- 提升首次修复准确率: 目标 >95%

## 相关知识
- K001: 测试环境隔离模式
- K011: 测试驱动修复策略
- K009: 最小化修复原则
