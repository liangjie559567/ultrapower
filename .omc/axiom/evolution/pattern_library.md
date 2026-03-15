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

## 提升规则
- 出现次数 >= 3 次提升为高置信度模式
