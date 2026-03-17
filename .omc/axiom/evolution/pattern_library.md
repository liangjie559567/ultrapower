# Axiom Pattern Library

## 代码模式

### P001: Mock外部依赖模式
- **模式名称**: Mock外部依赖以统一测试环境
- **出现次数**: 1
- **代码示例**:
  ```typescript
  vi.mock('../../src/features/auto-update', () => ({
    isTeamEnabled: () => true
  }));
  ```
- **适用场景**: 测试依赖环境变量或外部配置
- **效果**: 消除环境差异,提升测试稳定性
- **状态**: 待观察 (需>=3次出现提升)

### P002: 类型守卫函数模式
- **模式名称**: 使用类型守卫替代any类型断言
- **出现次数**: 1
- **代码示例**:
  ```typescript
  export function isString(value: unknown): value is string {
    return typeof value === 'string';
  }
  export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
  ```
- **适用场景**: 处理unknown类型、运行时类型验证
- **效果**: 提升类型安全，避免any扩散
- **状态**: 待观察 (需>=3次出现提升)

### P003: 最小化变更原则
- **模式名称**: 仅修复必要的any使用，保留合理场景
- **出现次数**: 1
- **应用场景**:
  - 动态JSON解析 → 保留any
  - 第三方库适配 → 保留any
  - 通用表格渲染 → 保留any
  - 业务逻辑类型 → 替换为unknown或具体类型
- **效果**: 避免过度工程，保持代码可维护性
- **状态**: 待观察 (需>=3次出现提升)

## 提升规则
- 出现次数 >= 3 次提升为高置信度模式
