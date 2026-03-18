# 测试驱动修复流程 (TDD Checklist)

## 核心原则

**红-绿-重构** 工作流：
1. **红**：编写失败的测试（复现 BUG）
2. **绿**：最小化修复使测试通过
3. **重构**：优化代码，保持测试通过

## 执行步骤

### 1. 复现问题（红）
```typescript
// 示例：修复路径遍历漏洞
describe('assertValidMode', () => {
  it('should reject path traversal attempts', () => {
    expect(() => assertValidMode('../etc/passwd')).toThrow();
    expect(() => assertValidMode('autopilot/../secrets')).toThrow();
  });
});
```

### 2. 最小化修复（绿）
```typescript
export function assertValidMode(mode: string): string {
  const validModes = ['autopilot', 'ultrapilot', 'team', 'ralph'];
  if (!validModes.includes(mode) || mode.includes('/') || mode.includes('..')) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  return mode;
}
```

### 3. 重构优化
```typescript
// 提取常量、改进错误消息、添加类型
const VALID_MODES = ['autopilot', 'ultrapilot', 'team', 'ralph'] as const;
type ValidMode = typeof VALID_MODES[number];

export function assertValidMode(mode: string): ValidMode {
  if (!VALID_MODES.includes(mode as ValidMode)) {
    throw new Error(`Invalid mode "${mode}". Expected: ${VALID_MODES.join(', ')}`);
  }
  if (mode.includes('/') || mode.includes('..')) {
    throw new Error(`Path traversal detected in mode: ${mode}`);
  }
  return mode as ValidMode;
}
```

## 适用场景

| 场景 | 优先级 | 说明 |
|------|--------|------|
| 安全漏洞修复 | P0 | 必须先写测试验证攻击向量 |
| 回归 BUG | P0 | 防止同一问题再次出现 |
| 边界条件错误 | P1 | 覆盖边界情况 |
| 功能变更 | P1 | 确保新旧行为符合预期 |

## 验证检查清单

- [ ] 测试能复现原始问题（红）
- [ ] 修复后测试通过（绿）
- [ ] 相关测试仍然通过（无回归）
- [ ] 边界条件已覆盖
- [ ] 错误消息清晰可读
- [ ] 代码已重构优化
- [ ] 运行 `npm test` 全量通过

## 快速模板

```typescript
// 1. 红：复现 BUG
test('reproduces issue #123', () => {
  expect(buggyFunction(input)).toBe(expectedOutput);
});

// 2. 绿：最小修复
function buggyFunction(input) {
  // 修复逻辑
  return correctOutput;
}

// 3. 重构：优化
function optimizedFunction(input: InputType): OutputType {
  // 清晰、类型安全的实现
  return correctOutput;
}
```

## 参考

- 知识库: K011 (测试驱动修复策略)
- 规范: `docs/dev-standards/dev-standards.md`
- Hook 测试: `src/hooks/__tests__/`
