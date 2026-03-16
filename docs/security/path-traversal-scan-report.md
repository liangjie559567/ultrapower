# 路径遍历漏洞扫描报告

**扫描日期**: 2026-03-16
**扫描工具**: Grep pattern matching
**扫描范围**: 所有 .ts 文件

## 扫描摘要

- **扫描文件数**: 47
- **发现风险点**: 8
- **高风险**: 4
- **中风险**: 0
- **低风险**: 4

## 高风险点

### 1. src/hooks/state/StateReader.ts:8

```typescript
const statePath = join(worktreeRoot, ".omc", "state", `${mode}-state.json`);
```

**风险等级**: 高
**原因**: 直接使用未校验的 `mode` 参数进行路径拼接，可能导致路径遍历攻击
**修复优先级**: P0
**影响范围**: Hook 系统状态读取
**建议修复**:
```typescript
import { assertValidMode } from '../../lib/validateMode.js';
const validMode = assertValidMode(mode);
const statePath = join(worktreeRoot, ".omc", "state", `${validMode}-state.json`);
```

---

### 2. src/state/migration/integrity.ts:42

```typescript
const statePath = join(directory, '.omc', 'state', `${mode}-state.json`);
```

**风险等级**: 高
**原因**: 迁移工具中未校验 `mode` 参数，可能在迁移过程中被利用
**修复优先级**: P0
**影响范围**: 状态迁移系统
**建议修复**: 在函数入口处添加 `assertValidMode(mode)`

---

### 3. src/state/migration/integrity.ts:69

```typescript
const statePath = join(directory, '.omc', 'state', `${mode}-state.json`);
```

**风险等级**: 高
**原因**: 回滚功能中未校验 `mode` 参数
**修复优先级**: P0
**影响范围**: 状态回滚系统
**建议修复**: 在函数入口处添加 `assertValidMode(mode)`

---

### 4. src/state/migration/integrity.ts:87

```typescript
const statePath = join(directory, '.omc', 'state', `${mode}-state.json`);
```

**风险等级**: 高
**原因**: 完整性验证中未校验 `mode` 参数
**修复优先级**: P0
**影响范围**: 状态完整性验证
**建议修复**: 在函数入口处添加 `assertValidMode(mode)`

---

## 低风险点

### 5. src/state/migration/index.ts:23

```typescript
const legacyPath = join(directory, '.omc', 'state', `${mode}-state.json`);
```

**风险等级**: 低
**原因**: 函数签名使用 `ValidMode` 类型，但未在运行时校验
**修复优先级**: P2
**影响范围**: 状态迁移
**建议修复**: 添加运行时校验 `assertValidMode(mode)` 以确保类型安全

---

### 6. src/state/migration/index.ts:60

```typescript
const statePath = join(directory, '.omc', 'state', `${mode}-state.json`);
```

**风险等级**: 低
**原因**: 函数签名使用 `ValidMode` 类型，但未在运行时校验
**修复优先级**: P2
**影响范围**: 状态备份
**建议修复**: 添加运行时校验

---

### 7. src/lib/state-adapter.ts:62

```typescript
return join(this.directory, '.omc', 'state', `${this.mode}-state.json`);
```

**风险等级**: 低
**原因**: 构造函数中已通过 `assertValidMode(mode)` 校验，但 `this.mode` 可能被修改
**修复优先级**: P3
**影响范围**: 状态适配器
**当前状态**: 已有部分防护（构造函数校验）
**建议**: 将 `mode` 字段设为 `readonly` 防止修改

---

### 8. src/state/migration/integrity.ts:119

```typescript
const pattern = `${mode}-state.json.backup-`;
```

**风险等级**: 低
**原因**: 用于文件名匹配模式，不直接用于路径拼接，但仍应校验
**修复优先级**: P3
**影响范围**: 备份清理
**建议修复**: 添加 `assertValidMode(mode)` 确保一致性

---

## 已防护的安全实现（参考示例）

以下文件已正确实现路径遍历防护：

### src/tools/state-tools.ts

```typescript
// 正确示例：在函数入口处校验
const validMode = assertValidMode(mode);
// 后续使用 validMode 而非 mode
```

### src/lib/validateMode.ts

提供了完整的校验工具：
- `assertValidMode()`: 运行时校验并抛出异常
- `isValidMode()`: 布尔检查
- `ValidMode` 类型：编译时类型安全

---

## 修复优先级清单

### P0 - 立即修复（高风险）

1. **[P0]** src/hooks/state/StateReader.ts:8 - Hook 状态读取未校验
2. **[P0]** src/state/migration/integrity.ts:42 - 迁移工具未校验
3. **[P0]** src/state/migration/integrity.ts:69 - 回滚功能未校验
4. **[P0]** src/state/migration/integrity.ts:87 - 完整性验证未校验

### P2 - 短期修复（中风险）

5. **[P2]** src/state/migration/index.ts:23 - 添加运行时校验
6. **[P2]** src/state/migration/index.ts:60 - 添加运行时校验

### P3 - 长期改进（低风险）

7. **[P3]** src/lib/state-adapter.ts:62 - 将 mode 字段设为 readonly
8. **[P3]** src/state/migration/integrity.ts:119 - 备份模式匹配校验

---

## 修复模板

### 标准修复模式

```typescript
// 修复前
function someFunction(mode: string, directory: string) {
  const path = join(directory, '.omc', 'state', `${mode}-state.json`);
  // ...
}

// 修复后
import { assertValidMode } from './lib/validateMode.js';

function someFunction(mode: string, directory: string) {
  const validMode = assertValidMode(mode); // 添加校验
  const path = join(directory, '.omc', 'state', `${validMode}-state.json`);
  // ...
}
```

---

## 测试验证建议

修复后应执行以下测试：

1. **单元测试**: 验证非法 mode 值被正确拒绝
2. **集成测试**: 确保合法 mode 值正常工作
3. **安全测试**: 尝试路径遍历攻击（如 `../../../etc/passwd`）

---

## 附录：扫描方法

### 搜索模式

1. `\$\{mode\}` - 直接模板字符串插值
2. `.omc/state/.*mode` - 状态路径模式
3. `\$\{.*mode.*\}` - 包含 mode 的所有插值

### 排除项

- 测试文件中的示例代码（已标注）
- 注释和文档中的示例
- 日志输出和错误消息（非路径拼接）

---

**报告生成**: 自动化扫描
**下一步行动**: 按优先级修复 P0 高风险点
